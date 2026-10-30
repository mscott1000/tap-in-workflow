const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(__dirname + '/voice-communications.gs', 'utf8');
const headers = ['CommunicationID','ContactType','Phone','Date','Time','StaffNotes',
  'ContactLog','Status','FirstName','MiddleName','LastName','ClientRowID',
  'SourceMessageID','SourceTimestamp','MatchDetails'];
const rows = [headers];
let messages = [];
let searches = [];
let lockReleased = 0;
const sheet = {
  getLastColumn: () => headers.length,
  getLastRow: () => rows.length,
  getRange: (r,c,h,w) => ({
    getValues: () => rows.slice(r-1,r-1+h).map(row => row.slice(c-1,c-1+w)),
    getDisplayValues: () => rows.slice(r-1,r-1+h).map(row => row.slice(c-1,c-1+w).map(String)),
    setValues: values => {
      assert.equal(c,1);
      assert.equal(r,rows.length+1);
      values.forEach(v => rows.push(v));
    }
  })
};
const clients = [
  ['FirstName','MiddleName','LastName','Phone'],
  ['Avery','','Morgan','314-555-0101']
];
const clientSheet = {
  getLastRow: () => clients.length,
  getDataRange: () => ({getDisplayValues: () => clients.map(r => [...r])})
};
const ctx = vm.createContext({
  console, Date, Set, Array, CONFIG:{SHEET_ID:'synthetic-workbook'},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{lockReleased++;}})},
  SpreadsheetApp:{openById:id=>{
    assert.equal(id,'synthetic-workbook');
    return {getSheetByName:name=>({Communications:sheet,Clients:clientSheet})[name]};
  }},
  GmailApp:{search:(query,start,count)=>{
    assert.match(query,/newer_than:3d/);
    assert.doesNotMatch(query,/is:unread|markRead|label:/i);
    searches.push(start);
    return messages.slice(start,start+count).map(m=>({getMessages:()=>[m]}));
  }},
  Utilities:{formatDate:(date,tz,pattern)=>{
    assert.equal(tz,'America/Chicago');
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US',{
      timeZone:tz,month:'numeric',day:'numeric',year:'2-digit',hour:'numeric',
      minute:'2-digit',hour12:false
    }).formatToParts(date).map(x=>[x.type,x.value]));
    return pattern==='M/d/yy' ? `${parts.month}/${parts.day}/${parts.year}` :
      `${parts.hour}:${parts.minute}`;
  }}
});
vm.runInContext(source,ctx);
ctx.ticHistory_=()=>({people:[{first:'Avery',last:'Morgan',phones:['3145550101'],sourceTab:'TIC Graveyard',sourceRow:4}],cases:[]});
const sender='Google Voice <voice-noreply@google.com>';
const message=(id,subject,body,date=new Date())=>({
  getId:()=>id,getSubject:()=>subject,getPlainBody:()=>body,getBody:()=>'',
  getFrom:()=>sender,getDate:()=>date,
  markRead:()=>{throw new Error('must not change Gmail read state');}
});
const mapped = row => Object.fromEntries(headers.map((h,i)=>[h,row[i]]));

assert.equal(ctx.TICVoice.parse('New voicemail from Avery Morgan.',
  'Google Voice '+Array(10).fill('word').join(' ')+' play message','',sender).ContactType,'Missed Call');
assert.equal(ctx.TICVoice.parse('New voicemail from Avery Morgan.',
  'Google Voice '+Array(11).fill('word').join(' ')+' play message','',sender).ContactType,'Voicemail');
assert.equal(ctx.TICVoice.parse('New missed call from Avery Morgan.','','','fake@example.invalid'),null);
assert.equal(ctx.TICVoice.parse('New missed call from Avery Morgan.',
  'Footer number 314-555-9999','','Google Voice <voice-noreply@google.com>').Phone,'');
assert.equal(ctx.TICVoice.parse('New voicemail from Avery Middle Morgan Jr.','','',sender).LastName,'Morgan');
assert.equal(ctx.TICVoice.matches({Phone:'(314) 555-0101'},
  [{first:'Avery',last:'Morgan',phones:['3145550101'],source:'Clients',row:2}]).length,1);

messages=[message('one','New voicemail from (314) 555-0101.',
  'Google Voice '+Array(11).fill('hello').join(' ')+' play message'),
  message('two','New missed call from Avery Morgan.','Footer number 314-555-9999')];
assert.equal(ctx.runTICVoiceIngest().created,2);
assert.equal(rows.length,3);
const a=mapped(rows[1]),b=mapped(rows[2]);
assert.equal(a.CommunicationID,'voice_one');
assert.equal(a.ContactType,'Voicemail');
assert.equal(a.Phone,'(314) 555-0101');
assert.equal(a.Status,'');
assert.match(a.StaffNotes,/Avery Morgan.*Clients/);
assert.match(a.MatchDetails,/TIC Graveyard/);
assert.equal(a.ContactLog,'');
assert.equal(b.Phone,'');
assert.match(b.StaffNotes,/Possible name match; phone and identity unconfirmed/);
assert.equal(ctx.runTICVoiceIngest().created,0);
assert.equal(rows.length,3);
assert.equal(lockReleased,2);

messages=[message('old','New missed call from Avery Morgan.','',new Date(Date.now()-4*86400000))];
assert.equal(ctx.runTICVoiceIngest().created,0);
assert.equal(rows.length,3);
messages=Array.from({length:51},(_,i)=>message('page-'+i,
  'New missed call from (314) 555-0101.',''));
assert.equal(ctx.runTICVoiceIngest().created,51);
assert.ok(searches.includes(50));
assert.equal(ctx.runTICVoiceIngest().created,0);
assert.equal(rows.length,54);
console.log('PASS: synthetic classification, sender, phone/name, source advice, dates, 3-day filter, pagination, dedup, blank status and no Gmail writes');
