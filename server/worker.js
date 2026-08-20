const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' };
const response = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
const httpsUrl = value => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; } };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: 'GET, OPTIONS' } });
    if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405, { allow: 'GET, OPTIONS' });
    if (url.pathname === '/health') return response({ service: 'Project Soul Studios', status: 'ok', version: '0.16.1', time: new Date().toISOString() });
    if (url.pathname === '/v1/config') return response({ version: '0.16.1', website: httpsUrl(env.WEBSITE_URL), store: { stripe: httpsUrl(env.STRIPE_PAYMENT_URL), paypal: httpsUrl(env.PAYPAL_PAYMENT_URL), gumroad: httpsUrl(env.GUMROAD_PRODUCT_URL) }, privacy: 'No payment-card data is accepted by this service.' }, 200, { 'cache-control': 'public, max-age=300' });
    return response({ error: 'not_found' }, 404);
  }
};

export { httpsUrl };
