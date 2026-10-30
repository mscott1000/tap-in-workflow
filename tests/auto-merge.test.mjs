import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync(new URL('../.github/workflows/auto-merge.yml', import.meta.url), 'utf8');
assert.match(workflow, /pull_request_target:/);
assert.match(workflow, /ready_for_review/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
assert.doesNotMatch(workflow, /uses:|--admin|checkout@/);
const block = workflow.match(/^        run: \|\n((?:          .*\n|\n)+)$/m);
assert(block, 'Expected one inline shell step, without executing checked-out code');
const shell = block[1].split('\n').map(line => line.startsWith('          ') ? line.slice(10) : line).join('\n');
assert.equal(spawnSync('bash', ['-n'], {input:shell}).status, 0);
const root = mkdtempSync(join(tmpdir(), 'tap-in-auto-merge-'));
try {
  const script = join(root,'enroll.sh');
  const log = join(root,'calls.jsonl');
  const data = join(root,'fixture.json');
  writeFileSync(script,shell);
  writeFileSync(join(root,'gh'), `#!/usr/bin/env node
const fs=require('node:fs');
const args=process.argv.slice(2), f=JSON.parse(fs.readFileSync(process.env.FIXTURE));
fs.appendFileSync(process.env.CALLS,JSON.stringify(args)+'\\n');
if(args[0]==='api') {
  const path=args.find(a=>a.startsWith('repos/'));
  if(path.endsWith('/branches/main')) {console.log(f.protected?'true':'false');process.exit(0);}
  if(path.includes('/pulls?')) {for(const p of f.prs)console.log(p.number);process.exit(0);}
  const n=Number(path.split('/').pop()), p=f.prs.find(p=>p.number===n);
  if(!p || p.fetchFail)process.exit(1);
  if(p.open!==false && !p.draft && !p.fork && !p.enrolled && (p.base||'main')==='main')console.log(p.sha||'synthetic-head-'+n);
  process.exit(0);
}
if(args[0]==='pr' && args[1]==='merge') {
 const p=f.prs.find(p=>p.number===Number(args[2]));
 process.exit(p.mergeFail?1:0);
}
process.exit(1);
`,{mode:0o755});
  function run(fixture,number='') {
    writeFileSync(data,JSON.stringify(fixture));writeFileSync(log,'');
    const result=spawnSync('bash',[script],{env:{...process.env,PATH:root+':'+process.env.PATH,GH_REPO:'synthetic/project',RUNNER_TEMP:root,PR_NUMBER:number,FIXTURE:data,CALLS:log},encoding:'utf8'});
    const calls=readFileSync(log,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    return {result,calls,merges:calls.filter(c=>c[0]==='pr')};
  }
  const prs=[{number:1},{number:2,draft:true},{number:3,fork:true},{number:4,enrolled:true},{number:5,base:'other'},{number:6,open:false},{number:7}];
  let r=run({protected:true,prs});
  assert.equal(r.result.status,0,r.result.stderr);
  assert.deepEqual(r.merges.map(c=>c[2]),['1','7']);
  assert(r.merges.every(c=>c.includes('--auto') && c.includes('--squash') && c.includes('--match-head-commit')));
  assert.equal(r.merges[0].at(-1),'synthetic-head-1');
  r=run({protected:true,prs},'7');
  assert.deepEqual(r.merges.map(c=>c[2]),['7']);
  assert(!r.calls.some(c=>c.some(a=>a.includes('state=open'))));
  r=run({protected:false,prs});assert.equal(r.result.status,1);assert.equal(r.merges.length,0);
  r=run({protected:true,prs:[{number:1,mergeFail:true},{number:7}]});
  assert.equal(r.result.status,1);assert.deepEqual(r.merges.map(c=>c[2]),['1','7']);
  r=run({protected:true,prs:[{number:1,fetchFail:true},{number:7}]});
  assert.equal(r.result.status,1);assert.deepEqual(r.merges.map(c=>c[2]),['7']);
  r=run({protected:true,prs},'not-a-number');assert.equal(r.result.status,1);assert.equal(r.merges.length,0);
  console.log('PASS: automatic PR enrollment, draft/fork/base/closed exclusions, head matching, required-check guard, and per-PR failure isolation.');
} finally { rmSync(root,{recursive:true,force:true}); }
