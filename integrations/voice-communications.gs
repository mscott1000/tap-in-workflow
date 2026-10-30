/* Google Voice -> Communications. No Gmail writes or transcript storage. */
var TICVoice = (function () {
  var headers = ['CommunicationID','ContactType','Phone','Date','Time','StaffNotes',
    'ContactLog','Status','FirstName','MiddleName','LastName','ClientRowID',
    'SourceMessageID','SourceTimestamp','MatchDetails'];
  function clean(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
  function digits(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    return d.length === 10 ? d : '';
  }
  function phone(v) {
    var d = digits(v);
    return d ? '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6) : '';
  }
  function phoneIn(v) {
    var m = String(v || '').match(/(?:\+?1[\s.\-]*)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.\-]*\d{3}[\s.\-]*\d{4}/);
    return m ? phone(m[0]) : '';
  }
  function name(v) {
    return clean(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z]/g,'');
  }
  function parts(v) {
    var s = clean(v).replace(/\.$/,'');
    if (!s || /\d/.test(s) || /^(unknown caller|blocked caller|private number)$/i.test(s))
      return {first:'',middle:'',last:''};
    var p = s.split(' ');
    if (/^(jr|sr)\.?$/i.test(p[p.length-1])) p.pop();
    return {first:p[0] || '',last:p.length > 1 ? p.pop() : '',middle:p.slice(1).join(' ')};
  }
  function transcript(raw) {
    var s = String(raw || '').replace(/\r\n?/g,'\n');
    var m = s.match(/Google Voice\s*([\s\S]*?)\s*play message/i) ||
      s.match(/^\s*([\s\S]*?)\s*play message/i);
    return m ? clean(m[1]) : '';
  }
  function parse(subject, plain, html, from) {
    var sender=String(from || '').trim(), address=sender.match(/<([^<>]+)>/);
    if (!/@google\.com$/i.test(address ? address[1] : sender)) return null;
    var m = clean(subject).match(/^New (voicemail|missed call) from (.+?)\.?$/i);
    if (!m) return null;
    var caller = m[2], callerPhone = phoneIn(caller);
    // Never take an arbitrary number from the email footer or transcript.
    if (!callerPhone) {
      var explicit = String(plain || '').match(/(?:you missed a call from|new voicemail from|new missed call from)\s*[:\-]?\s*([+\d(][\d\s().\-]{8,24})/i);
      if (explicit) callerPhone = phoneIn(explicit[1]);
    }
    var htmlText = String(html || '').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ')
      .replace(/&nbsp;/gi,' ').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
    var words = m[1].toLowerCase() === 'voicemail'
      ? (transcript(plain) || transcript(htmlText)).match(/[A-Za-z0-9']+/g) : null;
    var p = parts(caller);
    return {ContactType:words && words.length >= 11 ? 'Voicemail' : 'Missed Call',
      Phone:callerPhone,FirstName:p.first,MiddleName:p.middle,LastName:p.last};
  }
  function matches(record, people) {
    var d = digits(record.Phone), first = name(record.FirstName), last = name(record.LastName);
    return people.filter(function (p) {
      if (d) return (p.phones || []).indexOf(d) !== -1;
      return !!first && !!last && first === name(p.first) && last === name(p.last);
    }).map(function (p) {
      var full = clean([p.first,p.middle,p.last].filter(Boolean).join(' '));
      return (d ? 'Phone match' : 'Possible name match; phone and identity unconfirmed') +
        (full ? ': ' + full : '') + ' — ' + p.source + ', row ' + p.row;
    });
  }
  return {headers:headers,parse:parse,matches:matches,digits:digits,phone:phone};
})();

function runTICVoiceIngest() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;

  try {
    var props = PropertiesService.getScriptProperties();
    var checkpointKey = 'TIC_VOICE_LAST_SUCCESS';
    var now = Date.now();

    // First run: search 3 days.
    // Later runs: search from last success, with 6-hour overlap.
    var lastSuccess = Number(props.getProperty(checkpointKey)) || 0;
    var cutoff = lastSuccess
      ? lastSuccess - 6 * 3600000
      : now - 3 * 86400000;

    var query =
      'after:' + Math.floor(cutoff / 1000) +
      ' {subject:"New missed call from" subject:"New voicemail from"}';

    var book = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = book.getSheetByName('Communications');

    if (!sheet) {
      throw new Error('Communications tab is not configured.');
    }

    var headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(String);

    TICVoice.headers.forEach(function(h) {
      if (headers.indexOf(h) < 0) {
        throw new Error('Missing Communications column: ' + h);
      }
    });

    var keyCol = headers.indexOf('CommunicationID') + 1;

    var existing = new Set(
      sheet.getLastRow() > 1
        ? sheet
            .getRange(2, keyCol, sheet.getLastRow() - 1, 1)
            .getDisplayValues()
            .map(function(r) { return r[0]; })
        : []
    );

    var pending = [];
    var people = null;
    var scanned = 0;
    var batchSize = 50;
    var maxThreads = 500;
    var complete = false;

    for (var start = 0; start < maxThreads; start += batchSize) {
      var threads = GmailApp.search(query, start, batchSize);

      if (!threads.length) {
        complete = true;
        break;
      }

      scanned += threads.length;

      for (var t = 0; t < threads.length; t++) {
        var messages = threads[t].getMessages();

        for (var i = 0; i < messages.length; i++) {
          var msg = messages[i];
          var id = msg.getId();
          var key = 'voice_' + id;

          // Skip messages already recorded.
          if (existing.has(key)) continue;

          var at = msg.getDate();

          // Skip messages outside the current search window.
          if (at.getTime() < cutoff) continue;

          // Reject irrelevant subjects before reading bodies.
          var subject = msg.getSubject();

          if (!/^New (voicemail|missed call) from /i.test(subject)) {
            continue;
          }

          var sender = msg.getFrom();

          if (!/@google\.com(?:>)?$/i.test(sender.trim())) {
            continue;
          }

          // Read the message only after basic validation.
          var plain = msg.getPlainBody();
          var record = TICVoice.parse(subject, plain, '', sender);

          if (!record) continue;

          // Only retrieve HTML when the plain-text version
          // may be insufficient to classify a voicemail.
          if (
            /^New voicemail from /i.test(subject) &&
            record.ContactType === 'Missed Call'
          ) {
            record = TICVoice.parse(
              subject,
              plain,
              msg.getBody(),
              sender
            );
          }

          if (!record) continue;

          // Load client history only when needed.
          if (people === null) {
            people = ticVoicePeople_(book);
          }

          record.CommunicationID = key;
          record.SourceMessageID = id;
          record.SourceTimestamp = at.getTime();

          record.Date = Utilities.formatDate(
            at, 'America/Chicago', 'M/d/yy'
          );

          record.Time = Utilities.formatDate(
            at, 'America/Chicago', 'H:mm'
          );

          var reasons = TICVoice.matches(record, people);

          record.MatchDetails = reasons.join('\n');
          record.StaffNotes = record.MatchDetails;
          record.ContactLog = '';
          record.Status = '';
          record.ClientRowID = '';

          pending.push(headers.map(function(h) {
            var v = record[h] === undefined ? '' : record[h];

            return typeof v === 'string' && /^[=+@-]/.test(v)
              ? "'" + v
              : v;
          }));

          existing.add(key);
        }
      }

      if (threads.length < batchSize) {
        complete = true;
        break;
      }
    }

    // Write all discovered communications.
    if (pending.length) {
      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          pending.length,
          headers.length
        )
        .setValues(pending);
    }

    // Only advance the checkpoint after a complete scan.
    // A partial scan is retried next time without losing records.
    if (complete) {
      props.setProperty(checkpointKey, String(now));
    } else {
      console.warn(
        'Voice ingestion reached thread scan limit. ' +
        'Checkpoint not advanced.'
      );
    }

    console.log(
      'Communications import: created=' + pending.length +
      ', threads=' + scanned +
      ', complete=' + complete
    );

    return {
      created: pending.length,
      threadsScanned: scanned,
      complete: complete
    };

  } finally {
    lock.releaseLock();
  }
}

function ticVoicePeople_(book) {
  var people=[],clients=book.getSheetByName('Clients');
  if (clients && clients.getLastRow()>1) {
    var rows=clients.getDataRange().getDisplayValues(),heads=rows.shift();
    rows.forEach(function(r,i){
      var get=function(h){return r[heads.indexOf(h)] || '';};
      var phones=typeof TICIdentity !== 'undefined' ? TICIdentity.phones(get('Phone')) : [TICVoice.digits(get('Phone'))].filter(Boolean);
      people.push({first:get('FirstName'),middle:get('MiddleName'),last:get('LastName'),phones:phones,source:'Clients',row:i+2});
    });
  }
  if (typeof ticHistory_ === 'function') {
    var history=ticHistory_();
    history.people.forEach(function(p){
      people.push({first:p.first || '',last:p.last || '',
        phones:p.phones || TICIdentity.phones(p.phone),source:p.sourceTab,row:p.sourceRow});
    });
  }
  return people;
}

function testTICVoiceParser() {
  var ten='Google Voice '+Array(10).fill('word').join(' ')+' play message';
  var eleven='Google Voice '+Array(11).fill('word').join(' ')+' play message';
  var sender='Google Voice <voice-noreply@google.com>';
  if(TICVoice.parse('New voicemail from Avery Morgan.',ten,'',sender).ContactType!=='Missed Call') throw new Error('10-word classification');
  if(TICVoice.parse('New voicemail from Avery Morgan.',eleven,'',sender).ContactType!=='Voicemail') throw new Error('11-word classification');
  if(TICVoice.parse('New voicemail from Avery Morgan.',eleven+' Your Google Voice number: (314) 555-0100','',sender).Phone!=='') throw new Error('Footer contamination');
  if(TICVoice.parse('New missed call from (314) 555-0101.','','',sender).Phone!=='(314) 555-0101') throw new Error('Caller extraction');
  if(TICVoice.matches({Phone:'3145550101'},[{phones:['3145550101'],first:'Avery',last:'Morgan',source:'Clients',row:2}]).length!==1) throw new Error('Phone normalization');
  console.log('TICVoice parser: 5 checks passed; no email or spreadsheet writes.');
  return true;
}
