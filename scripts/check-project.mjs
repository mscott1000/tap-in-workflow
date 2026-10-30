import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const registry = JSON.parse(await read('config/project-registry.json'));
const installation = JSON.parse(await read('config/script-installation.json'));
const schema = JSON.parse(await read('config/live-schema.snapshot.json'));
assert.equal(schema.containsRowData, false);
assert.equal(registry.spreadsheets.historical.readOnly, true);
assert.equal(registry.scriptProjects['legacy-workflow'].publishingAllowed, false);
assert.equal(registry.access.automatedGooglePublishing, false);
assert.equal(installation.mode, 'user-copy-paste');
assert.equal(installation.automatedPublishing, false);
for (const table of Object.values(schema.tables)) assert.equal(new Set(table.headers).size, table.headers.length);
const paths = new Set(installation.files.flatMap(file => [file.source, ...(file.components || [])]));
for (const file of installation.files) {
  assert.equal(file.project, 'appsheet-intake');
  assert.ok(registry.scriptProjects[file.project]);
  assert.match(file.editorFile, /^[a-z0-9-]+$/);
}
for (const path of paths) {
  assert.match(path, /^integrations\/[a-z0-9-]+\.(gs|js)$/);
  const source = await read(path);
  new vm.Script(source, { filename: path }); // Parse, never execute.
  assert.doesNotMatch(source, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|ya29\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}/, 'Credential-shaped literal in source');
}
const core = (await read('integrations/eligible-cases-core.js')).replace(/^if \(typeof module[^\n]*\n?/m, '').trim();
const adapter = (await read('integrations/eligible-cases-adapter.gs')).trim();
const combined = (await read('integrations/eligible-cases-install.gs')).trim();
assert.equal(combined, core + '\n\n' + adapter, 'Combined generator must match its reviewed component sources');
for (const path of ['AGENTS.md', 'docs/CURRENT_PROJECT.md', 'docs/CHANGE_PROCESS.md', 'docs/USER_SETUP.md', 'docs/SCRIPT_INSTALLATION.md', 'docs/NEXT_STEPS.md', 'docs/CHANGE_HANDOFF_TEMPLATE.md'])
  assert.ok((await read(path)).trim(), path + ' missing');
console.log('PASS: exact headers, source syntax, copy destinations, no credential-shaped literals, synchronized generator, required context.');
console.log('Installation: user copy/paste only. Google publishing: not configured.');
