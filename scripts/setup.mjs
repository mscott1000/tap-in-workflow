import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error('Node 22 or later is required.');
  process.exit(1);
}
for (const file of ['scripts/run-tests.mjs', 'scripts/check-project.mjs']) {
  const result = spawnSync(process.execPath, [resolve(root, file)], { cwd: root, stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(1);
}
console.log('READY: repository tests passed. No installation, Google login, network request, or live change was performed.');
console.log('Next: read docs/USER_SETUP.md; verify connected Google Drive access separately in the new task.');
