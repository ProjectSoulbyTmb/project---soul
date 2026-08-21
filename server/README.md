# Eidovara HTTPS service

This dependency-free Cloudflare Worker supplies public health and store configuration endpoints. It never receives card data, passwords, model credentials, conversations, or local memories. It is not a production store, payment processor, or hosted account service.

The official public website remains GitHub Pages at `https://projectsoulbytmb.github.io/project---soul/` (HTTPS enforced by GitHub). This Worker is the optional Cloudflare online server. Do not invent or claim a branded custom domain. Putting the static `docs/` site itself on Cloudflare Pages or behind a Cloudflare proxy requires a Cloudflare login plus a domain the owner actually registers; until that exists, GitHub Pages stays the public trust center.

## Free deployment

1. Create a Cloudflare account and enable Workers Free. Turn on two-factor authentication.
2. From this directory, authenticate either with `npx wrangler login` (interactive) or an API token:
   - Dashboard → My Profile → API Tokens → Create Token
   - Use the **Edit Cloudflare Workers** template (Account / User / Zone resources limited to this account)
   - Export it only in the shell: `export CLOUDFLARE_API_TOKEN=...` — never commit it, never put it in `wrangler.toml`, `.env` files in git, issues, or the desktop app
3. Deploy with `npx wrangler deploy` (Wrangler is not an app dependency; use `npx` or install it locally if you want). The command prints an account-specific `https://eidovara-api.<account>.workers.dev` origin.
4. Copy that HTTPS base URL into Eidovara's private Ctrl+A administration field **Cloudflare Worker HTTPS base URL**. Use **Test service** to call `/health`.
5. Optional public checkout links (Stripe Payment Links, PayPal Payment Links, or Gumroad) may be placed in `wrangler.toml` `[vars]` or the Cloudflare dashboard. Leave them empty until a provider-hosted HTTPS checkout actually exists. Never add API secrets to this repository.

Local checks that do not need Cloudflare credentials:

```powershell
npm run server:test
npm run server:check
npm run server:dry-run
```

`server:check` validates `wrangler.toml` and exercises `GET /health` and `GET /v1/config` in-process. `server:dry-run` also runs `npx wrangler deploy --dry-run` (needs network to download Wrangler, not an account token).

For production, keep Wrangler tokens out of source control, deploy from a protected GitHub environment if you add one, monitor `/health`, and configure more than one owner-controlled recovery method. The public service is deliberately stateless, so an outage cannot corrupt user conversations or payment records.

Endpoints: `GET /health` and `GET /v1/config`. All other methods and paths fail closed.
