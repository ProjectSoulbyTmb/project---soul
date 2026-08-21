import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { httpsUrl } from '../server/worker.js';

test('server accepts only HTTPS public configuration', async () => {
  const env = { WEBSITE_URL: 'https://example.test/', STRIPE_PAYMENT_URL: 'http://unsafe.test', PAYPAL_PAYMENT_URL: 'https://paypal.test/buy' };
  const res = await worker.fetch(new Request('https://api.example.test/v1/config'), env);
  const body = await res.json();
  assert.equal(res.status, 200); assert.equal(body.store.stripe, ''); assert.equal(body.store.paypal, 'https://paypal.test/buy');
  assert.equal(httpsUrl('javascript:alert(1)'), '');
});

test('server fails closed for writes and unknown paths', async () => {
  assert.equal((await worker.fetch(new Request('https://api.test/health', { method: 'POST' }), {})).status, 405);
  assert.equal((await worker.fetch(new Request('https://api.test/private'), {})).status, 404);
});

test('server health is stateless and sends hardened headers', async () => {
  const res = await worker.fetch(new Request('https://api.test/health'));
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.checkoutEnabled, false);
  assert.equal(body.conversationsStored, false);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.match(res.headers.get('strict-transport-security'), /max-age=/);
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
});

test('server config advertises 18+ source-available Windows alpha with payments off', async () => {
  const res = await worker.fetch(new Request('https://api.example.test/v1/config'), {});
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.paymentsEnabled, false);
  assert.equal(body.checkoutEnabled, false);
  assert.equal(body.localFirst, true);
  assert.equal(body.conversations, false);
  assert.equal(body.conversationsStored, false);
  assert.equal(body.ageRestricted, true);
  assert.equal(body.minimumAge, 18);
  assert.equal(body.authenticodeSigned, false);
  assert.equal(body.openSource, false);
  assert.equal(body.premium, 'local-admin-testing-only');
  assert.deepEqual(body.officialPlatforms, ['windows-10-11-x64']);
  assert.equal(body.store.stripe, '');
  assert.equal(body.store.paypal, '');
  assert.equal(body.store.gumroad, '');
  assert.match(body.terms, /18 or older/);
});
