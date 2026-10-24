/**
 * Direct Jotform Gmail -> AppSheet Clients ingestion.
 * Paste into the SAME Apps Script project as the existing Gmail parser.
 * Uses parseIntakeMessage_ and splitName_ from the uploaded Oct 22 script.
 * Run runResearchIngest() from a time trigger. No Weekly Call Log intermediary.
 * POC spreadsheet ID is the existing AppSheet proof-of-concept workbook.
 */
function runResearchIngest() {
  var book = SpreadsheetApp.openById('1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8');
  var clients = book.getSheetByName('Clients');
  var identities = book.getSheetByName('ClientIdentities');
  if (!clients || !identities) throw Error('Clients or ClientIdentities tab missing');
  var threads = GmailApp.search('is:unread subject:"Intake Form -" newer_than:3d',0,50);
  var created = 0;
  threads.forEach(function(thread) {
    thread.getMessages().slice(-10).forEach(function(msg) {
      if (!msg.isUnread() || !/^Intake Form\s*-/.test(msg.getSubject())) return;
      var fields = parseIntakeMessage_(msg);
      var fullName = fields.name || msg.getSubject().replace(/^Intake Form\s*-\s*/,'');
      var name = splitName_(fullName);
      if (!name.first || !name.last || !(fields.phone || fields.email)) return;
      var clientId = Utilities.getUuid(), rowId = Utilities.getUuid();
      // Do not infer a verified identity from a name match.
      var identity = {ClientID:clientId,FirstName:name.first,LastName:name.last,
        MiddleName:name.middle,DOB:fields.dob,Phone:fields.phone,Email:fields.email};
      var client = {ClientID:clientId,ClientRowID:rowId,
        TICWeek:ticTuesdayWeek_(msg.getDate()),FirstName:name.first,
        LastName:name.last,MiddleName:name.middle,DOB:fields.dob,
        Phone:fields.phone,Email:fields.email,Address:fields.address,
        ClientPhase:'Research',ClientStatus:'Check Cases',
        FirstContactDate:msg.getDate(),DateFormSubmitted:msg.getDate(),
        Race:fields.race,Gender:fields.gender,ReferralSource:fields.heardHow,
        Location:fields.warrantCityCounty,Notes:fields.missedCirc,OnlineForm:'Yes'};
      appendMappedResearchRow_(identities,identity);
      appendMappedResearchRow_(clients,client);
      msg.markRead();
      created++;
    });
  });
  console.log('Research Client rows created: '+created);
}
function appendMappedResearchRow_(sheet,values) {
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  sheet.appendRow(headers.map(function(h){return values[h] == null ? '' : values[h];}));
}
function ticTuesdayWeek_(date) {
  var parts=Utilities.formatDate(date,'America/Chicago','yyyy-MM-dd').split('-').map(Number);
  var day=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  day.setUTCDate(day.getUTCDate()-(day.getUTCDay()-2+7)%7);
  return (day.getUTCMonth()+1)+'/'+day.getUTCDate()+'/'+day.getUTCFullYear();
}
