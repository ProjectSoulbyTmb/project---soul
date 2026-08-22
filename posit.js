// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { answerAssist, assistMeta, MAX_ASSIST_BODY, ASSIST_VERSION } from './knowledge.js';

const LIVE_INSTALLER_VERSION = '1.0.0';
const LIVE_INSTALLER = 'Eidovara-v1.0.0-Windows-x64-Setup.exe';
// No tagged v1.0.0 build exists yet: measured facts stay null until the
// Release Windows workflow publishes the artifact with SHA256SUMS.txt.
// The deploy may override both via wrangler vars LIVE_INSTALLER_SHA256 / LIVE_INSTALLER_SIZE.
const FALLBACK_INSTALLER_SHA256 = null;
const FALLBACK_INSTALLER_SIZE = null;
const LIVE_INSTALLER_URL =
  'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-v1.0.0-Windows-x64-Setup.exe';

const ASSIST_RATE_WINDOW_MS = 60_000;
const ASSIST_RATE_MAX_REQUESTS = 30;
const ASSIST_RATE_MAX_TRACKED_IPS = 10_000;
const assistHits = new Map();

function assistRateLimited(request) {
  const ip =
    String(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '')
      .split(',')[0]
      .trim()
      .slice(0, 64) || 'unknown';
  const now = Date.now();
  const windowStart = now - ASSIST_RATE_WINDOW_MS;
  let stamps = assistHits.get(ip);
  if (!stamps) {
    stamps = [];
    assistHits.set(ip, stamps);
  }
  while (stamps.length && stamps[0] <= windowStart) stamps.shift();
  if (stamps.length >= ASSIST_RATE_MAX_REQUESTS) return true;
  stamps.push(now);
  if (assistHits.size > ASSIST_RATE_MAX_TRACKED_IPS) {
    for (const [key, value] of assistHits) {
      if (!value.length || value[value.length - 1] <= windowStart) assistHits.delete(key);
      if (assistHits.size <= ASSIST_RATE_MAX_TRACKED_IPS / 2) break;
    }
  }
  return false;
}

function liveInstallerFacts(env = {}) {
  const sha =
    typeof env.LIVE_INSTALLER_SHA256 === 'string' &&
    /^[0-9a-fA-F]{64}$/.test(env.LIVE_INSTALLER_SHA256.trim())
      ? env.LIVE_INSTALLER_SHA256.trim().toLowerCase()
      : FALLBACK_INSTALLER_SHA256;
  const sizeRaw = Number(env.LIVE_INSTALLER_SIZE);
  const size =
    Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.round(sizeRaw) : FALLBACK_INSTALLER_SIZE;
  return { sha256: sha, size };
}

const CORS_METHODS = 'GET, HEAD, POST, OPTIONS';
const CORS_GET_METHODS = 'GET, HEAD, OPTIONS';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': CORS_METHODS,
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': '600',
};
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-resource-policy': 'cross-origin',
  'cross-origin-opener-policy': 'same-origin',
  ...CORS,
};
const ENDPOINTS = ['/health', '/v1/health', '/v1/config', '/v1/status', '/v1/assist'];
const response = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const httpsUrl = value => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : '';
  } catch {
    return '';
  }
};

function publicPayload(env = {}, extra = {}) {
  const { sha256, size } = liveInstallerFacts(env);
  return {
    service: 'Eidovara',
    status: 'ok',
    online: true,
    version: ASSIST_VERSION,
    liveInstallerVersion: LIVE_INSTALLER_VERSION,
    liveInstaller: LIVE_INSTALLER,
    liveInstallerSha256: sha256,
    liveInstallerSize: size,
    liveInstallerUrl: LIVE_INSTALLER_URL,
    edition: 'free',
    fullFreeAlpha: true,
    time: new Date().toISOString(),
    localFirst: true,
    conversations: false,
    conversationsStored: false,
    paymentsEnabled: false,
    checkoutEnabled: false,
    ageRestricted: true,
    minimumAge: 18,
    authenticodeSigned: false,
    unsignedWindows: true,
    endpoints: ENDPOINTS.slice(),
    ...extra,
  };
}

async function handleAssist(request, url) {
  if (request.method === 'GET' && !url.searchParams.has('q') && !url.searchParams.has('query'))
    return response(assistMeta(), 200, { 'cache-control': 'public, max-age=60' });
  let query = url.searchParams.get('q') || url.searchParams.get('query') || '';
  let mode = url.searchParams.get('mode') || 'help';
  let bodyBytes = 0;
  if (request.method === 'POST') {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_ASSIST_BODY)
      return response({ error: 'too_large', ...answerAssist('', { bodyBytes: declared }) }, 413);
    let raw = '';
    try {
      raw = await request.text();
    } catch {
      return response({ error: 'invalid', ...answerAssist('') }, 400);
    }
    bodyBytes = raw.length;
    if (bodyBytes > MAX_ASSIST_BODY)
      return response({ error: 'too_large', ...answerAssist('', { bodyBytes }) }, 413);
    if (raw.trim()) {
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return response(
          { error: 'invalid', reply: 'Send JSON { "query": "...", "mode": "help" }.' },
          400
        );
      }
      if (payload && typeof payload === 'object') {
        if ('history' in payload || 'messages' in payload || 'conversations' in payload)
          return response(
            {
              error: 'refused',
              reply: 'Desktop conversation history is not accepted. Ask a single product question.',
            },
            400
          );
        query = payload.query ?? payload.q ?? query;
        mode = payload.mode || mode;
      }
    }
  }
  const result = answerAssist(query, { mode, bodyBytes });
  const error = result.ok ? undefined : result.code;
  return response({ ...result, error }, result.status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    env ||= {};
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: CORS_METHODS } });
    if (url.pathname === '/v1/assist') {
      if (request.method !== 'GET' && request.method !== 'POST')
        return response({ error: 'method_not_allowed' }, 405, { allow: 'GET, POST, OPTIONS' });
      if (assistRateLimited(request))
        return response(
          {
            error: 'rate_limited',
            reply: 'Too many requests from this address. Try again in a minute.',
          },
          429,
          { 'retry-after': '60' }
        );
      return handleAssist(request, url);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD')
      return response({ error: 'method_not_allowed' }, 405, { allow: CORS_GET_METHODS });
    const send = (body, extra = {}) => {
      const res = response(body, 200, extra);
      return request.method === 'HEAD'
        ? new Response(null, { status: res.status, headers: res.headers })
        : res;
    };
    if (url.pathname === '/health' || url.pathname === '/v1/health')
      return send(publicPayload(env), { 'cache-control': 'public, max-age=30' });
    if (url.pathname === '/v1/status')
      return send(
        publicPayload(env, {
          pages:
            'Official site is https://eidovara.org (Cloudflare Pages from docs/). GitHub Pages publishes the same docs/ from main.',
          releases: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest',
          installer: LIVE_INSTALLER_URL,
          assist: '/v1/assist knowledge-only, no transcripts',
          heartbeat:
            'Desktop Connect uses GET /health, /v1/config, and /v1/status. Conversations are not sent by the heartbeat.',
        }),
        { 'cache-control': 'private, no-store' }
      );
    if (url.pathname === '/v1/config') {
      const { sha256, size } = liveInstallerFacts(env);
      return send(
        {
          version: ASSIST_VERSION,
          liveInstallerVersion: LIVE_INSTALLER_VERSION,
          liveInstaller: LIVE_INSTALLER,
          liveInstallerSha256: sha256,
          liveInstallerSize: size,
          liveInstallerUrl: LIVE_INSTALLER_URL,
          edition: 'free',
          fullFreeAlpha: true,
          premium: 'local-admin-testing-only',
          website: httpsUrl(env.WEBSITE_URL),
          store: {
            stripe: httpsUrl(env.STRIPE_PAYMENT_URL),
            paypal: httpsUrl(env.PAYPAL_PAYMENT_URL),
            gumroad: httpsUrl(env.GUMROAD_PRODUCT_URL),
          },
          paymentsEnabled: false,
          checkoutEnabled: false,
          localFirst: true,
          conversations: false,
          conversationsStored: false,
          ageRestricted: true,
          minimumAge: 18,
          authenticodeSigned: false,
          officialPlatforms: ['windows-10-11-x64'],
          license: 'source-available-evaluation',
          openSource: false,
          entitlement: 'none-required-for-current-features',
          privacy:
            'No payment-card data is accepted by this service. Conversations are not stored here. Network use is user-directed except official update/status checks. Website assist answers from an allowlisted knowledge pack and does not store transcripts.',
          terms:
            'Use is limited to users 18 or older under the Eidovara Source-Available Evaluation License. Application launching is user-confirmed local Windows apps; internet research and media/provider features are user-directed.',
        },
        { 'cache-control': 'public, max-age=300' }
      );
    }
    return response({ error: 'not_found' }, 404);
  },
};

export {
  httpsUrl,
  ENDPOINTS,
  LIVE_INSTALLER_VERSION,
  LIVE_INSTALLER,
  FALLBACK_INSTALLER_SHA256 as LIVE_INSTALLER_SHA256,
  FALLBACK_INSTALLER_SIZE as LIVE_INSTALLER_SIZE,
  LIVE_INSTALLER_URL,
  assistRateLimited,
  liveInstallerFacts,
};
