import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const installation = JSON.parse(await read('config/script-installation.json'));
assert.equal(installation.mode, 'user-copy-paste');
assert.equal(installation.automatedPublishing, false);
assert.equal(installation.files.length, 5);
assert.equal(new Set(installation.files.map(f => f.project + ':' + f.editorFile)).size, 5);
const expected = [
  ['gmail-phase-two-importer.gs', 'appsheet-intake-forms'],
  ['identity-review-core.js', 'history-match-core'],
  ['identity-review-adapter.gs', 'history-match-adapter'],
  ['voice-communications.gs', 'voice-communications'],
  ['eligible-cases-install.gs', 'eligible-cases-install']
];
for (const [source, target] of expected) {
  const file = installation.files.find(f => f.source === 'integrations/' + source);
  assert.equal(file?.editorFile, target);
  assert.equal(file.project, 'appsheet-intake');
  assert.ok(file.state);
  await access(resolve(root, file.source));
}
assert.equal(installation.files.find(f => f.editorFile === 'eligible-cases-install').state, 'tested-ready-user-installation');
for (const path of ['.github/workflows/apps-script-release.yml', 'scripts/apps-script-release.mjs', 'config/deployment-targets.json'])
  await assert.rejects(access(resolve(root, path)), { code: 'ENOENT' });
const pkg = JSON.parse(await read('package.json'));
assert.equal(pkg.scripts.setup, 'node scripts/setup.mjs');
assert.ok(!pkg.dependencies && !pkg.devDependencies);
assert.ok(!Object.keys(pkg.scripts).some(s => /deploy|release/.test(s)));
const workflow = await read('.github/workflows/verify.yml');
assert.match(workflow, /npm run setup/);
assert.doesNotMatch(workflow, /secrets\.|environment:|googleapis/);
const setup = await read('scripts/setup.mjs');
assert.doesNotMatch(setup, /fetch\(|https?:\/\/|process\.env|writeFile|execSync/);
const rules = await read('AGENTS.md');
assert.match(rules, /complete all relevant edits supported by the connected Google Drive\/Sheets tools/);
assert.match(rules, /user copies approved files into Apps Script/);
console.log('PASS: five exact copy targets, candidate safeguards, credential-free setup/CI, no automated publisher, direct-Sheet working rules.');
