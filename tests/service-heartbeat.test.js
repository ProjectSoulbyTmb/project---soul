// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createServiceHeartbeat,
  fetchServiceLiveness,
  fetchServiceSnapshot,
  nextServiceHeartbeatDelay,
  shouldRunServiceHeartbeat,
  servicePresenceLabel,
  SERVICE_PRESENCE_ONLINE,
  SERVICE_PRESENCE_RECONNECTING,
  SERVICE_PRESENCE_OFFLINE,
  SERVICE_HEARTBEAT_INTERVAL_MS,
  SERVICE_HEARTBEAT_BACKOFF_MIN_MS,
  SERVICE_HEARTBEAT_BACKOFF_MAX_MS,
  SERVICE_ASSIST_PATH,
  SERVICE_CONFIG_PATH,
  DEFAULT_EIDOVARA_SERVICE_BASE
} from '../src/core/service.js';
import { officialSearchHandoffs } from '../src/core/entertainment.js';
import { FUTURE_VOICE_BACKEND } from '../src/core/voices.js';
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

test('presence labels stay honest Online / Reconnecting / Offline', () => {
  assert.equal(servicePresenceLabel({}), SERVICE_PRESENCE_OFFLINE);
  assert.equal(servicePresenceLabel({ ageGateAccepted: true, configured: false }), SERVICE_PRESENCE_OFFLINE);
  assert.equal(servicePresenceLabel({ ageGateAccepted: true, configured: true, online: true }), SERVICE_PRESENCE_ONLINE);
  assert.equal(servicePresenceLabel({
    ageGateAccepted: true,
    configured: true,
    online: false,
    reconnecting: true
  }), SERVICE_PRESENCE_RECONNECTING);
  assert.equal(servicePresenceLabel({
    ageGateAccepted: true,
    configured: true,
    online: false,
    reconnecting: false
  }), SERVICE_PRESENCE_OFFLINE);
  assert.notEqual(SERVICE_PRESENCE_ONLINE, 'always online');
});

test('heartbeat delay uses interval plus jitter online and exponential backoff offline', () => {
  assert.equal(nextServiceHeartbeatDelay({ online: true, random: () => 0 }), SERVICE_HEARTBEAT_INTERVAL_MS);
  assert.equal(nextServiceHeartbeatDelay({ online: false, failureCount: 0, random: () => 0 }), SERVICE_HEARTBEAT_BACKOFF_MIN_MS);
  assert.equal(nextServiceHeartbeatDelay({ online: false, failureCount: 1, random: () => 0 }), 8_000);
  assert.equal(nextServiceHeartbeatDelay({ online: false, failureCount: 2, random: () => 0 }), 16_000);
  assert.equal(nextServiceHeartbeatDelay({ online: false, failureCount: 3, random: () => 0 }), 32_000);
  assert.equal(nextServiceHeartbeatDelay({ online: false, failureCount: 8, random: () => 0 }), SERVICE_HEARTBEAT_BACKOFF_MAX_MS);
  const jittered = nextServiceHeartbeatDelay({ online: true, random: () => 1 });
  assert.ok(jittered > SERVICE_HEARTBEAT_INTERVAL_MS);
  assert.ok(jittered <= SERVICE_HEARTBEAT_INTERVAL_MS + 5_000);
});

test('heartbeat does not run before 18+ or without a valid URL', () => {
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: false, base: DEFAULT_EIDOVARA_SERVICE_BASE }), false);
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: true, base: '' }), false);
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: true, base: '   ' }), false);
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: true, base: 'http://evil.example' }), false);
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: true, base: DEFAULT_EIDOVARA_SERVICE_BASE }), true);
  assert.equal(shouldRunServiceHeartbeat({ ageGateAccepted: true, base: 'http://127.0.0.1:8787' }), true);
});

test('liveness fetch uses only health and status GET JSON, never conversations or assist', async () => {
  const seen = [];
  const snapshot = await fetchServiceLiveness({
    base: DEFAULT_EIDOVARA_SERVICE_BASE,
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, method: init.method, body: init.body, headers: init.headers });
      if (String(url).endsWith('/health') || String(url).endsWith('/v1/health')) {
        return jsonResponse({ service: 'Eidovara', status: 'ok', version: '0.19.1', online: true });
      }
      if (String(url).endsWith('/v1/status')) {
        return jsonResponse({
          service: 'Eidovara',
          status: 'ok',
          version: '0.19.1',
          paymentsEnabled: true,
          checkoutEnabled: true,
          conversations: true,
          conversationsStored: true
        });
      }
      throw new Error(`unexpected ${url}`);
    }
  });
  assert.equal(snapshot.online, true);
  assert.equal(snapshot.presence, SERVICE_PRESENCE_ONLINE);
  assert.equal(snapshot.paymentsEnabled, false);
  assert.equal(snapshot.checkoutEnabled, false);
  assert.equal(snapshot.conversationsStored, false);
  assert.equal(snapshot.conversationsSent, false);
  assert.equal(snapshot.version, '0.19.1');
  assert.ok(seen.length >= 2);
  for (const item of seen) {
    assert.equal(item.method, 'GET');
    assert.equal(item.body, undefined);
    assert.equal(String(item.url).includes(SERVICE_ASSIST_PATH), false);
    assert.equal(String(urlPath(item.url)).includes(SERVICE_CONFIG_PATH), false);
    assert.doesNotMatch(String(item.url), /conversation|memory|adult/i);
  }
});

function urlPath(value) {
  try { return new URL(value).pathname; } catch { return String(value); }
}

test('heartbeat starts after 18+ with a URL, stops without URL, and does not fetch before 18+', async () => {
  const calls = [];
  const delays = [];
  const statuses = [];
  let queued = [];
  const hb = createServiceHeartbeat({
    getContext: () => ({ ageGateAccepted: false, base: DEFAULT_EIDOVARA_SERVICE_BASE }),
    probe: async ({ base }) => {
      calls.push(base);
      return { configured: true, online: true };
    },
    onStatus: snap => statuses.push(snap.presence),
    random: () => 0,
    schedule: (fn, ms) => {
      delays.push(ms);
      queued.push(fn);
      return queued.length;
    },
    unschedule: () => { queued = []; }
  });
  await hb.start();
  assert.equal(calls.length, 0);
  assert.equal(statuses.at(-1), SERVICE_PRESENCE_OFFLINE);
  assert.equal(hb.isRunning(), false);

  let context = { ageGateAccepted: true, base: DEFAULT_EIDOVARA_SERVICE_BASE };
  const live = createServiceHeartbeat({
    getContext: () => context,
    probe: async ({ base }) => {
      calls.push({ base, body: undefined, conversations: false });
      return { configured: true, online: true, conversationsSent: false };
    },
    onStatus: snap => statuses.push(snap.presence),
    random: () => 0,
    schedule: (fn, ms) => {
      delays.push(ms);
      queued.push(fn);
      return queued.length;
    },
    unschedule: () => { queued = []; }
  });
  await live.start();
  assert.equal(calls.at(-1).base, DEFAULT_EIDOVARA_SERVICE_BASE);
  assert.equal(calls.at(-1).conversations, false);
  assert.equal(statuses.at(-1), SERVICE_PRESENCE_ONLINE);
  assert.equal(delays.at(-1), SERVICE_HEARTBEAT_INTERVAL_MS);
  assert.equal(live.isRunning(), true);

  context = { ageGateAccepted: true, base: '' };
  await queued.pop()();
  assert.equal(live.isRunning(), false);
  assert.equal(statuses.at(-1), SERVICE_PRESENCE_OFFLINE);
});

test('heartbeat backoff on failure uses Reconnecting and does not send conversations', async () => {
  const delays = [];
  let queued = [];
  const inits = [];
  const hb = createServiceHeartbeat({
    getContext: () => ({ ageGateAccepted: true, base: 'https://api.example.test' }),
    probe: async ({ base }) => fetchServiceLiveness({
      base,
      fetchImpl: async (url, init = {}) => {
        inits.push({ url, method: init.method, body: init.body });
        throw new Error('network down');
      }
    }),
    onStatus: snap => {
      assert.equal(snap.conversationsSent, false);
      assert.equal(snap.online, false);
      assert.equal(snap.presence, SERVICE_PRESENCE_RECONNECTING);
    },
    random: () => 0,
    schedule: (fn, ms) => {
      delays.push(ms);
      queued.push(fn);
      return queued.length;
    },
    unschedule: () => { queued = []; }
  });
  await hb.start();
  assert.equal(delays[0], SERVICE_HEARTBEAT_BACKOFF_MIN_MS);
  assert.ok(inits.length >= 1);
  for (const item of inits) {
    assert.equal(item.method, 'GET');
    assert.equal(item.body, undefined);
    assert.equal(String(item.url).includes('/v1/assist'), false);
  }
  await queued[0]();
  assert.equal(delays[1], 8_000);
  hb.stop();
  const n = inits.length;
  if (queued[1]) await queued[1]();
  assert.equal(inits.length, n);
});

test('Worker liveness JSON matches heartbeat snapshot honesty and needs no extra heartbeat route', async () => {
  const fetchImpl = async (url, init = {}) => worker.fetch(new Request(url, init), {});
  const live = await fetchServiceLiveness({ base: 'https://api.example.test', fetchImpl });
  assert.equal(live.online, true);
  assert.equal(live.presence, SERVICE_PRESENCE_ONLINE);
  assert.equal(live.paymentsEnabled, false);
  assert.equal(live.checkoutEnabled, false);
  assert.equal(live.conversationsStored, false);
  assert.equal(live.conversationsSent, false);
  const connect = await fetchServiceSnapshot({ base: 'https://api.example.test', fetchImpl });
  assert.equal(connect.online, true);
  assert.equal(connect.ageRestricted, true);
  assert.equal(connect.minimumAge, 18);
  const missing = await worker.fetch(new Request('https://api.example.test/v1/heartbeat'), {});
  assert.equal(missing.status, 404);
});

test('desktop and status page keep renderer CSP and honest poll wiring', () => {
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  const html = read('src/renderer/index.html');
  const site = read('docs/site.js');
  const status = read('docs/status.html');
  assert.match(main, /createServiceHeartbeat/);
  assert.match(main, /fetchServiceLiveness/);
  assert.match(main, /before-quit/);
  assert.match(main, /stopServiceHeartbeat/);
  assert.match(main, /soul:serviceStatus/);
  assert.match(renderer, /Reconnecting/);
  assert.match(renderer, /onServiceStatus/);
  assert.doesNotMatch(renderer, /fetch\(`\$\{.*\}\/health`/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(html, /media-src https: eidovara-media:/);
  assert.doesNotMatch(html, /eidovara-online:/);
  assert.match(site, /Presence:/);
  assert.match(site, /Reconnecting/);
  assert.match(site, /stopStatusPoll/);
  assert.match(status, /connect-src 'self' https:/);
  assert.match(status, /script-src 'self'/);
  assert.doesNotMatch(status, /unsafe-inline|unsafe-eval/);
  assert.deepEqual(officialSearchHandoffs('Saturn').map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
  assert.equal(FUTURE_VOICE_BACKEND.bundled, false);
});

