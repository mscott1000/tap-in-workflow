// First-pass Gmail-to-Research adapter; requires the existing parseIntakeMessage_ parser.
// Set POC_SPREADSHEET_ID in Script Properties. TIC week begins Tuesday.
// Staff must confirm returning identities; this importer never merges on name alone.
function ingestResearchClient_(message, fields) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = PropertiesService.getScriptProperties();
    var id = p.getProperty('POC_SPREADSHEET_ID');
    var start = '2'; // Tuesday, confirmed 2026-10-24
    if (!id) throw Error('Configure POC_SPREADSHEET_ID');
    var book = SpreadsheetApp.openById(id);
    var clients = book.getSheetByName('Clients');
    var identities = book.getSheetByName('ClientIdentities');
    if (!clients || !identities) throw Error('Missing Clients or ClientIdentities');
    var ledger = book.getSheetByName('GmailResearchImports') || book.insertSheet('GmailResearchImports');
    if (!ledger.getLastRow()) ledger.appendRow(['GmailMessageID','ClientRowID','ProcessedAt']);
    var messageId = message.getId();
    if (readObjects_(ledger).some(function(r){return r.GmailMessageID === messageId;})) return 'duplicate';
    var name = String(fields.name || '').trim().split(/\s+/);
    if (name.length < 2 || !(fields.phone || fields.email)) throw Error('Incomplete intake');
    var tz = 'America/Chicago', date = message.getDate();
    var week = ticTuesdayWeek_(date);
    var knownId = p.getProperty('CONFIRMED_CLIENTID_FOR_MESSAGE_'+messageId);
    var clientsData = readObjects_(clients);
    // Recover safely if the Client row was written but the ledger append failed.
    var replayRow = clientsData.find(function(r){return String(r.SourceGmailMessageID) === messageId;});
    if (replayRow) {
      ledger.appendRow([messageId,replayRow.ClientRowID,new Date()]);
      return 'recovered';
    }
    if (knownId && !clientsData.some(function(r){return String(r.ClientID) === knownId;}))
      throw Error('Unknown confirmed CLIENTID');
    var clientId = knownId || Utilities.getUuid();
    var existing = clientsData.find(function(r){
      return String(r.ClientID) === clientId && String(r.TICWeek) === week;
    });
    if (existing) {
      ledger.appendRow([messageId,existing.ClientRowID,new Date()]);
      return 'existing-week';
    }
    var clientRowId = Utilities.getUuid();
    if (!knownId) appendObject_(identities,{
      ClientID:clientId,FirstName:name[0],LastName:name[name.length-1],
      DOB:fields.dob,Phone:fields.phone,Email:fields.email
    });
    appendObject_(clients,{
      ClientID:clientId,ClientRowID:clientRowId,TICWeek:week,
      SourceGmailMessageID:messageId,
      FirstName:name[0],MiddleName:name.slice(1,-1).join(' '),LastName:name[name.length-1],
      DOB:fields.dob,Phone:fields.phone,Email:fields.email,Address:fields.address,
      Race:fields.race,Gender:fields.gender,ReferralSource:fields.heardHow,
      Location:fields.warrantCityCounty,Notes:fields.missedCirc,
      ClientPhase:'Research',ClientStatus:'Check Cases',
      DateFormSubmitted:date,FirstContactDate:date
    });
    ledger.appendRow([messageId,clientRowId,new Date()]);
    return 'created';
  } finally {lock.releaseLock();}
}
function readObjects_(sheet) {
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).getValues()
    .map(function(row){var out={};headers.forEach(function(h,i){out[h]=row[i];});return out;});
}
function appendObject_(sheet,values) {
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(function(h){return values[h] == null ? '' : values[h];}));
}

// UTC calendar arithmetic avoids machine-timezone/DST drift for Chicago TIC weeks.
function ticTuesdayWeek_(date) {
  var parts = Utilities.formatDate(date,'America/Chicago','yyyy-MM-dd').split('-').map(Number);
  var day = new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay()-2+7)%7);
  return (day.getUTCMonth()+1)+'/'+day.getUTCDate()+'/'+day.getUTCFullYear();
}
