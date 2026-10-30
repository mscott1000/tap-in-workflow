import { createHash } from 'node:crypto';

const types = new Set(['SERVER_JS', 'HTML', 'JSON']);
const digest = value => createHash('sha256').update(value).digest('hex');

export function canonicalFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('Empty or missing script inventory');
  const names = new Set();
  return files.map(file => {
    if (!file || typeof file.name !== 'string' || !file.name || names.has(file.name))
      throw new Error('Missing or duplicate remote file name');
    if (!types.has(file.type) || typeof file.source !== 'string')
      throw new Error('Invalid script file type or source');
    names.add(file.name);
    return { name: file.name, type: file.type, source: file.source };
  }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

export function fingerprint(files) {
  return digest(JSON.stringify(canonicalFiles(files)));
}

export function targetFor(config, registry, name) {
  const target = config?.targets?.[name];
  const resource = registry?.scriptProjects?.[name];
  if (!target || !resource || target.scriptId !== resource.id)
    throw new Error('Unknown target or script ID disagrees with resource registry');
  if (!Array.isArray(target.files) || !target.files.length) throw new Error('No mapped source files');
  const names = new Set();
  for (const file of target.files) {
    if (!file || typeof file.name !== 'string' || names.has(file.name) || !file.name || file.name === 'appsscript')
      throw new Error('Invalid, duplicate, or manifest replacement mapping');
    if (file.type !== 'SERVER_JS' || typeof file.path !== 'string' ||
        !/^(integrations|apps-script)\/[A-Za-z0-9_.\/-]+$/.test(file.path) ||
        file.path.split('/').includes('..')) throw new Error('Source path or type not allowed');
    names.add(file.name);
  }
  if (!Array.isArray(target.expectedExistingFiles) || !target.expectedExistingFiles.length)
    throw new Error('Expected live inventory is required');
  return target;
}

export async function localFiles(target, readSource) {
  const files = [];
  for (const file of target.files) files.push({ name: file.name, type: file.type, source: await readSource(file.path) });
  return canonicalFiles(files);
}

export function buildBundle(target, live, replacements) {
  const current = canonicalFiles(live);
  const manifest = current.find(f => f.name === 'appsscript' && f.type === 'JSON');
  if (!manifest) throw new Error('Live project manifest is missing');
  try { JSON.parse(manifest.source); } catch { throw new Error('Live manifest is invalid JSON'); }
  for (const name of target.expectedExistingFiles) {
    if (!current.some(f => f.name === name)) throw new Error('Live project is missing an expected file: ' + name);
  }
  const merged = new Map(current.map(file => [file.name, file]));
  const changes = [];
  for (const file of canonicalFiles(replacements)) {
    const mapping = target.files.find(f => f.name === file.name && f.type === file.type);
    if (!mapping || file.name === 'appsscript') throw new Error('Replacement is outside approved file map');
    const before = merged.get(file.name);
    if (before && before.type !== file.type) throw new Error('Mapped file type differs from live file');
    if (!before || before.source !== file.source) changes.push({ name: file.name, operation: before ? 'replace' : 'add', sha256: digest(file.source) });
    merged.set(file.name, file);
  }
  const files = canonicalFiles([...merged.values()]);
  return { files, changes, liveSha256: fingerprint(current), bundleSha256: fingerprint(files) };
}

export function assertApplyAllowed(config, target, approvedBundleSha256) {
  if (config.allowApply !== true || target.enabled !== true || target.reconciliationComplete !== true)
    throw new Error('Live publication is disabled or reconciliation is incomplete');
  if ((target.blockers || []).length) throw new Error('Target has unresolved release blockers');
  if (!/^[a-f0-9]{64}$/.test(target.baselineSha256 || '')) throw new Error('Verified live baseline is missing');
  if (!/^[a-f0-9]{64}$/.test(approvedBundleSha256 || '')) throw new Error('Exact approved bundle fingerprint is required');
}

export async function runRelease({ mode = 'plan', targetName, config, registry, readSource, client, approvedBundleSha256 }) {
  if (!['plan', 'inspect', 'apply'].includes(mode)) throw new Error('Unknown release mode');
  const target = targetFor(config, registry, targetName);
  if (mode === 'apply') assertApplyAllowed(config, target, approvedBundleSha256);
  const replacements = await localFiles(target, readSource);
  const report = {
    mode, target: targetName, scriptId: target.scriptId,
    networkUsed: false, liveCodeChanged: false, runtimeFunctionsExecuted: false,
    localSourceSha256: fingerprint(replacements),
    publicationEnabled: config.allowApply === true && target.enabled === true,
    reconciliationComplete: target.reconciliationComplete === true,
    blockers: target.blockers || [],
    mappedFiles: replacements.map(f => ({ name: f.name, type: f.type, sha256: digest(f.source) }))
  };
  if (mode === 'plan') return { ...report, result: 'Offline plan only; no Google authentication attempted' };
  if (!client) throw new Error('User-configured deployment access is required');
  const live = await client.getContent(target.scriptId);
  const plan = buildBundle(target, live.files, replacements);
  Object.assign(report, { networkUsed: true, liveSha256: plan.liveSha256, bundleSha256: plan.bundleSha256, changes: plan.changes });
  if (mode === 'inspect') return { ...report, result: 'Read-only inspection; no publication' };
  if (plan.liveSha256 !== target.baselineSha256) throw new Error('Live source drifted from verified baseline; refusing publication');
  if (plan.bundleSha256 !== approvedBundleSha256) throw new Error('Bundle differs from the exact approved fingerprint');
  if (!plan.changes.length) return { ...report, result: 'No changes; no write made' };

  // The API has no atomic compare-and-swap. Freeze manual editing during release.
  // This last read reduces, but cannot eliminate, a race with another editor.
  const lastRead = await client.getContent(target.scriptId);
  if (fingerprint(lastRead.files) !== plan.liveSha256) throw new Error('Live source changed during preflight; refusing publication');
  const prior = await client.createVersion(target.scriptId, 'Before approved Tap In release');
  report.priorVersionNumber = prior.versionNumber;
  await client.updateContent(target.scriptId, plan.files);
  report.liveCodeChanged = true;
  const saved = await client.getContent(target.scriptId);
  if (fingerprint(saved.files) !== plan.bundleSha256)
    throw new Error('Published source readback differs; stop and inspect Project History. Do not auto-retry or auto-rollback. Prior version: ' + prior.versionNumber);
  return { ...report, result: 'Code published and read back; runtime and AppSheet behavior still require separate verification' };
}
