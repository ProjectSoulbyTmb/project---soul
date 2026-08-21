# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health, status, and store configuration endpoints. It never receives card data, passwords, model credentials, conversations, or local memories. The Electron desktop app does not hard-code a `workers.dev` URL; paste the HTTPS base into **Settings → Eidovara service** (or Ctrl+A **Soul HTTPS service**).

## Free deployment

1. Create a Cloudflare account and enable Workers Free.
2. Install Wrangler locally with `npm install --save-dev wrangler` or use Cloudflare's dashboard editor. Do not add Wrangler to Eidovara's committed `package.json` unless you intend it as a product dependency.
3. Authenticate with `npx wrangler login` (or export `CLOUDFLARE_API_TOKEN` in your own shell — never commit it) and deploy from this directory with `npx wrangler deploy`.
4. Create hosted checkout links in Stripe Payment Links, PayPal Payment Links, or Gumroad only when selling. Keep those URLs empty to leave payments off.
5. Put only the public HTTPS checkout URLs in `wrangler.toml` variables or the Cloudflare dashboard. Never add API secrets to this repository.
6. Copy the resulting HTTPS **base** URL into Eidovara Settings → **Eidovara service** and **Connect**, or into the private Ctrl+A panel and **Test service**. After the 18+ gate, the app calls `GET /health`, `GET /v1/config`, and `GET /v1/status`. If those requests fail, Offline Soul continues locally.

Operator example (not baked into the app): `https://eidovara-api.dreambot333.workers.dev` currently serves `/health`, `/v1/config`, and `/v1/status` on Workers Free. Re-deploy after editing `worker.js`. The GitHub Pages site is separate: `https://projectsoulbytmb.github.io/project---soul/`.

For production, enable Cloudflare account two-factor authentication, keep Wrangler tokens out of source control, deploy from a protected GitHub environment, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET /health`, `GET /v1/config`, and `GET /v1/status`. `/v1/config` and `/v1/status` report `paymentsEnabled: false`. `/v1/status` also reports `localFirst: true` and `conversations: false`. Store URLs stay empty unless you later add provider-hosted checkout links. Live payments stay off in v0.18.0. The desktop app ignores checkout even if a future config lied. All other methods and paths fail closed.
