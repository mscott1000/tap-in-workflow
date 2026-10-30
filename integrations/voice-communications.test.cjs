const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname+'/voice-communications.gs','utf8');
const headers = ['CommunicationID','ContactType','Phone','Date','Time','StaffNotes','ContactLog','Status',
  'FirstName','MiddleName','LastName','ClientRowID','SourceMessageID','SourceTimestamp','MatchDetails'];
const key='TIC_VOICE_SYNC_V2', sender='Google Voice <voice-noreply@google.com>';
const BIG='900719925474099312345';
function fixture() {
  let now=Date.parse('2026-10-30T12:00:00Z'), historyId=BIG, email='owner@example.invalid';
  let history=()=>({historyId}), recovery=()=>({messages:[]});
  let writeFailure=false, propertyFailure=false, metadataFailure=null, bodyFailure=null, busy=false;
  const props=new Map(), rows=[headers], messages=new Map(), calls=[];
  let released=0, htmlReads=0, bodyReads=0, sheetReads=0, historyReads=0, createdTimers=0;
  const timers=[];
  class Clock extends Date { static now(){return now;} }
  const sheet={getLastColumn:()=>headers.length,getLastRow:()=>rows.length,
    getRange:(r,c,h,w)=>({
      getValues:()=>rows.slice(r-1,r-1+h).map(a=>a.slice(c-1,c-1+w)),
      getDisplayValues:()=>rows.slice(r-1,r-1+h).map(a=>a.slice(c-1,c-1+w).map(String)),
      setValues:values=>{if(writeFailure)throw new Error('Synthetic write failure');assert.equal(r,rows.length+1);assert.equal(c,1);rows.push(...values.map(a=>[...a]));}
    })};
  const properties={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>{if(propertyFailure)throw new Error('Synthetic property failure');props.set(k,v);}};
  const ctx=vm.createContext({console:{log:()=>{}},Date:Clock,Set,Array,Number,
    CONFIG:{SHEET_ID:'synthetic-book'},
    LockService:{getScriptLock:()=>({tryLock:()=>!busy,waitLock:()=>{},releaseLock:()=>{released++;}})},
    PropertiesService:{getScriptProperties:()=>properties},
    Gmail:{Users:{getProfile:()=>({historyId,emailAddress:email}),History:{list:(_,options)=>{calls.push(['history',options]);return history(options);}},Messages:{
      list:(_,options)=>{calls.push(['recovery',options]);return recovery(options);},
      get:(_,id,options)=>{
        calls.push(['metadata',id,options]);if(metadataFailure)throw metadataFailure;
        const m=messages.get(id);if(!m)throw Object.assign(new Error('Deleted'),{code:404});
        return {internalDate:String(m.at),payload:{headers:[{name:'From',value:m.sender},{name:'Subject',value:m.subject}]}};
      }
    }}},
    GmailApp:{search:()=>{throw new Error('Thread searches are forbidden');},getMessageById:id=>{
      calls.push(['message',id]);if(bodyFailure)throw bodyFailure;
      const m=messages.get(id);return {getPlainBody:()=>{bodyReads++;return m.plain;},getBody:()=>{htmlReads++;return m.html;},
        markRead:()=>{throw new Error('No Gmail writes');}};
    }},
    SpreadsheetApp:{openById:id=>{sheetReads++;assert.equal(id,'synthetic-book');return {getSheetByName:name=>name==='Communications'?sheet:null};},flush:()=>{calls.push(['flush']);}},
    ScriptApp:{getProjectTriggers:()=>timers,newTrigger:name=>({timeBased:()=>({everyMinutes:n=>({create:()=>{assert.equal(name,'runTICVoiceIngest');assert.equal(n,1);createdTimers++;timers.push({getHandlerFunction:()=>name});}})})})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],
      formatDate:(at,tz,format)=>{assert.equal(tz,'America/Chicago');return format==='M/d/yy'?'10/30/26':'7:00';}}
  });
  vm.runInContext(source,ctx);
  ctx.ticVoicePeople_=()=>{historyReads++;return [{first:'Avery',last:'Morgan',phones:['3145550101'],source:'Clients',row:2}];};
  function add(id,options={}){messages.set(id,{at:now+1000,sender,subject:'New missed call from (314) 555-0101.',plain:'',html:'',...options});return id;}
  const entries=ids=>[{id:'900719925474099312346',messagesAdded:ids.map(id=>({message:{id}}))}];
  const state=()=>JSON.parse(props.get(key));
  return {ctx,props,rows,calls,add,entries,state,messages,timers,
    init:()=>ctx.initializeTICVoiceSync(),run:()=>ctx.runTICVoiceIngest(),
    set history(fn){history=fn;},set recovery(fn){recovery=fn;},set now(v){now=v;},get now(){return now;},
    set historyId(v){historyId=v;},set email(v){email=v;},set writeFailure(v){writeFailure=v;},set propertyFailure(v){propertyFailure=v;},
    set metadataFailure(v){metadataFailure=v;},set bodyFailure(v){bodyFailure=v;},set busy(v){busy=v;},
    get stats(){return {released,htmlReads,bodyReads,sheetReads,historyReads,createdTimers};}};
}
const asObject=row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]]));
// Existing classification, caller/source advice and no footer contamination.
{
 const f=fixture(),p=f.ctx.TICVoice;
 assert.equal(p.parse('New voicemail from Avery Morgan.','Google Voice '+Array(10).fill('word').join(' ')+' play message','',sender).ContactType,'Missed Call');
 assert.equal(p.parse('New voicemail from Avery Morgan.','Google Voice '+Array(11).fill('word').join(' ')+' play message','',sender).ContactType,'Voicemail');
 assert.equal(p.parse('New missed call from Avery Morgan.','','','fake@example.invalid'),null);
 assert.equal(p.parse('New missed call from Avery Morgan.','Footer 314-555-9999','',sender).Phone,'');
 assert.equal(p.parse('New voicemail from Avery Middle Morgan Jr.','','',sender).LastName,'Morgan');
}
// Explicit initialization: no mail scan or rows, no silent rebaseline.
{
 const f=fixture();assert.throws(()=>f.run(),/not initialized/);
 assert.equal(f.init().created,0);assert.equal(f.state().anchor,BIG);assert.equal(f.calls.length,0);
 f.historyId='900719925474099399999';assert(f.init().alreadyInitialized);assert.equal(f.state().anchor,BIG);
 f.email='other@example.invalid';assert.throws(()=>f.run(),/another mailbox/);
 assert.throws(()=>f.init(),/another mailbox/);
 f.email='owner@example.invalid';f.props.set(key,'bad json');assert.throws(()=>f.run(),/corrupt/);
}
// Idle polling reads no Sheet rows or bodies after setup.
{
 const f=fixture();f.init();const reads=f.stats.sheetReads;
 assert.equal(f.run().created,0);assert.equal(f.stats.sheetReads,reads);assert.equal(f.stats.bodyReads,0);
}
// Baseline, header-first filters, read-independent messages and exact metadata receipt time.
{
 const f=fixture();f.init();
 const ids=[f.add('one'),f.add('unrelated',{subject:'Other notification'}),f.add('fake',{sender:'fake@example.invalid'}),
   f.add('old',{at:f.now-1000}),f.add('html',{subject:'New voicemail from Avery Morgan.',html:'Google Voice '+Array(11).fill('word').join(' ')+' play message'})];
 f.history=opts=>{assert.equal(opts.startHistoryId,BIG);return {history:f.entries(ids),historyId:BIG};};
 let r=f.run();assert.equal(r.created,2);assert.equal(r.examined,5);assert.equal(f.stats.bodyReads,2);assert.equal(f.stats.htmlReads,1);
 const a=asObject(f.rows[1]),b=asObject(f.rows[2]);
 assert.equal(a.CommunicationID,'voice_one');assert.equal(a.SourceMessageID,'one');assert.equal(a.SourceTimestamp,f.now+1000);
 assert.equal(a.Status,'');assert.equal(a.ContactLog,'');assert.equal(a.ClientRowID,'');assert.match(a.StaffNotes,/Phone match/);
 assert.equal(b.ContactType,'Voicemail');assert.match(b.StaffNotes,/identity unconfirmed/);
 assert(!JSON.stringify(f.rows).includes('play message'));assert.equal(f.stats.historyReads,1);
 const beforeBodies=f.stats.bodyReads;assert.equal(f.run().created,0);assert.equal(f.stats.bodyReads,beforeBodies);
 assert.equal(f.rows.length,3);
}
// More than 50 IDs on one page resume at the saved offset; messages on later pages drain too.
{
 const f=fixture();f.init();const ids=Array.from({length:60},(_,i)=>f.add('page-'+i));
 f.history=opts=>opts.pageToken?{history:f.entries([f.add('next')]),historyId:'900719925474099312999'}:
   {history:f.entries(ids),nextPageToken:'next-page',historyId:'900719925474099312888'};
 assert.equal(f.run().created,50);assert.equal(f.state().offset,50);assert.equal(f.state().anchor,BIG);
 assert.equal(f.run().created,10);assert.equal(f.state().pageToken,'next-page');assert.equal(f.state().anchor,BIG);
 assert.equal(f.run().created,1);assert.equal(f.state().anchor,'900719925474099312999');assert.equal(f.rows.length,62);
 assert(f.calls.filter(c=>c[0]==='history').every(c=>c[1].maxResults===25));
}
// New arrivals after a completed snapshot remain visible to the next history request.
{
 const f=fixture();f.init();const a=f.add('a'),b=f.add('b');
 f.history=o=>o.startHistoryId===BIG?{history:f.entries([a]),historyId:'900719925474099312346'}:
   {history:f.entries([b]),historyId:'900719925474099312347'};
 assert.equal(f.run().created,1);assert.equal(f.run().created,1);assert.equal(f.rows.length,3);
}
// Every failure before checkpoint leaves the source cursor unchanged, including crash-after-write.
for(const kind of ['writeFailure','propertyFailure','metadataFailure','bodyFailure']) {
 const f=fixture();f.init();const before=f.props.get(key);const id=f.add(kind);
 f.history=()=>({history:f.entries([id]),historyId:'900719925474099312346'});
 f[kind]=kind.endsWith('Failure') && ['metadataFailure','bodyFailure'].includes(kind)?new Error('Synthetic failure'):true;
 assert.throws(()=>f.run(),/Synthetic/);assert.equal(f.props.get(key),before);
 f[kind]=false;assert.equal(f.run().created,kind==='propertyFailure'?0:1);assert.equal(f.rows.length,2);
 assert(f.calls.findIndex(c=>c[0]==='flush')>=0);
}
// Deleted source messages are explicitly counted; transient permission errors stay blocking.
{
 const f=fixture();f.init();f.history=()=>({history:f.entries(['deleted']),historyId:BIG});
 assert.equal(f.run().deletedMessagesSkipped,1);
 f.metadataFailure=Object.assign(new Error('Forbidden'),{code:403});assert.throws(()=>f.run(),/Forbidden/);
}
// An expired cursor switches to bounded message-only recovery, never pre-activation mail.
{
 const f=fixture();f.init();const activation=f.now;f.now+=3600000;f.historyId='900719925474099399000';
 f.history=()=>{throw Object.assign(new Error('Expired'),{code:404});};
 assert.equal(f.run().recovery,'expired-history');assert.equal(f.state().mode,'recovery');
 assert.equal(f.state().windowStart,activation);assert.equal(f.state().windowEnd,activation+900000);
 const low=f.add('at-low',{at:activation}),high=f.add('at-high',{at:activation+900000});
 f.recovery=o=>{assert.match(o.q,new RegExp('after:'+(Math.floor(activation/1000)-1)));assert.equal(o.maxResults,50);return {messages:[{id:low},{id:high}]};};
 assert.equal(f.run().created,1);assert.equal(f.state().windowStart,activation+900000);
 // The exact upper boundary was not consumed; it belongs to the next window.
 f.recovery=()=>({messages:[{id:high}]});assert.equal(f.run().created,1);
 f.recovery=()=>({messages:[]});while(f.state().mode==='recovery')f.run();
 assert.equal(f.state().anchor,'900719925474099399000');assert.equal(f.state().coveredAt,f.now);
 f.history=()=>({historyId:'900719925474099399001'});assert.equal(f.run().more,false);
}
// Recovery pagination keeps its window fixed; invalid page tokens restart only that sequence.
{
 const f=fixture();f.init();f.now+=600000;f.history=()=>{throw Object.assign(new Error('Expired'),{code:404});};f.run();
 const low=f.state().windowStart,high=f.state().windowEnd,id=f.add('recover',{at:low+1});
 f.recovery=()=>({messages:[{id}],nextPageToken:'recovery-page'});assert.equal(f.run().created,1);
 assert.equal(f.state().windowStart,low);assert.equal(f.state().windowEnd,high);
 f.recovery=()=>{throw new Error('Invalid pageToken');};assert.equal(f.run().recovery,'restart-page-sequence');
 assert.equal(f.state().windowStart,low);assert(!f.state().pageToken);
 f.recovery=()=>({messages:[{id}]});assert.equal(f.run().created,0);assert.equal(f.rows.length,2);
}
// A stale history page token restarts from the unchanged history anchor.
{
 const f=fixture();f.init();f.history=()=>({history:[],nextPageToken:'bad',historyId:'900719925474099312346'});f.run();
 f.history=()=>{throw new Error('Invalid page token');};assert.equal(f.run().recovery,'restart-page-sequence');assert.equal(f.state().anchor,BIG);
}
// Read-only diagnostics do not create a baseline, scan mail, or install timers.
{
 const f=fixture();let r=f.ctx.inspectTICVoiceSetup();
 assert.equal(r.initialized,false);assert.equal(r.voiceTimersVisibleToThisAccount,0);assert.equal(f.props.size,0);assert.equal(f.calls.length,0);
 f.init();r=f.ctx.inspectTICVoiceSetup();assert(r.initialized);assert.equal(f.stats.bodyReads,0);
 delete f.ctx.Gmail;assert.throws(()=>f.run(),/advanced Gmail service/);
}
// One-minute trigger helper is explicit, owner-bound and does not change existing timers.
{
 const f=fixture();assert.throws(()=>f.ctx.enableTICVoiceMinuteTrigger(),/Initialize/);f.init();
 assert(f.ctx.enableTICVoiceMinuteTrigger().created);assert.equal(f.stats.createdTimers,1);
 assert.equal(f.ctx.enableTICVoiceMinuteTrigger().created,false);assert.equal(f.stats.createdTimers,1);
 f.busy=true;assert(f.run().busy);assert.equal(f.stats.bodyReads,0);
}
assert.doesNotMatch(source,/GmailApp\.search|\.getMessages\(|\.markRead\(|\.markUnread\(|\.addLabel\(|\.deleteTrigger\(|\.getTranscript\(/);
console.log('PASS: Voice metadata-only discovery, 50-ID resumable batches, no historical baseline import, bounded recovery, failure-safe checkpoints, deduplication, mailbox binding, classification, and explicit one-minute timer.');
