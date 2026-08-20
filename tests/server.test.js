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
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.match(res.headers.get('strict-transport-security'), /max-age=/);
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
});
