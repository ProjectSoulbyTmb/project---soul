import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker, { httpsUrl } from '../server/worker.js';

const read = file => fs.readFileSync(file, 'utf8');
const fetchWorker = (url, init, env) => worker.fetch(new Request(url, init), env);

test('server accepts only HTTPS public configuration', async () => {
  const env = { WEBSITE_URL: 'https://example.test/', STRIPE_PAYMENT_URL: 'http://unsafe.test', PAYPAL_PAYMENT_URL: 'https://paypal.test/buy' };
  const res = await fetchWorker('https://api.example.test/v1/config', undefined, env);
  const body = await res.json();
  assert.equal(res.status, 200); assert.equal(body.store.stripe, ''); assert.equal(body.store.paypal, 'https://paypal.test/buy');
  assert.equal(httpsUrl('javascript:alert(1)'), '');
});

test('committed Worker vars keep the GitHub Pages site and empty payment URLs', async () => {
  const toml = read('server/wrangler.toml');
  assert.match(toml, /^name = "eidovara-api"$/m);
  assert.match(toml, /^main = "worker.js"$/m);
  assert.match(toml, /^WEBSITE_URL = "https:\/\/projectsoulbytmb\.github\.io\/project---soul\/"$/m);
  assert.match(toml, /^STRIPE_PAYMENT_URL = ""$/m);
  assert.match(toml, /^PAYPAL_PAYMENT_URL = ""$/m);
  assert.match(toml, /^GUMROAD_PRODUCT_URL = ""$/m);
  assert.doesNotMatch(toml, /\baccount_id\b/);
  const env = {
    WEBSITE_URL: 'https://projectsoulbytmb.github.io/project---soul/',
    STRIPE_PAYMENT_URL: '',
    PAYPAL_PAYMENT_URL: '',
    GUMROAD_PRODUCT_URL: ''
  };
  const res = await fetchWorker('https://eidovara-api.example.workers.dev/v1/config/', undefined, env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.website, env.WEBSITE_URL);
  assert.equal(body.store.stripe, '');
  assert.equal(body.store.paypal, '');
  assert.equal(body.store.gumroad, '');
  assert.match(body.privacy, /No payment-card data/);
});

test('server fails closed for writes and unknown paths', async () => {
  assert.equal((await fetchWorker('https://api.test/health', { method: 'POST' }, {})).status, 405);
  assert.equal((await fetchWorker('https://api.test/health', { method: 'PUT' }, {})).status, 405);
  assert.equal((await fetchWorker('https://api.test/health', { method: 'DELETE' }, {})).status, 405);
  assert.equal((await fetchWorker('https://api.test/health', { method: 'HEAD' }, {})).status, 405);
  assert.equal((await fetchWorker('https://api.test/private', undefined, {})).status, 404);
  const options = await fetchWorker('https://api.test/health', { method: 'OPTIONS' }, {});
  assert.equal(options.status, 204);
  assert.match(options.headers.get('allow'), /GET/);
});

test('server health is stateless and sends hardened headers', async () => {
  const res = await fetchWorker('https://api.test/health/');
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'Eidovara');
  assert.equal(body.version, '0.18.0');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('strict-transport-security'), /max-age=/);
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('desktop admin keeps a user-configured Worker URL and does not ship an account host', () => {
  const html = read('src/renderer/index.html');
  const main = read('src/electron/main.js');
  assert.match(html, /Cloudflare Worker HTTPS base URL/);
  assert.match(html, /eidovara-api\.example\.workers\.dev/);
  assert.doesNotMatch(html, /https:\/\/eidovara-api\.(?!example\.)[\w-]+\.workers\.dev/);
  assert.doesNotMatch(main, /workers\.dev/);
  assert.match(main, /checkService[\s\S]*\$\{base\}\/health/);
});
