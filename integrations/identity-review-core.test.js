const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const match = require('./identity-review-core');

const historical = [
  {sourceRef:'TIC Graveyard:2',sourceTab:'TIC Graveyard',first:'Avery',last:'Morgan',dob:'2/13/1990',phone:'(314) 555-0101'},
  {sourceRef:'TIC Graveyard:3',sourceTab:'TIC Graveyard',first:'Avery',last:'Jones',dob:'1990-02-13',phone:'3145550101'},
  {sourceRef:'TIC Graveyard:4',sourceTab:'TIC Graveyard',first:'Avery',last:'Morgan',dob:'1980-02-13',phone:'3145550199'}
];
assert.deepEqual(match.personCandidates({first:'Avery',last:'Morgn',dob:'1990-02-13'},historical).map(x=>x.sourceRef),['TIC Graveyard:2']);
assert.equal(match.personCandidates({first:'Avery',last:'Morgan',dob:'1990-02-13'},historical).length,2);
assert.equal(match.personCandidates({first:'Different',last:'Person',dob:'1995-01-01',phone:'+1 314.555.0101'},historical).length,2);
assert.equal(match.personCandidates({first:'AVERY',last:'(Mor-gan)/Jones',dob:'02-13-1990'},historical).length,3);
assert.equal(match.personCandidates({first:'Unrelated',last:'Person',dob:'1990-02-13'},historical).length,0);
assert.deepEqual(match.phones('\u202a+1 (314) 555-0101\u202c / 314.555.0199 ext 22'),['3145550101','3145550199']);
assert.deepEqual(match.phones('case 250362633; date 6/28/1994'),[]);
assert.equal(match.dob(34513),'1994-06-28');
assert.equal(match.dob('06-28-1994'),'1994-06-28');
assert.equal(match.dob('2/30/1990'),'');
assert.equal(match.dob('2/13/90'),'');
assert.deepEqual(match.caseNumbersInText('250362633, 25SL-CR09715-01 and 25SL-CR09715'),['250362633','25SL-CR09715-01','25SL-CR09715']);
assert.equal(match.supportedCase('unrecognized'),false);
assert.equal(match.supportedCase('25SL-CR09715-01'),true);
assert.equal(match.caseCandidates({caseNumber:'25SL-CR09715'},[{caseNumbers:['25SL-CR09715-01']}]).length,0);
assert.equal(match.caseCandidates({caseNumber:'25sl-cr09715'},[{caseNumbers:['25SL-CR09715']}]).length,0);
assert.equal(match.clientStatus([{Decision:'Dismissed'}]),'No Client Match');
assert.equal(match.clientStatus([{Decision:'Confirmed'}]),'Repeat Client Confirmed');
assert.equal(match.caseStatus([{SourceTab:'Cases'},{SourceTab:'TIC Graveyard'}]),'Match Found - Awaiting Confirmation');

const clientHeaders=['ClientID','ClientRowID','FirstName','LastName','DOB','Phone','PriorTICClient','PriorTICClientReason','Notes'];
const caseHeaders=['CaseID','CaseNumber','Jurisdiction'];
const identityHeaders=['CandidateID','ClientRowID','SourceTab','SourceRow','MatchReasons','CandidateClientID','Decision','ReviewedBy','ReviewedAt','SourceFingerprint'];
const caseMatchHeaders=['CandidateID','CaseID','SourceTab','SourceRow','MatchReason','SubmissionStatus','Decision','ReviewedBy','ReviewedAt','SourceFingerprint'];
const clients=[clientHeaders,
  ['identity-a','client-a','Avery','Morgan','1990-02-13','(314) 555-0101','','','Keep these staff notes'],
  ['identity-b','client-b','Different','Person','1991-06-28','3145550198','','','Other notes']];
const cases=[caseHeaders,['case-a','250362633','Florissant'],['case-b','250362633','Manchester'],
  ['case-c','999999999','Florissant'],['case-d','invalid-fixture','Florissant']];
const graveyard=[['TIC Week','First Name','Last Name','Middle','DOB','Eligible Cases','Ineligible Cases','Phone Number'],
  ['2025-01-07','Avery','Morgan','','2/13/1990','250362633;25SL-CR09715-01','999999999','+1 314-555-0101']];
const calls=[Array(20).fill(''),Array(20).fill('')];
calls[0][2]='Call +1 (314) 555-0101 or 3145550199'; // C, row 1 must be searched.
calls[1][1]='3145550198'; calls[1][19]='3145550198'; // B and T must NOT be searched.
const people=[], caseMatches=[];
people.push(identityHeaders); caseMatches.push(caseMatchHeaders);
const sourceId='1TPCAM7rJ9e_YDLrgI4YfjOq_QXZFfo6Sj6c9g9qPth4';
const targetId='1Yhol_3USiPmUNNhz6Mmyou2ArJ93WAlCdEKzNfi5TD8';
let sourceDenied=false, sourceReads=0, lockHeld=false;
const writes=[];
function sheet(name,rows,isSource=false) {
  return {
    getLastColumn:()=>Math.max(...rows.map(r=>r.length)),
    getLastRow:()=>rows.length,
    getRange:(r,c,h=1,w=1)=>{
      const read=()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j] ?? ''));
      if(isSource) {
        if(name==='Completed Call Log') assert.ok(c===3&&w===17,'Call-log search must be C:S only');
        if(name==='TIC Graveyard') assert.ok(c===1&&w===8,'Graveyard reader must use A:H and compare only F cases');
      }
      return {
        getValues:read,getDisplayValues:()=>read().map(row=>row.map(String)),
        getValue:()=>read()[0][0],
        setValue:value=>{
          assert.equal(isSource,false,'Historical sources must be read-only');
          while(rows.length<r)rows.push([]);
          rows[r-1][c-1]=value;
          writes.push({name,row:r,col:c,value});
        }
      };
    },
    appendRow:row=>{assert.equal(isSource,false);rows.push([...row]);writes.push({name,append:true});}
  };
}
const targets={Clients:sheet('Clients',clients),Cases:sheet('Cases',cases),
  IdentityCandidates:sheet('IdentityCandidates',people),CaseMatchCandidates:sheet('CaseMatchCandidates',caseMatches)};
const sources={'TIC Graveyard':sheet('TIC Graveyard',graveyard,true),'Completed Call Log':sheet('Completed Call Log',calls,true)};
const properties=new Map();
const context=vm.createContext({
  console:{log:()=>{}},Date,Map,Set,Object,Array,String,Number,
  LockService:{getScriptLock:()=>({
    waitLock:()=>{assert.equal(lockHeld,false);lockHeld=true;},
    releaseLock:()=>{lockHeld=false;}
  })},
  PropertiesService:{getScriptProperties:()=>({
    getProperty:key=>properties.get(key)||null,
    setProperty:(key,value)=>{properties.set(key,value);}
  })},
  Utilities:{
    DigestAlgorithm:{SHA_256:'sha256'},
    computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],
    formatDate:(date,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
  },
  SpreadsheetApp:{
    flush:()=>{},
    openById:id=>{
      if(id===sourceId) {sourceReads++;if(sourceDenied)throw new Error('Synthetic permission error');return {getSheetByName:name=>sources[name],getSpreadsheetTimeZone:()=> 'America/Chicago'};}
      assert.equal(id,targetId);return {getSheetByName:name=>targets[name],getSpreadsheetTimeZone:()=> 'Etc/GMT'};
    }
  }
});
vm.runInContext(fs.readFileSync(__dirname+'/identity-review-core.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/identity-review-adapter.gs','utf8'),context);
const asObject=(headers,row)=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??'']));
const records=(headers,rows)=>rows.slice(1).map(row=>asObject(headers,row));
const personRows=()=>records(identityHeaders,people);
const caseRows=()=>records(caseMatchHeaders,caseMatches);
const client=()=>asObject(clientHeaders,clients[1]);
const summary=id=>caseRows().find(r=>r.CandidateID==='CASE-CHECK-'+id);
context.refreshTICReviewCandidates();
assert.equal(client().PriorTICClient,'Match Found - Awaiting Confirmation');
assert.equal(asObject(clientHeaders,clients[2]).PriorTICClient,'No Client Match');
assert.equal(personRows().filter(r=>r.ClientRowID==='client-a'&&r.SourceTab!=='Check summary').length,2);
assert.equal(summary('case-a').SubmissionStatus,'Match Found - Awaiting Confirmation');
assert.equal(summary('case-c').SubmissionStatus,'No Case Match','Column G must not disqualify a case');
assert.equal(summary('case-d').SubmissionStatus,'Error','Unknown format must not look clear');
assert.ok(caseRows().some(r=>r.CaseID==='case-a'&&r.SourceTab==='Cases'));
assert.equal(client().Notes,'Keep these staff notes');
assert.ok(writes.every(w=>w.name!=='Cases'),'Case data and eligibility must never be altered');
assert.ok(writes.filter(w=>w.name==='Clients').every(w=>w.col===7||w.col===8),'Only the two client-result cells may change');
let historicalMatch=people.find(row=>row[1]==='client-a'&&row[2]==='TIC Graveyard');
historicalMatch[6]='Confirmed';historicalMatch[7]='reviewer@example.invalid';historicalMatch[8]='2026-10-26T12:00:00Z';
const stableId=historicalMatch[0], rowCount=people.length;
context.checkClientHistory('client-a');
assert.equal(client().PriorTICClient,'Repeat Client Confirmed');
assert.equal(people.length,rowCount);
assert.equal(historicalMatch[7],'reviewer@example.invalid');
// A source-row insert must update links without discarding a reviewed match.
graveyard.splice(1,0,['','','','','','','','']);
context.checkClientHistory('client-a');
assert.equal(historicalMatch[0],stableId);assert.equal(historicalMatch[3],'3');
assert.equal(historicalMatch[6],'Confirmed');
for(const row of people.slice(1))if(row[1]==='client-a'&&row[2]!=='Check summary')row[6]='Dismissed';
context.checkClientHistory('client-a');
assert.equal(client().PriorTICClient,'No Client Match');
// Changed current inputs must not inherit confirmations or dismissals from older inputs.
clients[1][5]='3145550199';
context.checkClientHistory('client-a');
assert.equal(client().PriorTICClient,'Match Found - Awaiting Confirmation');
assert.ok(personRows().some(r=>r.SourceTab==='Completed Call Log'&&r.SourceRow==='1'));
sourceDenied=true;context.checkClientHistory('client-a');
assert.equal(client().PriorTICClient,'Error');
context.checkCaseHistory('case-a');assert.equal(summary('case-a').SubmissionStatus,'Error');
sourceDenied=false;context.checkCaseHistory('case-a');
// Removing one side of an AppSheet duplicate must refresh the other side too.
cases[2][1]='123456789';
context.checkCaseHistory('case-b');
assert.equal(summary('case-b').SubmissionStatus,'No Case Match');
cases[1][1]='123456789';
context.checkCaseHistory('case-a');
assert.equal(summary('case-a').SubmissionStatus,'Duplicate AppSheet Entry');
assert.equal(summary('case-b').SubmissionStatus,'Duplicate AppSheet Entry');
for(const row of caseMatches.slice(1))if(row[1]==='case-a'&&row[2]==='Cases')row[6]='Dismissed';
context.checkCaseHistory('case-a');
assert.equal(summary('case-a').SubmissionStatus,'No Case Match');
// One daily scan, not one per importer execution.
properties.clear();
const beforeDaily=sourceReads;
context.runTICIntakeChecks([]);
assert.equal(sourceReads,beforeDaily+1);
context.runTICIntakeChecks([]);
assert.equal(sourceReads,beforeDaily+1);
context.runTICIntakeChecks(['client-a']);
assert.equal(sourceReads,beforeDaily+2,'A new intake still gets its own event-driven check');
assert.equal(lockHeld,false);
console.log('PASS: name/DOB/phone normalization, both historical tabs, first call-log row, F-only cases, exact suffixes, advisory-only writes, review persistence, stale-input invalidation, source errors, counterpart duplicates, one daily refresh.');
