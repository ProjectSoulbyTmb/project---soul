# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health and store configuration endpoints. It never receives card data, passwords, model credentials, conversations, or local memories.

## Free deployment

1. Create a Cloudflare account and enable Workers Free.
2. Install Wrangler locally with `npm install --save-dev wrangler` or use Cloudflare's dashboard editor.
3. Authenticate with `npx wrangler login` and deploy from this directory with `npx wrangler deploy`.
4. Create hosted checkout links in Stripe Payment Links, PayPal Payment Links, or Gumroad.
5. Put only the public HTTPS checkout URLs in `wrangler.toml` variables or the Cloudflare dashboard. Never add API secrets to this repository.
6. Copy the resulting `https://eidovara-api.<account>.workers.dev` URL into Eidovara's private Ctrl+A administration panel.

For production, enable Cloudflare account two-factor authentication, keep Wrangler tokens out of source control, deploy from a protected GitHub environment, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET /health` and `GET /v1/config`. All other methods and paths fail closed.
