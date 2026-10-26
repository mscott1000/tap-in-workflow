const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/gmail-phase-two-importer.gs', 'utf8');
const clientHeaders = ['ClientID','ClientRowID','FirstName','LastName','MiddleName','DOB','Phone','Email','Address','ClientPhase','ClientStatus','TICWeek','FirstContactDate','DateFormSubmitted','Race','Gender','Location','ReasonMissingCourtCategory','ReferralSource','PrimaryContactMethod','OnlineForm','Notes'];
const identityHeaders = ['ClientID','FirstName','LastName','MiddleName','DOB','Phone','Email','Address','ClientStatus','CurrentClientRowID','TICWeek','FirstContactDate','DateFormSubmitted','Race','Gender','ReferralSource','ReferToTBP','ReferToHolland','PrimaryContactMethod','OnlineForm','Notes','Log'];
const clientRows = [clientHeaders], identityRows = [identityHeaders];
let unread = true, failAfterClientWrite = true, failClientAppend = false, flushCount = 0, messageId = 'fixture-001';
const msg = {
  isUnread: () => { throw new Error('AppSheet importer must not depend on read state'); }, getId: () => messageId,
  getSubject: () => 'Intake Form - Fictional Test',
  getDate: () => new Date('2026-10-24T19:00:00Z'),
  getBody: () => '<table>' + [['Your Name','Fictional Middle Test'],['Phone Number','3145550100'],['Email Address','test@example.invalid'],['Date of Birth','07/17/1996'],['Current Address','100 Example St, St Louis, MO 63101'],['What is your race?','Example'],['Do you have any other questions for the tap in center?','=formula-like input']].map(([q,v]) => `<tr><td class="questionColumn">${q}</td><td class="valueColumn">${v}</td></tr>`).join('') + '</table>',
  getPlainBody: () => '',
  markRead: () => { throw new Error('AppSheet importer must not change read state'); }
};
let messages = [msg];
const searches = [];
function mockSheet(rows, name) {
  return {
    getLastColumn: () => rows[0].length, getLastRow: () => rows.length,
    getRange: (r,c,h,w) => ({getValues: () => rows.slice(r-1,r-1+h).map(row => row.slice(c-1,c-1+w))}),
    appendRow: row => { if (name === 'Clients' && failClientAppend) throw new Error('simulated client append failure'); rows.push(row); }
  };
}
const sheets = {Clients:mockSheet(clientRows,'Clients'), ClientIdentities:mockSheet(identityRows,'ClientIdentities')};
const ctx = vm.createContext({console, Set, Map, Date, Object,
  Utilities:{formatDate:(date,tz) => new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{openById:id=>{assert.equal(id,'1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8'); return {getSheetByName:name=>sheets[name]};},flush:()=>{flushCount++; if (failAfterClientWrite && clientRows.length > 1) throw new Error('simulated flush failure');}},
  GmailApp:{search:(query,start,max)=>{
    assert.ok(!/is:(unread|read)|label:/i.test(query), 'Search must not depend on mailbox processing state');
    searches.push({query,start,max});
    return messages.slice(start,start+max).map(message=>message.getMessages ? message : {getMessages:()=>[message]});
  }}
});
vm.runInContext(source,ctx);
const mapped = (headers,row) => Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
assert.throws(()=>ctx.runIngest(), /simulated flush failure/);
assert.equal(clientRows.length,2); assert.equal(identityRows.length,2);
failAfterClientWrite=false; ctx.runIngest();
assert.equal(clientRows.length,2); assert.equal(identityRows.length,2); assert.equal(unread,true);
const client=mapped(clientHeaders,clientRows[1]), identity=mapped(identityHeaders,identityRows[1]);
assert.equal(client.ClientPhase,'Research'); assert.equal(client.ClientStatus,'Check Cases');
assert.equal(client.ClientRowID,'gmail_fixture-001'); assert.equal(client.ClientID,'intake_gmail_fixture-001');
assert.equal(identity.ClientID,client.ClientID); assert.equal(identity.CurrentClientRowID,client.ClientRowID);
assert.equal(identity.ClientStatus,'Check Cases'); assert.equal(identity.FirstName,client.FirstName);
assert.equal(identity.ReferToTBP,'No'); assert.equal(identity.ReferToHolland,'No');
assert.equal(client.FirstName,'Fictional'); assert.equal(client.MiddleName,'Middle'); assert.equal(client.LastName,'Test');
assert.equal(client.Phone,'(314) 555-0100'); assert.equal(client.DOB,'7-17-1996');
assert.equal(client.DateFormSubmitted,'2026-10-24'); assert.equal(client.Notes,' | =formula-like input');
messageId='fixture-002'; unread=true; failClientAppend=true;
assert.throws(()=>ctx.runIngest(), /simulated client append failure/);
assert.equal(identityRows.length,3); assert.equal(clientRows.length,2);
failClientAppend=false; ctx.runIngest();
assert.equal(identityRows.length,3); assert.equal(clientRows.length,3);
assert.equal(mapped(clientHeaders,clientRows[2]).ClientID,mapped(identityHeaders,identityRows[2]).ClientID);
// Old importer ran first and marked a new email read. AppSheet must still import it.
messageId='fixture-read-first'; unread=false; ctx.runIngest();
assert.equal(clientRows.length,4); assert.equal(identityRows.length,4); assert.equal(unread,false);
// AppSheet ran first: leave the email unread so the old ingester can process it.
messageId='fixture-appsheet-first'; unread=true; ctx.runIngest();
assert.equal(clientRows.length,5); assert.equal(unread,true);
let legacyImports=0;
if (unread) { legacyImports++; unread=false; }
ctx.runIngest();
assert.equal(legacyImports,1); assert.equal(clientRows.length,5); assert.equal(unread,false);
// One run is bounded, but the next must page past the 50 previously imported threads.
messages=Array.from({length:51},(_,i)=>({...msg,getId:()=>`paged-${i}`}));
ctx.runIngest(); assert.equal(clientRows.length,55); assert.equal(identityRows.length,55);
ctx.runIngest(); assert.equal(clientRows.length,56); assert.equal(identityRows.length,56);
assert.ok(searches.some(search=>search.start===50));
ctx.runIngest(); assert.equal(clientRows.length,56); assert.equal(identityRows.length,56);
// A later email in a previously seen conversation is a different message, not a duplicate.
messages=[{getMessages:()=>[
  {...msg,getId:()=> 'paged-0'},
  {...msg,getId:()=> 'new-message-same-conversation'}
]}];
ctx.runIngest(); assert.equal(clientRows.length,57); assert.equal(identityRows.length,57);
for (const [day,tuesday] of [['2026-10-24','2026-10-27'],['2026-10-27','2026-10-27'],['2026-10-28','2026-11-03']]) assert.equal(ctx.upcomingTuesday_(day),tuesday);
assert.equal(ctx.literalSheetValue_('=1+1'),"'=1+1");
assert.equal(ctx.normalizeDobNoLeadingZeros_('7/17/96'),'7/17/96');
const plain=ctx.parseIntakeBody_('Your Name: Plain Example\nPhone Number: 3145550101\nDo you have any other questions for the tap in center?: Please call');
assert.equal(plain.otherQuestions,'Please call');
// Every requested intake answer must reach its own destination, in either email format.
const answers = [
  ['Your Name','Example Two Middle Person Jr.'],
  ['Current Address','100 Example St, St Louis, MO 63101'],
  ['Phone Number','3145550100'], ['Email Address','test@example.invalid'],
  ['Date of Birth','06/28/1994'], ['What gender do you identify as?','Example gender'],
  ['What is your race?','Example race'],
  ['What county or city was the warrant issued in?','Example location'],
  ['Please explain the circumstance for the missed court date','Transportation Issues'],
  ['How did you hear about the Tap In Center','Example referral'],
  ['Do you have any other questions for the Tap In Center?','Please call after noon.']
];
const html = '<table>' + answers.map(([q,v]) => `<tr><td class="questionColumn">${q}</td><td class="valueColumn">${v}</td></tr>`).join('') + '</table>';
const expected = {FirstName:'Example', MiddleName:'Two Middle', LastName:'Person',
  Address:'100 Example St, St. Louis, MO 63101', Phone:'(314) 555-0100',
  Email:'test@example.invalid', DOB:'6-28-1994', Gender:'Example gender', Race:'Example race',
  Location:'Example location', ReasonMissingCourtCategory:'Transportation Issues',
  ReferralSource:'Example referral', Notes:'Example location | Please call after noon.'};
const parsers = [ctx.parseIntakeHtmlBody_(html)];
for (const separator of [': ', '\t', '\n', ' ']) {
  parsers.push(ctx.parseIntakeBody_(answers.map(([q,v])=>q + separator + v).join('\n')));
}
for (const fields of parsers) {
  const row = ctx.buildPhaseTwoClient_(fields,fields.name,'synthetic-map',new Date('2026-10-24T19:00:00Z'),new Date('2026-10-26T19:00:00Z'));
  for (const [key,value] of Object.entries(expected)) assert.equal(row[key],value,key);
  assert.equal(row.ClientPhase,'Research'); assert.equal(row.ClientStatus,'Check Cases');
  assert.equal(ctx.buildIntakeIdentity_(row,'synthetic-identity').Notes,expected.Notes);
}
for (const suffix of ['Jr','Jr.','Sr','Sr.','jr.','SR']) {
  const name = ctx.splitName_('Example Middle Person ' + suffix);
  assert.equal(name.first,'Example'); assert.equal(name.middle,'Middle'); assert.equal(name.last,'Person');
  const shortName = ctx.splitName_('Example Person ' + suffix);
  assert.equal(shortName.middle,''); assert.equal(shortName.last,'Person');
}
for (const [input,first,middle,last] of [
  ['Example','Example','',''], ['', '', '', ''], ['Example Person','Example','','Person'],
  [' Example   Two Middle   Person ','Example','Two Middle','Person'],
  ['Example Middle Person III','Example','Middle Person','III']
]) {
  const name=ctx.splitName_(input); assert.equal(name.first,first); assert.equal(name.middle,middle); assert.equal(name.last,last);
}
for (const [location,question,notes] of [['Court','','Court | '],['','Question',' | Question'],['','',' | ']]) {
  assert.equal(ctx.buildPhaseTwoClient_({warrantCityCounty:location,otherQuestions:question},'Example Person','synthetic',new Date(),new Date()).Notes,notes);
}
// A missing destination must fail before reading Gmail or appending any row.
const locationIndex=clientHeaders.indexOf('Location');
clientHeaders.splice(locationIndex,1);
assert.throws(()=>ctx.runIngest(), /Missing Clients column: Location/);
clientHeaders.splice(locationIndex,0,'Location');
console.log('PASS: all requested mappings in HTML and four plain-text layouts, Jr/Sr names, exact notes, required headers, linked rows, retries, both importer orders, unchanged read state, pagination, deduplication and dates');


