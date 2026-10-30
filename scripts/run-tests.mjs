import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tests = [
  'integrations/gmail-phase-two-importer.test.cjs',
  'integrations/identity-review-core.test.js',
  'integrations/eligible-cases-core.test.js',
  'integrations/eligible-cases-adapter.test.cjs',
  'integrations/voice-communications.test.cjs',
  'tests/workflow.test.mjs'
];
let failed = 0;
for (const test of tests) {
  console.log('\nTEST ' + test);
  const result = spawnSync(process.execPath, [resolve(root, test)], { cwd: root, stdio: 'inherit', env: { ...process.env, TZ: 'America/Chicago' } });
  if (result.status !== 0 || result.error) failed++;
}
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' suites passed. Synthetic/mock checks only.');
process.exitCode = failed ? 1 : 0;
