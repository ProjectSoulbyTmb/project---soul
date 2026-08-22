import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {
  httpsUrl,
  LIVE_INSTALLER_VERSION,
  LIVE_INSTALLER,
  LIVE_INSTALLER_SHA256,
} from '../server/worker.js';
import { ASSIST_VERSION } from '../docs/knowledge.js';

test('server accepts only HTTPS public configuration', async () => {
  const env = {
    WEBSITE_URL: 'https://example.test/',
    STRIPE_PAYMENT_URL: 'http://unsafe.test',
    PAYPAL_PAYMENT_URL: 'https://paypal.test/buy',
  };
  const res = await worker.fetch(new Request('https://api.example.test/v1/config'), env);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.store.stripe, '');
  assert.equal(body.store.paypal, 'https://paypal.test/buy');
  assert.equal(httpsUrl('javascript:alert(1)'), '');
});

test('server fails closed for writes and unknown paths', async () => {
  assert.equal(
    (await worker.fetch(new Request('https://api.test/health', { method: 'POST' }), {})).status,
    405
  );
  assert.equal((await worker.fetch(new Request('https://api.test/private'), {})).status, 404);
});

test('Worker health/status support HEAD, CORS, honesty flags, and private status cache', async () => {
  const healthHead = await worker.fetch(
    new Request('https://api.example.test/health', { method: 'HEAD' }),
    {}
  );
  assert.equal(healthHead.status, 200);
  assert.equal(await healthHead.text(), '');
  assert.match(healthHead.headers.get('access-control-allow-origin'), /\*/);
  assert.match(healthHead.headers.get('access-control-allow-methods'), /HEAD/);

  const preflight = await worker.fetch(
    new Request('https://api.example.test/v1/status', {
      method: 'OPTIONS',
      headers: { origin: 'https://eidovara.org', 'access-control-request-method': 'GET' },
    }),
    {}
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  assert.match(preflight.headers.get('access-control-allow-methods'), /GET/);
  assert.match(preflight.headers.get('access-control-allow-methods'), /HEAD/);
  assert.match(preflight.headers.get('access-control-allow-headers'), /accept/i);

  const statusRes = await worker.fetch(new Request('https://api.example.test/v1/status'), {});
  const status = await statusRes.json();
  assert.equal(statusRes.status, 200);
  assert.match(statusRes.headers.get('cache-control'), /private/);
  assert.match(statusRes.headers.get('cache-control'), /no-store/);
  assert.equal(status.status, 'ok');
  assert.equal(status.online, true);
  assert.equal(status.paymentsEnabled, false);
  assert.equal(status.checkoutEnabled, false);
  assert.equal(status.conversationsStored, false);
  assert.equal(status.ageRestricted, true);
  assert.equal(status.minimumAge, 18);
  assert.equal(status.authenticodeSigned, false);
  assert.equal(status.version, ASSIST_VERSION);
  assert.equal(status.liveInstallerVersion, LIVE_INSTALLER_VERSION);
  assert.ok(!status.endpoints.includes('/v1/heartbeat'));
  assert.match(status.heartbeat, /Desktop Connect uses GET \/health/);
  // The live installer must be advertised with its exact filename and checksum.
  assert.match(JSON.stringify(status), new RegExp(LIVE_INSTALLER.replaceAll('.', '\\.')));
  assert.match(JSON.stringify(status), new RegExp(LIVE_INSTALLER_SHA256));
  assert.doesNotMatch(JSON.stringify(status), /workers\.dev/i);

  const statusHead = await worker.fetch(
    new Request('https://api.example.test/v1/status', { method: 'HEAD' }),
    {}
  );
  assert.equal(statusHead.status, 200);
  assert.equal(await statusHead.text(), '');
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

test('worker installer facts accept measured deploy-time overrides and reject malformed values', async () => {
  const sha = 'A'.repeat(64);
  const good = await (
    await worker.fetch(new Request('https://api.test/v1/status'), {
      LIVE_INSTALLER_SHA256: sha,
      LIVE_INSTALLER_SIZE: '12345678',
    })
  ).json();
  assert.equal(good.liveInstallerSha256, sha.toLowerCase());
  assert.equal(good.liveInstallerSize, 12345678);
  const bad = await (
    await worker.fetch(new Request('https://api.test/v1/status'), {
      LIVE_INSTALLER_SHA256: '../../etc/passwd',
      LIVE_INSTALLER_SIZE: '-5',
    })
  ).json();
  assert.equal(bad.liveInstallerSha256, null);
  assert.equal(bad.liveInstallerSize, null);
  const config = await (
    await worker.fetch(new Request('https://api.test/v1/config'), { LIVE_INSTALLER_SHA256: sha })
  ).json();
  assert.equal(config.liveInstallerSha256, sha.toLowerCase());
});

test('/v1/assist is rate limited per client address', async () => {
  const ip = '203.0.113.77';
  let last = null;
  for (let i = 0; i < 40; i += 1) {
    last = await worker.fetch(
      new Request(`https://api.test/v1/assist?q=launch-plan-${i}`, {
        headers: { 'cf-connecting-ip': ip },
      }),
      {}
    );
    if (last.status === 429) break;
  }
  assert.ok(last, 'expected at least one assist response');
  assert.equal(last.status, 429, 'expected /v1/assist to return 429 after the per-IP limit');
  assert.equal(last.headers.get('retry-after'), '60');
  const body = await last.json();
  assert.equal(body.error, 'rate_limited');
  assert.match(body.reply, /Too many requests/);
});

test('assist POST blocks disallowed browser origins but permits origin-less clients', async () => {
  const url = 'https://api.example.test/v1/assist';
  const evil = await worker.fetch(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ query: 'download' }),
    }),
    {}
  );
  assert.equal(evil.status, 403);
  assert.equal((await evil.json()).error, 'origin_not_allowed');

  // curl / desktop / CI: no Origin header at all -> allowed (rate limiter still applies)
  const noOrigin = await worker.fetch(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'download' }),
    }),
    {}
  );
  assert.notEqual(noOrigin.status, 403);

  // official site origin is allowed
  const good = await worker.fetch(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://eidovara.org' },
      body: JSON.stringify({ query: 'download' }),
    }),
    {}
  );
  assert.notEqual(good.status, 403);
});
