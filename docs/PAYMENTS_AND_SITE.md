# Owner guide: website and payments

## Website management

The official public HTTPS site is static `docs/` on GitHub Pages: `https://projectsoulbytmb.github.io/project---soul/`. Edit those files, review the change locally, and push to `main`; the `Deploy project website` workflow publishes it. Releases and installer downloads are managed from the repository Releases page. GitHub automatically enforces HTTPS on the default Pages domain.

`docs/_headers` is a Cloudflare Pages-style header map. GitHub Pages serves the HTML with its own HTTPS/HSTS and does not apply that file as response headers; Content-Security-Policy is also set in each HTML document. Routing the website through Cloudflare Pages or a Cloudflare-proxied custom host requires a Cloudflare account and a domain the owner actually registers. This project does not invent or claim a branded domain. Until those credentials and a real domain exist, GitHub Pages remains the public trust center. Cloudflare is used for the optional Worker API described below.

## Payment management

Use a provider-hosted checkout so Soul never receives payment-card data:

- Stripe: create a product and Payment Link in the Stripe Dashboard.
- PayPal: use a Business account to create a Payment Link or Buy Button.
- Gumroad: create a digital software product and use its public checkout URL.

Complete the provider's identity, business, payout, tax, refund, and dispute configuration yourself. Test the provider's sandbox or test mode before accepting real payments. Do not paste secret/API keys into the website, app store URL, Worker variables, issues, or commits.

Open Eidovara's private administrator panel with Ctrl+A, enter the local administrator password, paste the provider's public `https://` checkout URL into **Secure store / payment page**, and save. Free users then see **View Eidovara Premium** in Settings. The link opens in their system browser.

## HTTPS service (Cloudflare Worker)

The online application server is `server/worker.js` on Cloudflare Workers (`GET /health` and `GET /v1/config` only). Deploy from `server/` with `npx wrangler login` or `CLOUDFLARE_API_TOKEN`, then `npx wrangler deploy`. Copy the generated `https://eidovara-api.<account>.workers.dev` origin into **Cloudflare Worker HTTPS base URL** in the Ctrl+A administrator panel. Use **Test service** to verify `/health`. Do not hardcode that account-specific URL into the shipped app. Public checkout URLs can be configured in the Worker environment; payment URL vars stay empty until a provider-hosted checkout exists. Keep secrets out of `wrangler.toml` and source control. Local verification: `npm run server:test` and `npm run server:check`.

## Required customer-facing decisions

Before selling, publish the final price, license scope, refund/cancellation policy, support contact, privacy notice, and applicable tax treatment. Do not describe the project as PCI certified, legally certified, government approved, or guaranteed secure unless a qualified independent authority has actually issued that result.
