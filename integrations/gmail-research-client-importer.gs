// First-pass Gmail-to-Research adapter; requires the existing parseIntakeMessage_ parser.
// Set POC_SPREADSHEET_ID and TIC_WEEK_START_DAY (0=Sun..6=Sat) in Script Properties.
// Staff must confirm returning identities; this importer never merges on name alone.
function ingestResearchClient_(message, fields) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = PropertiesService.getScriptProperties();
    var id = p.getProperty('POC_SPREADSHEET_ID');
    var start = p.getProperty('TIC_WEEK_START_DAY');
    if (!id || !/^[0-6]$/.test(start)) throw Error('Configure spreadsheet and TIC week');
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
    var local = Utilities.formatDate(date,tz,'yyyy/MM/dd');
    var weekDate = new Date(local+' 12:00:00');
    weekDate.setDate(weekDate.getDate()-(weekDate.getDay()-Number(start)+7)%7);
    var week = Utilities.formatDate(weekDate,tz,'M/d/yyyy');
    var knownId = p.getProperty('CONFIRMED_CLIENTID_FOR_MESSAGE_'+messageId);
    var clientsData = readObjects_(clients);
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
