import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeServiceUrl,
  serviceRequestUrl,
  fetchServiceSnapshot,
  sanitizeRemoteConfig,
  checkoutEnabledFromRemoteConfig,
  SERVICE_HEALTH_PATH,
  SERVICE_CONFIG_PATH,
  SERVICE_STATUS_PATH,
  SERVICE_ASSIST_PATH
} from '../src/core/service.js';
import worker from '../server/worker.js';

const read = file => fs.readFileSync(file, 'utf8');

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  const body = Buffer.from(JSON.stringify(payload));
  return {
    ok,
    status,
    headers: { get: name => name.toLowerCase() === 'content-length' ? String(body.length) : null },
    arrayBuffer: async () => body
  };
}

test('service URL requires HTTPS except loopback and strips health/config/status paths', () => {
  assert.equal(normalizeServiceUrl(''), '');
  assert.equal(normalizeServiceUrl('https://eidovara-api.example.workers.dev/'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('https://eidovara-api.example.workers.dev/health'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('https://eidovara-api.example.workers.dev/v1/config/'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('https://eidovara-api.example.workers.dev/v1/status'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('https://eidovara-api.example.workers.dev/v1/assist'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('eidovara-api.example.workers.dev'), 'https://eidovara-api.example.workers.dev');
  assert.equal(normalizeServiceUrl('http://127.0.0.1:8787/health'), 'http://127.0.0.1:8787');
  assert.equal(normalizeServiceUrl('http://localhost:8787/v1/config'), 'http://localhost:8787');
  assert.equal(normalizeServiceUrl('http://[::1]:8787/v1/status'), 'http://[::1]:8787');
  assert.throws(() => normalizeServiceUrl('http://api.example.test'), /HTTPS/);
  assert.throws(() => normalizeServiceUrl('https://user:pass@api.example.test'), /credentials/);
  assert.throws(() => normalizeServiceUrl('javascript:alert(1)'), /HTTPS|http\(s\)/i);
});

test('service request URLs do not double-append official paths', () => {
  assert.equal(serviceRequestUrl('https://api.example.test/health', SERVICE_HEALTH_PATH), 'https://api.example.test/health');
  assert.equal(serviceRequestUrl('https://api.example.test/v1/config', SERVICE_CONFIG_PATH), 'https://api.example.test/v1/config');
  assert.equal(serviceRequestUrl('https://api.example.test/v1/status', SERVICE_STATUS_PATH), 'https://api.example.test/v1/status');
  assert.equal(serviceRequestUrl('https://api.example.test', SERVICE_HEALTH_PATH), 'https://api.example.test/health');
  assert.equal(serviceRequestUrl('https://api.example.test/v1/assist', SERVICE_ASSIST_PATH), 'https://api.example.test/v1/assist');
  assert.doesNotMatch(read('src/core/service.js'), /serviceRequestUrl\([^)]*SERVICE_ASSIST_PATH/);
  assert.doesNotMatch(read('src/electron/main.js'), /\/v1\/assist/);
});

test('remote config is fail-closed for checkout even if a future payload lied', () => {
  const sanitized = sanitizeRemoteConfig({
    paymentsEnabled: true,
    website: 'https://projectsoulbytmb.github.io/project---soul/',
    store: { stripe: 'https://pay.example/buy' },
    authenticodeSigned: true,
    minimumAge: 1
  });
  assert.equal(sanitized.paymentsEnabled, false);
  assert.equal(sanitized.checkoutEnabled, false);
  assert.equal(sanitized.authenticodeSigned, false);
  assert.equal(sanitized.minimumAge, 18);
  assert.equal(sanitized.website, 'https://projectsoulbytmb.github.io/project---soul/');
  assert.equal(checkoutEnabledFromRemoteConfig({ paymentsEnabled: true }), false);
});

test('fetch failure leaves the workspace offline-OK and never enables payments', async () => {
  const seen = [];
  const snapshot = await fetchServiceSnapshot({
    base: 'https://eidovara-api.example.workers.dev',
    fetchImpl: async url => {
      seen.push(url);
      throw new Error('network down');
    }
  });
  assert.equal(snapshot.configured, true);
  assert.equal(snapshot.online, false);
  assert.equal(snapshot.paymentsEnabled, false);
  assert.equal(snapshot.checkoutEnabled, false);
  assert.equal(snapshot.localFirst, true);
  assert.match(snapshot.error, /network down|unreachable|Offline Soul/i);
  assert.deepEqual(seen.sort(), [
    'https://eidovara-api.example.workers.dev/health',
    'https://eidovara-api.example.workers.dev/v1/config',
    'https://eidovara-api.example.workers.dev/v1/status'
  ].sort());
});

test('healthy service snapshot exposes site URL and keeps payments off', async () => {
  const snapshot = await fetchServiceSnapshot({
    base: 'https://eidovara-api.example.workers.dev/health',
    fetchImpl: async url => {
      if (url.endsWith('/health')) return jsonResponse({ service: 'Eidovara', status: 'ok', version: '0.18.0' });
      if (url.endsWith('/v1/config')) return jsonResponse({
        version: '0.18.0',
        website: 'https://projectsoulbytmb.github.io/project---soul/',
        paymentsEnabled: true,
        store: { stripe: 'https://pay.example/buy' }
      });
      if (url.endsWith('/v1/status')) return jsonResponse({ service: 'Eidovara', status: 'ok', paymentsEnabled: true, conversations: false });
      throw new Error(`unexpected ${url}`);
    }
  });
  assert.equal(snapshot.online, true);
  assert.equal(snapshot.service, 'Eidovara');
  assert.equal(snapshot.version, '0.18.0');
  assert.equal(snapshot.website, 'https://projectsoulbytmb.github.io/project---soul/');
  assert.equal(snapshot.paymentsEnabled, false);
  assert.equal(snapshot.checkoutEnabled, false);
  assert.equal(snapshot.conversationsStored, false);
});

test('unconfigured service stays local without fetching', async () => {
  let called = 0;
  const snapshot = await fetchServiceSnapshot({ base: '', fetchImpl: async () => { called += 1; throw new Error('should not fetch'); } });
  assert.equal(snapshot.configured, false);
  assert.equal(snapshot.online, false);
  assert.equal(snapshot.paymentsEnabled, false);
  assert.equal(called, 0);
});

test('Worker health/config/status JSON matches desktop sanitizeRemoteConfig and snapshot', async () => {
  const fetchImpl = async (url, init = {}) => worker.fetch(new Request(url, init), {});
  const snapshot = await fetchServiceSnapshot({ base: 'https://api.example.test/v1/assist', fetchImpl });
  assert.equal(snapshot.online, true);
  assert.equal(snapshot.configured, true);
  assert.equal(snapshot.service, 'Eidovara');
  assert.equal(snapshot.version, '0.18.0');
  assert.equal(snapshot.paymentsEnabled, false);
  assert.equal(snapshot.checkoutEnabled, false);
  assert.equal(snapshot.localFirst, true);
  assert.equal(snapshot.conversationsStored, false);
  assert.equal(snapshot.minimumAge, 18);
  assert.equal(snapshot.ageRestricted, true);

  const configRes = await worker.fetch(new Request('https://api.example.test/v1/config'), {});
  const config = sanitizeRemoteConfig(await configRes.json());
  assert.equal(config.paymentsEnabled, false);
  assert.equal(config.checkoutEnabled, false);
  assert.equal(config.authenticodeSigned, false);
  assert.equal(config.minimumAge, 18);
  assert.equal(config.ageRestricted, true);
  assert.equal(config.localFirst, true);
  assert.equal(config.conversationsStored, false);
  assert.deepEqual(config.officialPlatforms, ['windows-10-11-x64']);

  const assist = await worker.fetch(new Request('https://api.example.test/v1/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'Is Eidovara 18+?', mode: 'help' })
  }), {});
  const assistBody = await assist.json();
  assert.equal(assist.status, 200);
  assert.equal(typeof assistBody.reply, 'string');
  assert.match(assistBody.reply, /18/);
  assert.equal(assistBody.paymentsEnabled, false);
  assert.equal(assistBody.transcripts, false);
  assert.equal(assistBody.soul, false);
});

test('Worker status endpoint is public GET and fail-closed', async () => {
  const res = await worker.fetch(new Request('https://api.example.test/v1/status'), {});
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.paymentsEnabled, false);
  assert.equal(body.conversations, false);
  assert.equal(body.localFirst, true);
  assert.ok(body.endpoints.includes('/health'));
  assert.ok(body.endpoints.includes('/v1/config'));
  assert.ok(body.endpoints.includes('/v1/status'));
  assert.ok(body.endpoints.includes('/v1/assist'));
  assert.equal((await worker.fetch(new Request('https://api.example.test/v1/status', { method: 'POST' }), {})).status, 405);
});

test('desktop binds through a persisted service setting, not a baked-in workers.dev URL', () => {
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  const html = read('src/renderer/index.html');
  const preload = read('src/electron/preload.cjs');
  assert.match(main, /fetchServiceSnapshot/);
  assert.match(main, /normalizeServiceUrl/);
  assert.match(main, /requireAgeGate\(\)/);
  assert.match(main, /soul:connectService/);
  assert.match(preload, /connectService:/);
  assert.match(html, /id="serviceUrlInput"/);
  assert.match(html, /id="serviceConnectBtn"/);
  assert.match(html, /id="serviceLabel"/);
  assert.match(html, /paymentsEnabled/);
  assert.match(renderer, /refreshServiceStatus/);
  assert.match(renderer, /connectService/);
  assert.doesNotMatch(main, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(renderer, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(html, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(read('src/core/service.js'), /dreambot333\.workers\.dev/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(html, /media-src https: eidovara-media:/);
});
