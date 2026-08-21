# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health and store configuration endpoints. It never receives card data, passwords, model credentials, conversations, or local memories. This repository does not deploy the Worker; production `workers.dev` or custom-domain hosting is an owner action.

## Tests

From the repository root, `pnpm run server:test` (or `node --test tests/server.test.js`) exercises `server/worker.js` locally. No Cloudflare account, Wrangler login, or secrets are required.

## Optional deployment

1. Create a Cloudflare account and enable Workers Free.
2. From this directory, use Cloudflare's dashboard editor or run `npx wrangler login` and `npx wrangler deploy`. Wrangler is not a repository dependency and is not run by default.
3. Create hosted checkout links in Stripe Payment Links, PayPal Payment Links, or Gumroad.
4. Put only the public HTTPS checkout URLs in `wrangler.toml` variables or the Cloudflare dashboard. Never add API secrets to this repository.
5. Copy the resulting `https://eidovara-api.<account>.workers.dev` URL into Eidovara's private Ctrl+A administration panel.

For production, enable Cloudflare account two-factor authentication, keep Wrangler tokens out of source control, deploy from a protected GitHub environment, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET /health` and `GET /v1/config`. All other methods and paths fail closed.
