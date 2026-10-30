import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { targetFor } from './release-lib.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const registry = JSON.parse(await read('config/project-registry.json'));
const config = JSON.parse(await read('config/deployment-targets.json'));
const schema = JSON.parse(await read('config/live-schema.snapshot.json'));
assert.equal(schema.containsRowData, false);
assert.equal(registry.spreadsheets.historical.readOnly, true);
assert.equal(registry.scriptProjects['legacy-workflow'].publishingAllowed, false);
for (const table of Object.values(schema.tables)) assert.equal(new Set(table.headers).size, table.headers.length);
for (const [name] of Object.entries(config.targets)) {
  const target = targetFor(config, registry, name);
  for (const file of target.files) {
    const source = await read(file.path);
    new vm.Script(source, { filename: file.path }); // Parse, never execute.
    assert.doesNotMatch(source, /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|ya29\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}/, 'Credential-shaped literal in source');
  }
  if (config.allowApply && target.enabled) {
    assert.equal(target.reconciliationComplete, true);
    assert.match(target.baselineSha256 || '', /^[a-f0-9]{64}$/);
    assert.deepEqual(target.blockers, []);
  }
}
const core = (await read('integrations/eligible-cases-core.js')).replace(/^if \(typeof module[^\n]*\n?/m, '').trim();
const adapter = (await read('integrations/eligible-cases-adapter.gs')).trim();
const combined = (await read('integrations/eligible-cases-install.gs')).trim();
assert.equal(combined, core + '\n\n' + adapter, 'Combined generator must match its reviewed component sources');
for (const path of ['AGENTS.md', 'docs/CURRENT_PROJECT.md', 'docs/CHANGE_PROCESS.md', 'docs/USER_SETUP.md'])
  assert.ok((await read(path)).trim(), path + ' missing');
console.log('PASS: config consistency, exact headers, parse-only source validation, no credential-shaped literals, synchronized generator bundle, required context');
console.log('Live publication enabled: ' + Boolean(config.allowApply && config.targets['appsheet-intake'].enabled));
