// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { answerAssist, assistMeta, MAX_ASSIST_BODY } from './knowledge.js';

const CORS_METHODS = 'GET, HEAD, POST, OPTIONS';
const CORS_GET_METHODS = 'GET, HEAD, OPTIONS';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': CORS_METHODS,
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': '600'
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
  ...CORS
};
const ENDPOINTS = ['/health', '/v1/health', '/v1/config', '/v1/status', '/v1/assist'];
const response = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const httpsUrl = value => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : ''; } catch { return ''; } };

function publicPayload(extra = {}) {
  return {
    service: 'Eidovara',
    status: 'ok',
    online: true,
    version: '0.19.1',
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
    ...extra
  };
}

async function handleAssist(request, url) {
  if (request.method === 'GET' && !url.searchParams.has('q') && !url.searchParams.has('query')) {
    return response(assistMeta(), 200, { 'cache-control': 'public, max-age=60' });
  }
  let query = url.searchParams.get('q') || url.searchParams.get('query') || '';
  let mode = url.searchParams.get('mode') || 'help';
  let bodyBytes = 0;
  if (request.method === 'POST') {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_ASSIST_BODY) return response({ error: 'too_large', ...answerAssist('', { bodyBytes: declared }) }, 413);
    let raw = '';
    try { raw = await request.text(); } catch { return response({ error: 'invalid', ...answerAssist('') }, 400); }
    bodyBytes = raw.length;
    if (bodyBytes > MAX_ASSIST_BODY) return response({ error: 'too_large', ...answerAssist('', { bodyBytes }) }, 413);
    if (raw.trim()) {
      let payload;
      try { payload = JSON.parse(raw); } catch { return response({ error: 'invalid', reply: 'Send JSON { "query": "...", "mode": "help" }.' }, 400); }
      if (payload && typeof payload === 'object') {
        if ('history' in payload || 'messages' in payload || 'conversations' in payload) {
          return response({ error: 'refused', reply: 'Desktop conversation history is not accepted. Ask a single product question.' }, 400);
        }
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
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: CORS_METHODS } });
    if (url.pathname === '/v1/assist') {
      if (request.method !== 'GET' && request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405, { allow: 'GET, POST, OPTIONS' });
      return handleAssist(request, url);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return response({ error: 'method_not_allowed' }, 405, { allow: CORS_GET_METHODS });
    const send = (body, extra = {}) => {
      const res = response(body, 200, extra);
      if (request.method !== 'HEAD') return res;
      return new Response(null, { status: res.status, headers: res.headers });
    };
    if (url.pathname === '/health' || url.pathname === '/v1/health') return send(publicPayload(), { 'cache-control': 'public, max-age=30' });
    if (url.pathname === '/v1/status') return send(publicPayload({
      pages: 'Official site is https://eidovara.org (Cloudflare Pages from docs/). Official API is https://api.eidovara.org. GitHub Pages publishes the same docs/ on main. No preview Worker host is compiled into the app or public JS.',
      releases: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest',
      installer: 'https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.1-Windows-x64-Setup.exe',
      assist: '/v1/assist knowledge-only, no transcripts',
      heartbeat: 'Desktop Connect uses GET /health, /v1/config, and /v1/status. After 18+, a main-process liveness loop repeats GET /health and GET /v1/status. Conversations are not sent. No dedicated /v1/heartbeat route.'
    }), { 'cache-control': 'private, no-store' });
    if (url.pathname === '/v1/config') return send({
      version: '0.19.1',
      website: httpsUrl(env.WEBSITE_URL),
      store: { stripe: httpsUrl(env.STRIPE_PAYMENT_URL), paypal: httpsUrl(env.PAYPAL_PAYMENT_URL), gumroad: httpsUrl(env.GUMROAD_PRODUCT_URL) },
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
      premium: 'local-admin-testing-only',
      privacy: 'No payment-card data is accepted by this service. Conversations are not stored here. Network use is user-directed except official update checks. Website assist answers from an allowlisted knowledge pack and does not store transcripts.',
      terms: 'Use is limited to users 18 or older under the Eidovara Source-Available Evaluation License. Research uses public Wikipedia/Wikimedia unless the user supplies a Premium search key. Application launching is user-confirmed local Windows apps.'
    }, { 'cache-control': 'public, max-age=300' });
    return response({ error: 'not_found' }, 404);
  }
};

export { httpsUrl, ENDPOINTS };
