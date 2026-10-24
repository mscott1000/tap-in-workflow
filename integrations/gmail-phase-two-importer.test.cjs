const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/gmail-phase-two-importer.gs', 'utf8');
const headers = ['ClientID','ClientRowID','FirstName','LastName','MiddleName','DOB','Phone','Email','Address','ClientPhase','ClientStatus','TICWeek','FirstContactDate','DateFormSubmitted','Race','Gender','ReferralSource','PrimaryContactMethod','OnlineForm','Notes'];
let rows = [headers];
let unread = true;
let failRead = true;
let flushCount = 0;
const msg = {
  isUnread: () => unread, getId: () => 'fixture-001',
  getSubject: () => 'Intake Form - Fictional Test',
  getDate: () => new Date('2026-10-24T19:00:00Z'),
  getBody: () => '<table>' + [['Your Name','Fictional Middle Test'],['Phone Number','3145550100'],['Email Address','test@example.invalid'],['Date of Birth','07/17/1996'],['Current Address','100 Example St, St Louis, MO 63101'],['What is your race?','Example'],['Do you have any other questions for the tap in center?','=formula-like input']].map(([q,v]) => `<tr><td class="questionColumn">${q}</td><td class="valueColumn">${v}</td></tr>`).join('') + '</table>',
  getPlainBody: () => '',
  markRead: () => { assert.ok(flushCount); if (failRead) throw new Error('simulated Gmail failure'); unread = false; }
};
const sheet = {
  getLastColumn: () => headers.length, getLastRow: () => rows.length,
  getRange: (r,c,h,w) => ({getValues: () => rows.slice(r-1,r-1+h).map(row => row.slice(c-1,c-1+w))}),
  appendRow: row => rows.push(row)
};
const ctx = vm.createContext({console, Set, Date, Utilities:{formatDate:(date,tz) => new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{openById:id=>{assert.equal(id,'1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8'); return {getSheetByName:name=>{assert.equal(name,'Clients');return sheet;}};},flush:()=>flushCount++},
  GmailApp:{search:()=>[{getMessages:()=>[msg]}]}
});
vm.runInContext(source,ctx);
assert.throws(()=>ctx.runIngest(), /simulated Gmail failure/);
assert.equal(rows.length,2);
failRead=false; ctx.runIngest(); assert.equal(rows.length,2); assert.equal(unread,false);
const row=Object.fromEntries(headers.map((h,i)=>[h,rows[1][i]]));
assert.equal(row.ClientPhase,'Research'); assert.equal(row.ClientStatus,'Check Cases');
assert.equal(row.ClientRowID,'gmail_fixture-001'); assert.equal(row.ClientID,'');
assert.equal(row.FirstName,'Fictional'); assert.equal(row.MiddleName,'Middle'); assert.equal(row.LastName,'Test');
assert.equal(row.Phone,'(314) 555-0100'); assert.equal(row.DOB,'7-17-1996');
assert.equal(row.DateFormSubmitted,'2026-10-24'); assert.ok(row.Notes.includes('=formula-like input'));
for (const [day,tuesday] of [['2026-10-24','2026-10-27'],['2026-10-27','2026-10-27'],['2026-10-28','2026-11-03'],['2026-12-31','2027-01-05']]) assert.equal(ctx.upcomingTuesday_(day),tuesday);
assert.equal(ctx.literalSheetValue_('=1+1'),"'=1+1");
assert.equal(ctx.normalizeDobNoLeadingZeros_('7/17/96'),'7/17/96');
const plain=ctx.parseIntakeBody_('Your Name: Plain Example\nPhone Number: 3145550101\nDo you have any other questions for the tap in center?: Please call');
assert.equal(plain.otherQuestions,'Please call');
const before=rows.length; unread=true; msg.getSubject=()=> 'Unrelated email'; ctx.runIngest(); assert.equal(rows.length,before); assert.equal(unread,true);
console.log('PASS: HTML/plain parsing, Phase 2 mapping, replay after partial failure, Tuesday defaults, unrelated mail, date and literal text handling');
