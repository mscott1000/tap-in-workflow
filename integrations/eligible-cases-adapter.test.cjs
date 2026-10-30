const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const core = fs.readFileSync(__dirname+'/eligible-cases-core.js','utf8');
const adapter = fs.readFileSync(__dirname+'/eligible-cases-adapter.gs','utf8');
const caseHeaders = JSON.parse(fs.readFileSync(__dirname+'/../config/live-schema.snapshot.json')).tables.Cases.headers;
const summary = 'FLORISSANT MUNICIPAL - (314) 555-0100\n- 250000001: Synthetic charge\n- 250000002: Synthetic charge';
const notes = ['250000001','250000002'].map(n=>`${n} – SYNTHETIC FIXTURE
Location: Florissant Municipal
Attorney: - - -
Most Recent Warrant/Summons: 1/2/2025
Bond Amount: 0
Charge Text: =SYNTHETIC()
Charge Class: Ordinance
CaseNet: https://www.courts.mo.gov/casenet/cases/newHeader.do?inputVO.caseNumber=${n}`).join('\n\n');
function fixture({history=true,empty=false,missingHeader=false}={}) {
  const clients = [['ClientRowID','ClientID','EligibleCases','EligibleNotes'],
    ['synthetic-row','synthetic-identity',empty?'':summary,empty?'':notes]];
  const cases = [caseHeaders.filter(h=>!missingHeader || h!=='ChargeClass')];
  let held=false, uuid=0, calls=0, failHistory=false, sourceDenied=false;
  const sheet = rows=>({
    getLastColumn:()=>rows[0].length,getLastRow:()=>rows.length,
    getRange:(r,c,h,w)=>({getDisplayValues:()=>rows.slice(r-1,r-1+h).map(row=>row.slice(c-1,c-1+w).map(String))}),
    appendRow:row=>{assert(held);cases.push([...row]);}
  });
  const ctx = vm.createContext({
    console,Array,String,Error,
    LockService:{getScriptLock:()=>({waitLock:()=>{assert(!held);held=true;},releaseLock:()=>{held=false;}})},
    SpreadsheetApp:{openById:()=>({getSheetByName:name=>({Clients:sheet(clients),Cases:sheet(cases)})[name]}),flush:()=>{}},
    Utilities:{getUuid:()=>String(++uuid).padStart(16,'0')}
  });
  if(history) ctx.checkCaseHistory=id=>{assert(!held,'History must run after releasing the shared script lock');assert(id);calls++;if(failHistory)throw new Error('Synthetic history failure');return {sourceError:sourceDenied};};
  vm.runInContext(core+'\n'+adapter,ctx);
  return {ctx,clients,cases,get calls(){return calls;},get held(){return held;},set failHistory(v){failHistory=v;},set sourceDenied(v){sourceDenied=v;}};
}
const f=fixture();
let result=f.ctx.createEligibleCasesForClient('synthetic-row');
assert.equal(result.created.length,2);
assert.equal(f.calls,1,'One history refresh checks all Cases');
const row=Object.fromEntries(caseHeaders.map((h,i)=>[h,f.cases[1][i]]));
assert.equal(row.ClientRowID,'synthetic-row');
assert.equal(row.ClientID,'synthetic-identity');
assert.equal(row.ChargeClass,'O');
assert.equal(row.Jurisdiction,'Florissant');
assert.equal(row.CasePhase,'Request');
assert.equal(row.BondAmount,0);
assert.equal(row.ChargeText,"'=SYNTHETIC()");
assert.match(row.ResearchNotes,/ATTORNEYNAME/);
result=f.ctx.createEligibleCasesForClient('synthetic-row');
assert.equal(result.created.length,0);
assert.equal(result.skipped.length,2);
assert.equal(f.cases.length,3);
assert.equal(f.calls,2,'Retry refreshes history even when all cases already exist');
f.failHistory=true;
assert.throws(()=>f.ctx.createEligibleCasesForClient('synthetic-row'),/Cases saved; advisory history refresh failed/);
assert(!f.held);
f.failHistory=false;
f.ctx.createEligibleCasesForClient('synthetic-row');
assert.equal(f.cases.length,3);
// A first-run check failure leaves persisted rows retry-safe.
const fail=fixture();fail.failHistory=true;
assert.throws(()=>fail.ctx.createEligibleCasesForClient('synthetic-row'),/Retry Generate Cases/);
assert.equal(fail.cases.length,3);
fail.failHistory=false;
assert.equal(fail.ctx.createEligibleCasesForClient('synthetic-row').created.length,0);
assert.equal(fail.cases.length,3);
const absent=fixture({history:false});
assert.throws(()=>absent.ctx.createEligibleCasesForClient('synthetic-row'),/Install alongside/);
assert.equal(absent.cases.length,1);
assert(!absent.held);
const empty=fixture({empty:true,history:false});
assert.equal(empty.ctx.createEligibleCasesForClient('synthetic-row').manualCaseRequired,true);
assert.equal(empty.cases.length,1,'Fallback must not create a draft Case');
const missing=fixture({missingHeader:true});
assert.throws(()=>missing.ctx.createEligibleCasesForClient('synthetic-row'),/Missing required column: ChargeClass/);
assert.equal(missing.cases.length,1);
assert.throws(()=>f.ctx.createEligibleCasesForClient('unknown'),/Expected one matching Clients row/);

const denied=fixture();denied.sourceDenied=true;
assert.throws(()=>denied.ctx.createEligibleCasesForClient('synthetic-row'),/Historical source is unreadable/);
assert.equal(denied.cases.length,3);
denied.sourceDenied=false;
assert.equal(denied.ctx.createEligibleCasesForClient('synthetic-row').created.length,0);
console.log('PASS: generator linked rows, enum mappings, warnings, literal text, repeat-run deduplication, missing dependency/header, fallback, and history-failure recovery.');
