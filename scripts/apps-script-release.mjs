import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRelease, targetFor, assertApplyAllowed } from './release-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const allowed = new Set(['--mode', '--target', '--approved-bundle-sha256']);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!allowed.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i]])
    throw new Error('Invalid or repeated release argument');
  options[args[i]] = args[i + 1];
}
const mode = options['--mode'] || 'plan';
const targetName = options['--target'] || 'appsheet-intake';
const approvedBundleSha256 = options['--approved-bundle-sha256'];
const config = JSON.parse(await readFile(resolve(root, 'config/deployment-targets.json'), 'utf8'));
const registry = JSON.parse(await readFile(resolve(root, 'config/project-registry.json'), 'utf8'));

function googleClient() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!id || !secret || !refresh) throw new Error('User setup incomplete: deployment credentials are not configured');
  let tokenPromise;
  async function token() {
    tokenPromise ||= (async () => {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' })
      });
      if (!response.ok) throw new Error('Google credential refresh failed; user reauthorization required (HTTP ' + response.status + ')');
      const data = await response.json();
      const scopes = new Set(String(data.scope || '').split(' ').filter(Boolean));
      if (!data.access_token || !scopes.has('https://www.googleapis.com/auth/script.projects'))
        throw new Error('Deployment token does not confirm the required Apps Script project scope');
      if ([...scopes].some(s => /mail\.google\.com|gmail/i.test(s)))
        throw new Error('Deployment credential includes Gmail access; use a separate code-only credential');
      return data.access_token;
    })();
    return tokenPromise;
  }
  async function request(scriptId, suffix, method = 'GET', body) {
    const response = await fetch('https://script.googleapis.com/v1/projects/' + encodeURIComponent(scriptId) + suffix, {
      method, headers: { authorization: 'Bearer ' + await token(), 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new Error('Apps Script API request failed (HTTP ' + response.status + '); no raw response logged');
    return response.json();
  }
  return {
    getContent: id => request(id, '/content'),
    createVersion: (id, description) => request(id, '/versions', 'POST', { description }),
    updateContent: (id, files) => request(id, '/content', 'PUT', { files })
  };
}

try {
  const target = targetFor(config, registry, targetName);
  if (mode === 'apply') assertApplyAllowed(config, target, approvedBundleSha256);
  const report = await runRelease({ mode, targetName, config, registry, approvedBundleSha256,
    readSource: path => readFile(resolve(root, path), 'utf8'),
    client: mode === 'plan' ? undefined : googleClient() });
  await writeFile(resolve(root, 'release-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // Never print OAuth responses, source contents, or credentials.
  console.error('Release stopped: ' + error.message);
  process.exitCode = 1;
}
