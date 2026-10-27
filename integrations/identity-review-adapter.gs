/* Advisory history checks for Clients and Cases. Source workbook is READ ONLY.
 * Requires identity-review-core.js in the same standalone Apps Script project.
 * Public row-check functions are called by AppSheet bots on relevant changes.
 * The existing Gmail import schedule calls runTICIntakeChecks: new imports now,
 * and one full refresh per calendar day. No extra frequent scan is installed.
 */
var TIC_REVIEW = {
  sourceId: '1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4',
  targetId: '1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8',
  graveyard: 'TIC Graveyard', callLog: 'Completed Call Log',
  clients: 'Clients', cases: 'Cases',
  identities: 'IdentityCandidates', caseMatches: 'CaseMatchCandidates',
  summary: 'Check summary', timeZone: 'America/Chicago',
  dailyProperty: 'TIC_HISTORY_LAST_DAILY_REFRESH'
};

function checkClientHistory(clientRowId) {
  if (!clientRowId) throw new Error('ClientRowID is required.');
  return ticRunChecks_({clientIds: [String(clientRowId)], caseIds: []});
}

function checkCaseHistory(caseId) {
  if (!caseId) throw new Error('CaseID is required.');
  return ticRunChecks_({clientIds: [], caseIds: [String(caseId)]});
}

function refreshTICReviewCandidates() {
  return ticRunChecks_({all: true});
}

function runTICIntakeChecks(clientRowIds) {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), TIC_REVIEW.timeZone, 'yyyy-MM-dd');
  var daily = props.getProperty(TIC_REVIEW.dailyProperty) !== today;
  if (!daily && !(clientRowIds || []).length) return;
  return ticRunChecks_({all: daily, dailyDay: daily ? today : '', clientIds: clientRowIds || [], caseIds: []});
}

function ticRunChecks_(options) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // Check the daily marker again while holding the shared lock, so overlapping
    // importer executions cannot perform two daily scans. Errors stay visible;
    // a failed source read does not trigger a new full scan every minute.
    if (options.dailyDay && PropertiesService.getScriptProperties().getProperty(TIC_REVIEW.dailyProperty) === options.dailyDay) {
      options.all = false;
    }
    if (!options.all && !(options.clientIds || []).length && !(options.caseIds || []).length) {
      return {clients:0,cases:0,sourceError:false};
    }
    var target = SpreadsheetApp.openById(TIC_REVIEW.targetId);
    var clientSheet = target.getSheetByName(TIC_REVIEW.clients);
    var caseSheet = target.getSheetByName(TIC_REVIEW.cases);
    var identitySheet = target.getSheetByName(TIC_REVIEW.identities);
    var caseMatchSheet = target.getSheetByName(TIC_REVIEW.caseMatches);
    if (!clientSheet || !caseSheet || !identitySheet || !caseMatchSheet) {
      throw new Error('A configured AppSheet history-check tab is missing.');
    }
    var clients = ticRows_(clientSheet, target.getSpreadsheetTimeZone());
    var cases = ticRows_(caseSheet, target.getSpreadsheetTimeZone());
    ticRequireHeaders_(clients.headers, ['ClientRowID','FirstName','LastName','DOB','Phone','PriorTICClient','PriorTICClientReason']);
    ticRequireHeaders_(cases.headers, ['CaseID','CaseNumber','Jurisdiction']);
    var peopleStore = ticCandidateStore_(identitySheet, 'ClientRowID');
    var caseStore = ticCandidateStore_(caseMatchSheet, 'CaseID');
    var selectedClients = clients.rows.filter(function (r) {
      return r.ClientRowID && (options.all || (options.clientIds || []).indexOf(String(r.ClientRowID)) !== -1);
    });
    // Recheck other AppSheet cases too: adding/editing a row can create or remove
    // a duplicate warning on its counterparts. This is event-driven, not polling.
    var selectedCases = cases.rows.filter(function (r) {
      return r.CaseID && (options.all || (options.caseIds || []).length);
    });
    var sourceError = false, historical;
    try { historical = ticHistory_(); }
    catch (error) { sourceError = true; historical = {people: [], cases: []}; }
    var counts = {clients: 0, cases: 0, sourceError: sourceError};

    selectedClients.forEach(function (client) {
      var signature = ticClientSignature_(client);
      var valid = TICIdentity.aliases(client.FirstName).length && TICIdentity.aliases(client.LastName).length &&
        TICIdentity.dob(client.DOB);
      var found = !sourceError && valid ? TICIdentity.personCandidates({
        first: client.FirstName, last: client.LastName, dob: client.DOB, phone: client.Phone
      }, historical.people) : [];
      var current = found.map(function (match) {
        var id = 'PERSON-' + ticHash_(String(client.ClientRowID) + '|' + signature + '|' + match.sourceToken);
        return ticUpsertCandidate_(peopleStore, {
          CandidateID: id, ClientRowID: String(client.ClientRowID),
          SourceTab: match.sourceTab, SourceRow: String(match.sourceRow),
          MatchReasons: match.reasons.join('; '), CandidateClientID: '',
          SourceFingerprint: signature
        });
      });
      var status = sourceError || !valid ? 'Error' : TICIdentity.clientStatus(current);
      var details = sourceError ? 'Historical source could not be read. Check permissions or source tabs.' :
        !valid ? 'First name, last name and a valid full DOB are required for this check.' :
        found.length ? found.map(function (m) {
          return m.sourceTab + ' row ' + m.sourceRow + ': ' + m.reasons.join('; ');
        }).join('\n') : 'No matching name/DOB or phone found in the configured historical sources.';
      ticSummary_(peopleStore, String(client.ClientRowID), signature, status, details);
      // Re-read only identifying inputs immediately before writing our two result
      // cells. Never overwrite staff names, phones, DOBs, notes or case fields.
      var fresh = ticReadRow_(clientSheet, clients.headers, client._sourceRow, target.getSpreadsheetTimeZone());
      if (String(fresh.ClientRowID) === String(client.ClientRowID) && ticClientSignature_(fresh) === signature) {
        ticSetResult_(clientSheet, clients.headers, client._sourceRow, 'PriorTICClient', status);
        ticSetResult_(clientSheet, clients.headers, client._sourceRow, 'PriorTICClientReason', details);
      }
      counts.clients++;
    });

    selectedCases.forEach(function (row) {
      var signature = ticCaseSignature_(row);
      var valid = TICIdentity.supportedCase(row.CaseNumber);
      var otherCases = cases.rows.filter(function (other) {
        return other.CaseID && String(other.CaseID) !== String(row.CaseID);
      }).map(function (other) {
        return {sourceRef:'Cases:' + other._sourceRow, sourceTab:'Cases', sourceRow:other._sourceRow,
          sourceToken: 'Cases|' + String(other.CaseID) + '|' + ticCaseSignature_(other),
          caseNumber:other.CaseNumber};
      });
      var found = !sourceError && valid ? TICIdentity.caseCandidates({caseNumber:row.CaseNumber},
        historical.cases.concat(otherCases)) : [];
      var current = found.map(function (match) {
        var id = 'CASE-' + ticHash_(String(row.CaseID) + '|' + signature + '|' + match.sourceToken);
        return ticUpsertCandidate_(caseStore, {
          CandidateID:id, CaseID:String(row.CaseID), SourceTab:match.sourceTab,
          SourceRow:String(match.sourceRow), MatchReason:match.reason,
          SubmissionStatus:match.submissionStatus, SourceFingerprint:signature
        });
      });
      var status = sourceError || !valid ? 'Error' : TICIdentity.caseStatus(current);
      var details = sourceError ? 'Historical source could not be read. Check permissions or source tabs.' :
        !valid ? 'Missing or unsupported case number. Check this case manually; no clean result was issued.' :
        found.length ? found.map(function (m) {
          return m.sourceTab + ' row ' + m.sourceRow + ': ' + m.reason;
        }).join('\n') : 'No matching complete case number in TIC Graveyard F or another AppSheet Case row.';
      ticSummary_(caseStore, String(row.CaseID), signature, status, details);
      counts.cases++;
    });
    SpreadsheetApp.flush();
    if (options.all && options.dailyDay) {
      PropertiesService.getScriptProperties().setProperty(TIC_REVIEW.dailyProperty,options.dailyDay);
    }
    console.log('Advisory history check: clients=' + counts.clients + ', cases=' + counts.cases +
      ', sourceError=' + counts.sourceError);
    return counts;
  } finally { lock.releaseLock(); }
}

function ticHistory_() {
  var source = SpreadsheetApp.openById(TIC_REVIEW.sourceId);
  var graveyard = source.getSheetByName(TIC_REVIEW.graveyard);
  var calls = source.getSheetByName(TIC_REVIEW.callLog);
  if (!graveyard || !calls) throw new Error('Historical source tab missing.');
  var heads = graveyard.getRange(1,1,1,8).getDisplayValues()[0];
  if (heads[1] !== 'First Name' || heads[2] !== 'Last Name' || heads[4] !== 'DOB' ||
      heads[5] !== 'Eligible Cases' || heads[7] !== 'Phone Number') {
    throw new Error('TIC Graveyard column layout differs from the agreed mapping.');
  }
  var people = [], pastCases = [], timeZone = source.getSpreadsheetTimeZone();
  if (graveyard.getLastRow() > 1) {
    var data = graveyard.getRange(2,1,graveyard.getLastRow()-1,8).getValues();
    data.forEach(function (cells, i) {
      var birth = ticDate_(cells[4], timeZone);
      var token = 'TIC Graveyard|' + ticHash_(cells.map(function (v, col) {
        return col === 4 ? birth : String(v === null || v === undefined ? '' : v);
      }).join('\u001f'));
      people.push({sourceRef:TIC_REVIEW.graveyard + ':' + (i+2),
        sourceTab:TIC_REVIEW.graveyard, sourceRow:i+2, sourceToken:token,
        first:cells[1], last:cells[2], dob:birth, phone:cells[7]});
      // Only F is an authorized record of submitted cases. G is never read for matching.
      var numbers = TICIdentity.caseNumbersInText(cells[5]);
      if (numbers.length) pastCases.push({sourceRef:TIC_REVIEW.graveyard + ':' + (i+2),
        sourceTab:TIC_REVIEW.graveyard, sourceRow:i+2, sourceToken:token, caseNumbers:numbers});
    });
  }
  if (calls.getLastRow() > 0) {
    // Row 1 is data. Restrict the call-log phone search to C:S inclusive.
    var callRows = calls.getRange(1,3,calls.getLastRow(),17).getDisplayValues();
    callRows.forEach(function (cells, i) {
      var found = Array.from(new Set([].concat.apply([], cells.map(TICIdentity.phones))));
      if (found.length) people.push({sourceRef:TIC_REVIEW.callLog + ':' + (i+1),
        sourceTab:TIC_REVIEW.callLog, sourceRow:i+1,
        sourceToken:'Completed Call Log|' + ticHash_(cells.join('\u001f')),
        phones:found, first:'', last:'', dob:''});
    });
  }
  return {people:people, cases:pastCases};
}

function ticDate_(value, timeZone) {
  return value instanceof Date && !isNaN(value.getTime())
    ? Utilities.formatDate(value, timeZone, 'yyyy-MM-dd') : TICIdentity.dob(value);
}

function ticRows_(sheet, timeZone) {
  var width = sheet.getLastColumn();
  var headers = sheet.getRange(1,1,1,width).getValues()[0].map(String);
  var data = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,width).getValues() : [];
  return {headers:headers, rows:data.map(function (cells,i) {
    return ticObject_(headers,cells,i+2,timeZone);
  })};
}

function ticObject_(headers,cells,rowNumber,timeZone) {
  var row = {_sourceRow:rowNumber};
  headers.forEach(function (h,i) { if (h) row[h] = h === 'DOB' ? ticDate_(cells[i],timeZone) : cells[i]; });
  return row;
}

function ticReadRow_(sheet,headers,rowNumber,timeZone) {
  return ticObject_(headers,sheet.getRange(rowNumber,1,1,headers.length).getValues()[0],rowNumber,timeZone);
}

function ticClientSignature_(row) {
  return [row.FirstName || '',row.LastName || '',TICIdentity.dob(row.DOB),row.Phone || ''].join('|');
}

function ticCaseSignature_(row) {
  return [row.CaseNumber || '',row.Jurisdiction || ''].join('|');
}

function ticHash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value)).map(function (b) {
    return ('0' + (b & 255).toString(16)).slice(-2);
  }).join('').slice(0,28);
}

function ticRequireHeaders_(headers,required) {
  required.forEach(function (h) { if (headers.indexOf(h) < 0) throw new Error('Missing history-check column: ' + h); });
}

function ticCandidateStore_(sheet,parent) {
  var rows = ticRows_(sheet,TIC_REVIEW.timeZone);
  ticRequireHeaders_(rows.headers,['CandidateID',parent,'SourceTab','SourceRow','Decision','ReviewedBy','ReviewedAt','SourceFingerprint']);
  if (parent === 'CaseID') ticRequireHeaders_(rows.headers,['MatchReason','SubmissionStatus']);
  else ticRequireHeaders_(rows.headers,['MatchReasons','CandidateClientID']);
  var byId = new Map();
  rows.rows.forEach(function (r) { if (r.CandidateID) byId.set(String(r.CandidateID),r); });
  return {sheet:sheet,headers:rows.headers,parent:parent,byId:byId};
}

function ticUpsertCandidate_(store,values) {
  var existing = store.byId.get(values.CandidateID);
  if (!existing) {
    var record = Object.assign({Decision:'Pending review',ReviewedBy:'',ReviewedAt:''},values);
    store.sheet.appendRow(store.headers.map(function (h) {
      return ticLiteral_(Object.prototype.hasOwnProperty.call(record,h) ? record[h] : '');
    }));
    record._sourceRow = store.sheet.getLastRow();
    store.byId.set(record.CandidateID,record);
    return record;
  }
  // Write only system-owned fields. Preserve staff decisions and review audit.
  Object.keys(values).forEach(function (h) {
    if (h !== 'CandidateID' && h !== 'Decision' && h !== 'ReviewedBy' && h !== 'ReviewedAt') {
      ticSetResult_(store.sheet,store.headers,existing._sourceRow,h,values[h]);
      existing[h] = values[h];
    }
  });
  // Get the latest decision in case staff reviewed the row during this scan.
  existing.Decision = store.sheet.getRange(existing._sourceRow,store.headers.indexOf('Decision')+1).getValue();
  return existing;
}

function ticSummary_(store,parentId,signature,status,details) {
  var record = {CandidateID:(store.parent === 'CaseID' ? 'CASE-CHECK-' : 'CLIENT-CHECK-') + parentId,
    SourceTab:TIC_REVIEW.summary,SourceRow:'',SourceFingerprint:signature,
    Decision:store.parent === 'CaseID' ? 'Checked' : status};
  record[store.parent] = parentId;
  record[store.parent === 'CaseID' ? 'MatchReason' : 'MatchReasons'] =
    'Checked ' + new Date().toISOString() + '\n' + details;
  if (store.parent === 'CaseID') record.SubmissionStatus = status;
  var existing = store.byId.get(record.CandidateID);
  if (!existing) {
    store.sheet.appendRow(store.headers.map(function (h) { return ticLiteral_(record[h] || ''); }));
    record._sourceRow = store.sheet.getLastRow();
    store.byId.set(record.CandidateID,record);
  } else {
    Object.keys(record).forEach(function (h) {
      if (h !== 'CandidateID') ticSetResult_(store.sheet,store.headers,existing._sourceRow,h,record[h]);
    });
    Object.assign(existing,record);
  }
}

function ticSetResult_(sheet,headers,rowNumber,column,value) {
  var col = headers.indexOf(column);
  if (col < 0) throw new Error('Missing result column: ' + column);
  sheet.getRange(rowNumber,col+1).setValue(ticLiteral_(value === undefined || value === null ? '' : value));
}

function ticLiteral_(value) {
  return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value;
}

function diagnoseTICHistoryAccess() {
  var target = SpreadsheetApp.openById(TIC_REVIEW.targetId);
  var history = ticHistory_();
  var result = {historySourcesReadable:true,peopleRows:history.people.length,
    submittedCaseRows:history.cases.length,clientsTabPresent:!!target.getSheetByName('Clients'),
    casesTabPresent:!!target.getSheetByName('Cases')};
  console.log(JSON.stringify(result));
  return result;
}
