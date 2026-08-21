# Owner guide: website and payments

## Website management

The public HTTPS site is deployed from `docs/` to `https://projectsoulbytmb.github.io/project---soul/`. Edit those files, review the change locally, and push to `main`; the `Deploy project website` workflow publishes it. Releases and installer downloads are managed from the repository Releases page. GitHub automatically enforces HTTPS on the default Pages domain.

## Payment management

Use a provider-hosted checkout so Soul never receives payment-card data:

- Stripe: create a product and Payment Link in the Stripe Dashboard.
- PayPal: use a Business account to create a Payment Link or Buy Button.
- Gumroad: create a digital software product and use its public checkout URL.

Complete the provider's identity, business, payout, tax, refund, and dispute configuration yourself. Test the provider's sandbox or test mode before accepting real payments. Do not paste secret/API keys into the website, app store URL, Worker variables, issues, or commits.

Open Eidovara's private administrator panel with Ctrl+A, enter the local administrator password, paste the provider's public `https://` checkout URL into **Secure store / payment page**, and save. Free users then see **View Eidovara Premium** in Settings. The link opens in their system browser.

## HTTPS service

The repository does not auto-deploy the Cloudflare Worker. `server/worker.js` plus `server/wrangler.toml` (`name = "eidovara-api"`) are the source.

1. From `server/`, authenticate with `npx wrangler login` or a local `CLOUDFLARE_API_TOKEN` in your environment (never commit the token).
2. Deploy with `npx wrangler deploy`. Wrangler is not an Eidovara runtime dependency; install it only on the machine that deploys.
3. Copy the generated HTTPS **base** URL (no path) into Eidovara's private Ctrl+A panel field **Soul HTTPS service**, then **Test service**. That request hits `{base}/health` and expects JSON `{ "service": "Eidovara", "status": "ok", "version": "0.18.0" }`.
4. `/v1/config` returns the public website URL and optional provider-hosted checkout links. Leave Stripe/PayPal/Gumroad empty until a real store exists. Live payments stay off.

Owner reference (not compiled into the Electron app): an existing Workers Free endpoint is `https://eidovara-api.dreambot333.workers.dev`. Paste that base, or any later custom domain, yourself. The desktop product never hard-codes `workers.dev`.

## Required customer-facing decisions

Before selling, publish the final price, license scope, refund/cancellation policy, support contact, privacy notice, and applicable tax treatment. Do not describe the project as PCI certified, legally certified, government approved, or guaranteed secure unless a qualified independent authority has actually issued that result.
