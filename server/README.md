# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health and store configuration endpoints. It never receives card data, passwords, model credentials, conversations, or local memories. The Electron desktop app does not hard-code a `workers.dev` URL; paste the HTTPS base into Ctrl+A. **The desktop product works fully offline (Free / Offline Soul) with no Worker URL.**

Owner runbook (Pages, Releases, wrangler, optional custom domain): `docs/PAYMENTS_AND_SITE.md`.

## Free deployment

1. Create a Cloudflare account and enable Workers Free.
2. Install Wrangler locally with `npm install --save-dev wrangler` or use Cloudflare's dashboard editor. Do not add Wrangler to Eidovara's committed `package.json` unless you intend it as a product dependency.
3. Authenticate with `npx wrangler login` (or export `CLOUDFLARE_API_TOKEN` in your own shell — never commit it) and deploy from this directory with `npx wrangler deploy`.
4. Create hosted checkout links in Stripe Payment Links, PayPal Payment Links, or Gumroad only when selling. Keep those URLs empty to leave payments off.
5. Put only the public HTTPS checkout URLs in `wrangler.toml` variables or the Cloudflare dashboard. Never add API secrets to this repository.
6. Copy the resulting HTTPS **base** URL into Eidovara's private Ctrl+A administration panel and use **Test service**. That calls `GET /health`.

Owner-example (operator paste only — not a user-required server, not compiled into the app): `https://eidovara-api.dreambot333.workers.dev` currently serves `/health` and `/v1/config` on Workers Free. Re-deploy after editing `worker.js`. Prefer a custom domain later (`docs/PAYMENTS_AND_SITE.md`). The GitHub Pages site is separate: `https://projectsoulbytmb.github.io/project---soul/`.

For production, enable Cloudflare account two-factor authentication, keep Wrangler tokens out of source control, deploy from a protected GitHub environment, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET /health` and `GET /v1/config`. `/v1/config` reports `paymentsEnabled: false`, `ageRestricted: true`, `minimumAge: 18`, `authenticodeSigned: false`, `openSource: false`, and `premium: local-admin-testing-only`. Store URLs stay empty unless you later add provider-hosted checkout links. Live payments stay off in v0.18.0. All other methods and paths fail closed.
