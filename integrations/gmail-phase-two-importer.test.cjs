const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/gmail-phase-two-importer.gs', 'utf8');
const clientHeaders = ['ClientID','ClientRowID','FirstName','LastName','MiddleName','DOB','Phone','Email','Address','ClientPhase','ClientStatus','TICWeek','FirstContactDate','DateFormSubmitted','Race','Gender','ReferralSource','PrimaryContactMethod','OnlineForm','Notes'];
const identityHeaders = ['ClientID','FirstName','LastName','MiddleName','DOB','Phone','Email','Address','ClientStatus','CurrentClientRowID','TICWeek','FirstContactDate','DateFormSubmitted','Race','Gender','ReferralSource','ReferToTBP','ReferToHolland','PrimaryContactMethod','OnlineForm','Notes','Log'];
const clientRows = [clientHeaders], identityRows = [identityHeaders];
let unread = true, failMarkRead = true, failClientAppend = false, flushCount = 0, messageId = 'fixture-001';
const msg = {
  isUnread: () => unread, getId: () => messageId,
  getSubject: () => 'Intake Form - Fictional Test',
  getDate: () => new Date('2026-10-24T19:00:00Z'),
  getBody: () => '<table>' + [['Your Name','Fictional Middle Test'],['Phone Number','3145550100'],['Email Address','test@example.invalid'],['Date of Birth','07/17/1996'],['Current Address','100 Example St, St Louis, MO 63101'],['What is your race?','Example'],['Do you have any other questions for the tap in center?','=formula-like input']].map(([q,v]) => `<tr><td class="questionColumn">${q}</td><td class="valueColumn">${v}</td></tr>`).join('') + '</table>',
  getPlainBody: () => '',
  markRead: () => { assert.ok(flushCount); if (failMarkRead) throw new Error('simulated Gmail failure'); unread = false; }
};
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
  SpreadsheetApp:{openById:id=>{assert.equal(id,'1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8'); return {getSheetByName:name=>sheets[name]};},flush:()=>flushCount++},
  GmailApp:{search:()=>[{getMessages:()=>[msg]}]}
});
vm.runInContext(source,ctx);
const mapped = (headers,row) => Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
assert.throws(()=>ctx.runIngest(), /simulated Gmail failure/);
assert.equal(clientRows.length,2); assert.equal(identityRows.length,2);
failMarkRead=false; ctx.runIngest();
assert.equal(clientRows.length,2); assert.equal(identityRows.length,2); assert.equal(unread,false);
const client=mapped(clientHeaders,clientRows[1]), identity=mapped(identityHeaders,identityRows[1]);
assert.equal(client.ClientPhase,'Research'); assert.equal(client.ClientStatus,'Check Cases');
assert.equal(client.ClientRowID,'gmail_fixture-001'); assert.equal(client.ClientID,'intake_gmail_fixture-001');
assert.equal(identity.ClientID,client.ClientID); assert.equal(identity.CurrentClientRowID,client.ClientRowID);
assert.equal(identity.ClientStatus,'Check Cases'); assert.equal(identity.FirstName,client.FirstName);
assert.equal(identity.ReferToTBP,'No'); assert.equal(identity.ReferToHolland,'No');
assert.equal(client.FirstName,'Fictional'); assert.equal(client.MiddleName,'Middle'); assert.equal(client.LastName,'Test');
assert.equal(client.Phone,'(314) 555-0100'); assert.equal(client.DOB,'7-17-1996');
assert.equal(client.DateFormSubmitted,'2026-10-24'); assert.ok(client.Notes.includes('=formula-like input'));
messageId='fixture-002'; unread=true; failClientAppend=true;
assert.throws(()=>ctx.runIngest(), /simulated client append failure/);
assert.equal(identityRows.length,3); assert.equal(clientRows.length,2);
failClientAppend=false; ctx.runIngest();
assert.equal(identityRows.length,3); assert.equal(clientRows.length,3);
assert.equal(mapped(clientHeaders,clientRows[2]).ClientID,mapped(identityHeaders,identityRows[2]).ClientID);
for (const [day,tuesday] of [['2026-10-24','2026-10-27'],['2026-10-27','2026-10-27'],['2026-10-28','2026-11-03']]) assert.equal(ctx.upcomingTuesday_(day),tuesday);
assert.equal(ctx.literalSheetValue_('=1+1'),"'=1+1");
assert.equal(ctx.normalizeDobNoLeadingZeros_('7/17/96'),'7/17/96');
const plain=ctx.parseIntakeBody_('Your Name: Plain Example\nPhone Number: 3145550101\nDo you have any other questions for the tap in center?: Please call');
assert.equal(plain.otherQuestions,'Please call');
console.log('PASS: linked identity and client rows, Phase 2 mapping, both partial-failure retries, date and parser handling');

