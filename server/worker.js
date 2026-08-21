const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", 'strict-transport-security': 'max-age=63072000; includeSubDomains; preload', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()' };
const response = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const httpsUrl = value => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; } };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    env ||= {};
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: 'GET, OPTIONS' } });
    if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405, { allow: 'GET, OPTIONS' });
    if (url.pathname === '/health') return response({ service: 'Eidovara', status: 'ok', version: '0.18.0', time: new Date().toISOString() }, 200, { 'cache-control': 'public, max-age=30' });
    if (url.pathname === '/v1/config') return response({
      version: '0.18.0',
      website: httpsUrl(env.WEBSITE_URL),
      store: { stripe: httpsUrl(env.STRIPE_PAYMENT_URL), paypal: httpsUrl(env.PAYPAL_PAYMENT_URL), gumroad: httpsUrl(env.GUMROAD_PRODUCT_URL) },
      paymentsEnabled: false,
      ageRestricted: true,
      minimumAge: 18,
      authenticodeSigned: false,
      officialPlatforms: ['windows-10-11-x64'],
      license: 'source-available-evaluation',
      openSource: false,
      premium: 'local-admin-testing-only',
      privacy: 'No payment-card data is accepted by this service. Conversations are not stored here. Network use is user-directed except official update checks.',
      terms: 'Use is limited to users 18 or older under the Eidovara Source-Available Evaluation License. Research uses public Wikipedia/Wikimedia unless the user supplies a Premium search key. Application launching is user-confirmed local Windows apps.'
    }, 200, { 'cache-control': 'public, max-age=300' });
    return response({ error: 'not_found' }, 404);
  }
};

export { httpsUrl };
