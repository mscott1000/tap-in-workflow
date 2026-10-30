import assert from 'node:assert/strict';
import { fingerprint, buildBundle, runRelease, targetFor } from '../scripts/release-lib.mjs';

const live = [
  { name: 'appsscript', type: 'JSON', source: '{"timeZone":"America/Chicago","runtimeVersion":"V8"}' },
  { name: 'owned', type: 'SERVER_JS', source: 'function existing() {}' },
  { name: 'unlisted', type: 'SERVER_JS', source: 'function preserveThis() {}' },
  { name: 'panel', type: 'HTML', source: '<p>Preserve</p>' }
];
const replacements = [{ name: 'owned', type: 'SERVER_JS', source: 'function changed() {}' },
  { name: 'added', type: 'SERVER_JS', source: 'function added() {}' }];
function fixture() {
  const target = { scriptId: 'synthetic-project', enabled: true, reconciliationComplete: true,
    baselineSha256: fingerprint(live), blockers: [], expectedExistingFiles: ['owned'],
    files: [{ name: 'owned', type: 'SERVER_JS', path: 'integrations/owned.gs' },
      { name: 'added', type: 'SERVER_JS', path: 'integrations/added.gs' }] };
  const config = { allowApply: true, targets: { test: target } };
  const registry = { scriptProjects: { test: { id: 'synthetic-project' } } };
  const readSource = async path => replacements[path.endsWith('owned.gs') ? 0 : 1].source;
  const plan = buildBundle(target, live, replacements);
  return { config, registry, readSource, targetName: 'test', approvedBundleSha256: plan.bundleSha256, target, plan };
}
const clone = x => structuredClone(x);

assert.equal(fingerprint(live), fingerprint([...live].reverse()), 'inventory order must not create false drift');
assert.throws(() => fingerprint([...live, live[0]]), /duplicate/);
assert.throws(() => fingerprint([]), /Empty/);
{
  const f = fixture();
  f.config.allowApply = false;
  const result = await runRelease({ ...f, client: new Proxy({}, { get() { throw new Error('offline must not use client'); } }) });
  assert.equal(result.networkUsed, false);
  assert.equal(result.liveCodeChanged, false);
  assert.equal(result.runtimeFunctionsExecuted, false);
  assert.match(result.result, /Offline/);
  await assert.rejects(runRelease({ ...f, mode: 'apply' }), /disabled/);
  await assert.rejects(runRelease({ ...f, mode: 'inspect' }), /User-configured/);
}
{
  const f = fixture();
  assert.throws(() => targetFor(f.config, { scriptProjects: { test: { id: 'wrong' } } }, 'test'), /disagrees/);
  assert.throws(() => targetFor(f.config, f.registry, 'unknown'), /Unknown/);
  for (const path of ['../outside.gs', 'integrations/../../outside.gs', '/absolute.gs']) {
    const c = clone(f.config); c.targets.test.files[0].path = path;
    assert.throws(() => targetFor(c, f.registry, 'test'), /not allowed/);
  }
  const c = clone(f.config); c.targets.test.files[0].name = 'appsscript';
  assert.throws(() => targetFor(c, f.registry, 'test'), /manifest/);
  assert.throws(() => buildBundle(f.target, live.filter(x => x.name !== 'appsscript'), replacements), /manifest/);
  assert.throws(() => buildBundle(f.target, live.filter(x => x.name !== 'owned'), replacements), /expected/);
  assert.throws(() => buildBundle(f.target, live, [{ name: 'unapproved', type: 'SERVER_JS', source: '' }]), /outside/);
  assert.equal(f.plan.files.length, 5);
  for (const name of ['unlisted', 'panel', 'appsscript'])
    assert.deepEqual(f.plan.files.find(x => x.name === name), live.find(x => x.name === name));
  assert.deepEqual(f.plan.changes.map(x => x.operation), ['add', 'replace']);
}
{
  const f = fixture(); let writes = 0;
  const client = { getContent: async () => ({ files: live }), updateContent: async () => writes++ };
  const result = await runRelease({ ...f, mode: 'inspect', client });
  assert.equal(result.liveCodeChanged, false); assert.equal(writes, 0);
  f.target.baselineSha256 = 'a'.repeat(64);
  await assert.rejects(runRelease({ ...f, mode: 'apply', client }), /drifted/);
  assert.equal(writes, 0);
  f.target.baselineSha256 = fingerprint(live);
  await assert.rejects(runRelease({ ...f, mode: 'apply', client, approvedBundleSha256: 'b'.repeat(64) }), /differs/);
  f.target.blockers = ['not ready'];
  await assert.rejects(runRelease({ ...f, mode: 'apply', client }), /blockers/);
}
{
  const f = fixture(); let reads = 0, writes = 0;
  const client = { getContent: async () => ({ files: reads++ ? [...live, { name: 'new-live-edit', type: 'SERVER_JS', source: '' }] : live }),
    updateContent: async () => writes++ };
  await assert.rejects(runRelease({ ...f, mode: 'apply', client }), /changed during preflight/);
  assert.equal(writes, 0);
}
{
  const f = fixture(); let stored = clone(live); const calls = [];
  const client = {
    getContent: async id => { assert.equal(id, 'synthetic-project'); calls.push('read'); return { files: clone(stored) }; },
    createVersion: async () => { calls.push('version'); return { versionNumber: 7 }; },
    updateContent: async (id, files) => { calls.push('write'); stored = clone(files); }
  };
  const result = await runRelease({ ...f, mode: 'apply', client });
  assert.deepEqual(calls, ['read', 'read', 'version', 'write', 'read']);
  assert.equal(result.priorVersionNumber, 7); assert.equal(result.liveCodeChanged, true);
  assert.equal(result.runtimeFunctionsExecuted, false); assert.equal(fingerprint(stored), f.plan.bundleSha256);
  f.target.baselineSha256 = fingerprint(stored); calls.length = 0;
  const again = await runRelease({ ...f, mode: 'apply', client });
  assert.equal(again.liveCodeChanged, false); assert.deepEqual(calls, ['read']);
}
{
  const f = fixture(); let reads = 0, writes = 0;
  const client = { getContent: async () => ({ files: ++reads > 2 ? live : clone(live) }),
    createVersion: async () => ({ versionNumber: 9 }), updateContent: async () => { writes++; } };
  await assert.rejects(runRelease({ ...f, mode: 'apply', client }), /readback differs.*Prior version: 9/);
  assert.equal(writes, 1, 'readback failure must not automatically retry or overwrite again');
}
console.log('PASS: offline default, permission gates, target allowlist, path safety, manifest/unknown-file preservation, drift checks, exact approval, version checkpoint, readback, idempotence, no runtime calls');
