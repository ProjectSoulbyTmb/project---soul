import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import worker from '../server/worker.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = message => {
  console.error(message);
  process.exit(1);
};

const tomlPath = path.join(root, 'server', 'wrangler.toml');
const workerPath = path.join(root, 'server', 'worker.js');
const toml = fs.readFileSync(tomlPath, 'utf8');
const workerSource = fs.readFileSync(workerPath, 'utf8');
const values = {};
for (const line of toml.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue;
  const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*"(.*)"\s*$/);
  if (match) values[match[1]] = match[2];
}

if (values.name !== 'eidovara-api') fail(`wrangler.toml name must be eidovara-api, found ${values.name}`);
if (values.main !== 'worker.js') fail(`wrangler.toml main must be worker.js, found ${values.main}`);
if (!values.compatibility_date) fail('wrangler.toml is missing compatibility_date');
if (values.WEBSITE_URL !== 'https://projectsoulbytmb.github.io/project---soul/') {
  fail(`WEBSITE_URL must be the official GitHub Pages HTTPS origin, found ${values.WEBSITE_URL}`);
}
for (const key of ['STRIPE_PAYMENT_URL', 'PAYPAL_PAYMENT_URL', 'GUMROAD_PRODUCT_URL']) {
  const value = values[key] ?? '';
  if (value && !value.startsWith('https://')) fail(`${key} must be empty or HTTPS`);
}
if (/\baccount_id\b/.test(toml)) fail('Do not commit a Cloudflare account_id; deploy with the owner login or CLOUDFLARE_API_TOKEN.');
if (/(api[_-]?token|api[_-]?key|secret|private[_-]?key)\s*=/i.test(toml) || /(api[_-]?token|CLOUDFLARE_API_TOKEN|sk_live|sk_test)/i.test(workerSource)) {
  fail('Worker config must not contain API tokens or payment secrets.');
}

const env = {
  WEBSITE_URL: values.WEBSITE_URL,
  STRIPE_PAYMENT_URL: values.STRIPE_PAYMENT_URL || '',
  PAYPAL_PAYMENT_URL: values.PAYPAL_PAYMENT_URL || '',
  GUMROAD_PRODUCT_URL: values.GUMROAD_PRODUCT_URL || ''
};
const health = await worker.fetch(new Request('https://eidovara-api.example.workers.dev/health'), env);
const healthBody = await health.json();
if (health.status !== 200 || healthBody.status !== 'ok' || healthBody.service !== 'Eidovara') fail('GET /health failed closed local check');
const configRes = await worker.fetch(new Request('https://eidovara-api.example.workers.dev/v1/config'), env);
const configBody = await configRes.json();
if (configRes.status !== 200 || configBody.website !== env.WEBSITE_URL) fail('GET /v1/config did not return the official HTTPS website');
if (configBody.store.stripe || configBody.store.paypal || configBody.store.gumroad) fail('Payment URL vars must stay empty until a provider-hosted HTTPS checkout exists');
if ((await worker.fetch(new Request('https://eidovara-api.example.workers.dev/health', { method: 'POST' }), env)).status !== 405) fail('POST /health must fail closed');
if ((await worker.fetch(new Request('https://eidovara-api.example.workers.dev/v1/unknown'), env)).status !== 404) fail('Unknown paths must fail closed');
console.log('Cloudflare Worker config and local fetch checks OK');

const wantWrangler = process.argv.includes('--wrangler') || process.env.EIDOVARA_WRANGLER_DRY_RUN === '1';
if (!wantWrangler) process.exit(0);

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eidovara-wrangler-dry-'));
const result = spawnSync('npx', ['--yes', 'wrangler', 'deploy', '--dry-run', '--outdir', outDir], {
  cwd: path.join(root, 'server'),
  encoding: 'utf8',
  timeout: 180000
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.status !== 0) fail('wrangler deploy --dry-run failed');
console.log('wrangler deploy --dry-run OK');
