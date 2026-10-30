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

var TIC_VOICE_SYNC = {
  property: 'TIC_VOICE_SYNC_V2', maxMessages: 50, historyPage: 25,
  windowMs: 15 * 60 * 1000, overlapMs: 60 * 1000
};

// User-run once, after source/service installation. Never resets an existing cursor.
function initializeTICVoiceSync() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    ticVoiceRequireService_();
    var props = PropertiesService.getScriptProperties();
    var existing = ticVoiceReadState_(props);
    var at = Date.now(), profile = Gmail.Users.getProfile('me');
    if (existing) {
      ticVoiceAssertMailbox_(existing, profile);
      console.log('Voice sync already initialized; existing progress preserved.');
      return {initialized: true, alreadyInitialized: true, created: 0};
    }
    ticVoiceDestination_(); // Validate exact destination headers before the baseline.
    var state = {version: 2, mode: 'history', anchor: ticVoiceHistoryId_(profile.historyId),
      activationAt: at, coveredAt: at, offset: 0, mailboxKey: ticVoiceMailboxKey_(profile)};
    props.setProperty(TIC_VOICE_SYNC.property, JSON.stringify(state));
    console.log('Voice sync initialized for new notifications; no historical mail imported.');
    return {initialized: true, alreadyInitialized: false, created: 0};
  } finally { lock.releaseLock(); }
}

function runTICVoiceIngest() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {busy: true, created: 0};
  try {
    ticVoiceRequireService_();
    var props = PropertiesService.getScriptProperties(), state = ticVoiceReadState_(props);
    if (!state) throw new Error('Voice sync is not initialized. Initialize the new-arrival baseline before enabling its timer.');
    var started = Date.now(), profile = Gmail.Users.getProfile('me');
    ticVoiceAssertMailbox_(state, profile);
    var page = ticVoicePage_(state, profile, started);
    if (page.transition) {
      props.setProperty(TIC_VOICE_SYNC.property, JSON.stringify(page.next));
      return {created: 0, examined: 0, more: true, mode: page.next.mode, recovery: page.reason};
    }
    var ids = page.ids, end = Math.min(ids.length, state.offset + TIC_VOICE_SYNC.maxMessages);
    var dest = null, people = null, pending = [], deleted = 0;
    if (end > state.offset) dest = ticVoiceDestination_();
    for (var i = state.offset; i < end; i++) {
      var id = ids[i], key = 'voice_' + id;
      if (dest.existing.has(key)) continue;
      var meta;
      try { meta = Gmail.Users.Messages.get('me', id, {format: 'metadata', metadataHeaders: ['From', 'Subject']}); }
      catch (error) {
        if (ticVoiceNotFound_(error)) { deleted++; continue; }
        throw error;
      }
      var headers = {};
      ((meta.payload || {}).headers || []).forEach(function (h) { headers[String(h.name).toLowerCase()] = h.value; });
      var subject = String(headers.subject || ''), sender = String(headers.from || '');
      if (!TICVoice.parse(subject, '', '', sender)) continue; // Headers before bodies.
      var timestamp = Number(meta.internalDate);
      if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error('Voice message has no valid internal receipt date.');
      if (timestamp < state.activationAt || (state.mode === 'recovery' &&
          (timestamp < state.windowStart || timestamp >= state.windowEnd))) continue;
      var msg;
      try { msg = GmailApp.getMessageById(id); }
      catch (error) { if (ticVoiceNotFound_(error)) { deleted++; continue; } throw error; }
      if (!msg) { deleted++; continue; }
      var plain = msg.getPlainBody();
      var record = TICVoice.parse(subject, plain, '', sender);
      if (/^New voicemail from /i.test(subject) && record.ContactType === 'Missed Call') {
        record = TICVoice.parse(subject, plain, msg.getBody(), sender);
      }
      if (people === null) people = ticVoicePeople_(dest.book);
      record.CommunicationID = key; record.SourceMessageID = id; record.SourceTimestamp = timestamp;
      record.Date = Utilities.formatDate(new Date(timestamp), 'America/Chicago', 'M/d/yy');
      record.Time = Utilities.formatDate(new Date(timestamp), 'America/Chicago', 'H:mm');
      record.MatchDetails = TICVoice.matches(record, people).join('\n');
      record.StaffNotes = record.MatchDetails;
      record.ContactLog = ''; record.Status = ''; record.ClientRowID = '';
      pending.push(dest.headers.map(function (h) {
        var value = record[h] === undefined ? '' : record[h];
        return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value;
      }));
      dest.existing.add(key);
    }
    if (pending.length) {
      dest.sheet.getRange(dest.sheet.getLastRow() + 1, 1, pending.length, dest.headers.length).setValues(pending);
      SpreadsheetApp.flush();
    }
    var next = ticVoiceAdvance_(state, page, end, started);
    // If this save fails after the Sheet write, next run deduplicates the same IDs.
    props.setProperty(TIC_VOICE_SYNC.property, JSON.stringify(next.state));
    var result = {created: pending.length, examined: end - state.offset,
      deletedMessagesSkipped: deleted, more: next.more, mode: next.state.mode};
    console.log('Voice sync: created=' + result.created + ', examined=' + result.examined + ', more=' + result.more);
    return result;
  } finally { lock.releaseLock(); }
}

function ticVoiceRequireService_() {
  if (typeof Gmail === 'undefined' || !Gmail.Users || !Gmail.Users.History || !Gmail.Users.Messages) {
    throw new Error('Enable the advanced Gmail service in this Apps Script project before Voice sync setup.');
  }
}

function ticVoiceHistoryId_(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('Invalid Gmail history ID; progress was not advanced.');
  return value; // Never convert opaque decimal history IDs to Number.
}

function ticVoiceMailboxKey_(profile) {
  if (!profile.emailAddress) throw new Error('Gmail did not identify the current mailbox.');
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(profile.emailAddress).trim().toLowerCase())
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function ticVoiceAssertMailbox_(state, profile) {
  if (state.mailboxKey !== ticVoiceMailboxKey_(profile)) {
    throw new Error('Voice sync belongs to another mailbox. Use its original owner account; no progress was reset.');
  }
}

function ticVoiceReadState_(props) {
  var raw = props.getProperty(TIC_VOICE_SYNC.property);
  if (!raw) return null;
  var state;
  try { state = JSON.parse(raw); } catch (e) { throw new Error('Voice sync progress is corrupt; do not reset it silently.'); }
  if (state.version !== 2 || !['history', 'recovery'].includes(state.mode) ||
      !Number.isFinite(state.activationAt) || !Number.isFinite(state.coveredAt) ||
      !Number.isInteger(state.offset) || state.offset < 0 || !/^[a-f0-9]{64}$/.test(state.mailboxKey || '')) {
    throw new Error('Voice sync progress has an unsupported format; no reset was performed.');
  }
  ticVoiceHistoryId_(state.anchor);
  if (state.mode === 'recovery' && (!Number.isFinite(state.windowStart) || !Number.isFinite(state.windowEnd) ||
      !Number.isFinite(state.recoveryEnd) || state.windowStart < state.activationAt ||
      state.windowEnd <= state.windowStart || state.windowEnd > state.recoveryEnd)) {
    throw new Error('Invalid Voice recovery window; no progress was advanced.');
  }
  return state;
}

function ticVoiceNotFound_(error) {
  return Number(error.code || (error.details || {}).code) === 404 ||
    /\b404\b|requested entity was not found/i.test(String(error.message || error));
}

function ticVoiceBadPage_(error, state) {
  return !!state.pageToken && /(?:invalid|expired).*page.?token|page.?token.*(?:invalid|expired)/i.test(String(error.message || error));
}

function ticVoicePage_(state, profile, started) {
  var response;
  try {
    if (state.mode === 'history') {
      var options = {startHistoryId: state.anchor, historyTypes: ['messageAdded'], maxResults: TIC_VOICE_SYNC.historyPage};
      if (state.pageToken) options.pageToken = state.pageToken;
      response = Gmail.Users.History.list('me', options);
    } else {
      var query = 'from:google.com after:' + (Math.floor(state.windowStart / 1000) - 1) +
        ' before:' + (Math.ceil(state.windowEnd / 1000) + 1) +
        ' {subject:"New missed call from" subject:"New voicemail from"}';
      var recovery = {q: query, maxResults: TIC_VOICE_SYNC.maxMessages};
      if (state.pageToken) recovery.pageToken = state.pageToken;
      response = Gmail.Users.Messages.list('me', recovery);
    }
  } catch (error) {
    var retry = Object.assign({}, state);
    if (state.mode === 'history' && ticVoiceNotFound_(error)) {
      // The profile snapshot precedes recoveryEnd, so resumed history overlaps
      // recovery rather than leaving a gap for arrivals during setup.
      retry.anchor = ticVoiceHistoryId_(profile.historyId);
      retry.mode = 'recovery'; retry.recoveryEnd = Date.now();
      retry.windowStart = Math.max(state.activationAt, state.coveredAt - TIC_VOICE_SYNC.overlapMs);
      retry.windowEnd = Math.min(retry.windowStart + TIC_VOICE_SYNC.windowMs, retry.recoveryEnd);
      retry.offset = 0; delete retry.pageToken; delete retry.scanStarted;
      if (retry.windowEnd <= retry.windowStart) throw new Error('Voice recovery has no valid receipt-time window.');
      return {transition: true, next: retry, reason: 'expired-history'};
    }
    if (ticVoiceBadPage_(error, state)) {
      retry.offset = 0; delete retry.pageToken;
      return {transition: true, next: retry, reason: 'restart-page-sequence'};
    }
    throw error;
  }
  var ids = state.mode === 'history' ? [].concat.apply([], (response.history || []).map(function (h) {
    return (h.messagesAdded || []).map(function (m) { return m.message && m.message.id; });
  })) : (response.messages || []).map(function (m) { return m.id; });
  ids = Array.from(new Set(ids.filter(Boolean).map(String)));
  if (state.offset > ids.length) {
    var restart = Object.assign({}, state, {offset: 0}); delete restart.pageToken;
    return {transition: true, next: restart, reason: 'restart-changed-page'};
  }
  if (state.mode === 'history' && !response.nextPageToken) ticVoiceHistoryId_(response.historyId);
  return {ids: ids, nextPageToken: response.nextPageToken || '', historyId: response.historyId,
    scanStarted: state.scanStarted || started};
}

function ticVoiceAdvance_(state, page, end, started) {
  var next = Object.assign({}, state, {offset: end});
  if (end < page.ids.length) {
    if (next.mode === 'history') next.scanStarted = page.scanStarted;
    return {state: next, more: true};
  }
  next.offset = 0;
  if (page.nextPageToken) {
    next.pageToken = page.nextPageToken;
    if (next.mode === 'history') next.scanStarted = page.scanStarted;
    return {state: next, more: true};
  }
  delete next.pageToken;
  if (next.mode === 'history') {
    next.anchor = ticVoiceHistoryId_(page.historyId);
    next.coveredAt = page.scanStarted; delete next.scanStarted;
    return {state: next, more: false};
  }
  next.windowStart = next.windowEnd;
  if (next.windowStart < next.recoveryEnd) {
    next.windowEnd = Math.min(next.windowStart + TIC_VOICE_SYNC.windowMs, next.recoveryEnd);
    return {state: next, more: true};
  }
  next.mode = 'history'; next.coveredAt = next.recoveryEnd;
  delete next.windowStart; delete next.windowEnd; delete next.recoveryEnd;
  return {state: next, more: true}; // Catch changes since the replacement profile cursor.
}

function ticVoiceDestination_() {
  var book = SpreadsheetApp.openById(CONFIG.SHEET_ID), sheet = book.getSheetByName('Communications');
  if (!sheet) throw new Error('Communications tab is not configured.');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  TICVoice.headers.forEach(function (h) { if (headers.indexOf(h) < 0) throw new Error('Missing Communications column: ' + h); });
  var keyCol = headers.indexOf('CommunicationID') + 1;
  var existing = new Set(sheet.getLastRow() > 1 ? sheet.getRange(2, keyCol, sheet.getLastRow() - 1, 1)
    .getDisplayValues().map(function (r) { return r[0]; }) : []);
  return {book: book, sheet: sheet, headers: headers, existing: existing};
}

// User-run only after baseline/test approval. Creates only this function's timer;
// an existing Voice timer is reported rather than duplicated or silently changed.
function enableTICVoiceMinuteTrigger() {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    ticVoiceRequireService_();
    var state = ticVoiceReadState_(PropertiesService.getScriptProperties());
    if (!state) throw new Error('Initialize Voice sync before enabling the one-minute timer.');
    ticVoiceAssertMailbox_(state, Gmail.Users.getProfile('me'));
    var existing = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'runTICVoiceIngest'; });
    if (existing.length) {
      console.log('Voice timer already exists; no timer changed and its interval was not verified.');
      return {created: false, existing: existing.length, intervalVerified: false};
    }
    ScriptApp.newTrigger('runTICVoiceIngest').timeBased().everyMinutes(1).create();
    console.log('Voice one-minute timer created.');
    return {created: true, intervalMinutes: 1};
  } finally { lock.releaseLock(); }
}

// User-run read-only installation diagnostic. No mail/body scan or baseline write.
function inspectTICVoiceSetup() {
  ticVoiceRequireService_();
  var state = ticVoiceReadState_(PropertiesService.getScriptProperties());
  var profile = Gmail.Users.getProfile('me');
  if (state) ticVoiceAssertMailbox_(state, profile);
  ticVoiceDestination_();
  var timers = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'runTICVoiceIngest'; });
  var result = {gmailServiceReady: true, destinationReady: true, initialized: !!state,
    mode: state ? state.mode : 'not-initialized', voiceTimersVisibleToThisAccount: timers.length};
  console.log(JSON.stringify(result));
  return result;
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
  // Reuse the authorized history reader: Graveyard H and Completed Call Log C:S.
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
if (typeof module !== 'undefined') module.exports=TICVoice;
