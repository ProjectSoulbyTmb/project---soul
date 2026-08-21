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

Deploy `server/worker.js` to Cloudflare Workers only when you choose to host it; this repository does not deploy the Worker. `pnpm run server:test` exercises the Worker locally without secrets. Copy a generated HTTPS base URL into **Soul HTTPS service** in the administrator panel. Use **Test service** to verify `/health`. Public checkout URLs can be configured in the Worker environment. Keep secrets out of `wrangler.toml` and source control. Optional deploy from `server/` is `npx wrangler deploy` after `npx wrangler login`.

## Required customer-facing decisions

Before selling, publish the final price, license scope, refund/cancellation policy, support contact, privacy notice, and applicable tax treatment. Do not describe the project as PCI certified, legally certified, government approved, or guaranteed secure unless a qualified independent authority has actually issued that result.
