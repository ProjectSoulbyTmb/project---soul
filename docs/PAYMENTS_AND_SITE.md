# Owner runbook: public website, Windows download, Worker, and payments

Eidovara v0.18.0 is a **local-first Windows desktop app**. Making it “online for all users” means a public HTTPS site, a public Windows download, and an optional public Worker for `/health`, `/v1/config`, and `/v1/status`. It does **not** mean hosting everyone’s Soul, chat, or memories in the cloud. Free / Offline Soul works with no Worker URL. The desktop app can attach to that service for status/config while remaining local-first.

Do not enable GitHub Dependency graph from this document (that is a repository Settings click). Do not commit API tokens, Wrangler credentials, or payment secrets.

## Remaining owner clicks

These cannot be completed from source code:

1. **GitHub Pages** — Settings → Pages → Build and deployment → **GitHub Actions**. The workflow `.github/workflows/pages.yml` publishes `docs/` on push to `main` (and on `workflow_dispatch`). HTTPS is enforced on the default project URL. As of 2026-08-21 this is already on: `https://projectsoulbytmb.github.io/project---soul/`. Re-check after merging site changes to `main`.
2. **GitHub Releases** — Push a `v*` tag on `main` (for example `v0.18.0`) so `Release Windows` builds unsigned NSIS on `windows-latest` and publishes `Eidovara-*-Windows-x64-Setup.exe`. A v0.18.0 installer already exists on the Releases page; a later tag is required for a newer installer. `workflow_dispatch` on a branch only uploads unsigned build artifacts; it does not Authenticode-sign and does not publish a Release unless the ref is a `v*` tag.
3. **Cloudflare Worker** — From `server/`, `npx wrangler login` or a local `CLOUDFLARE_API_TOKEN` (never committed), then `npx wrangler deploy`. Copy the HTTPS **base** (no path) into desktop **Settings → Eidovara service** and **Connect**, or the Ctrl+A field **Soul HTTPS service** and click **Test service**.
4. **Optional custom domain** — In Cloudflare, put a hostname in front of GitHub Pages and (separately) a Worker route. Paste the Worker base into Settings → Eidovara service (or Ctrl+A). Do not hard-code it in the Electron app.
5. **Payments** — Leave store URLs empty. v0.18.0 has no live checkout and is not PCI processing.

NSIS overwrite-on-reinstall for existing installs is tracked on pull request #9, not in this runbook.

## 1. Public HTTPS website (GitHub Pages)

Source: `docs/`. Live URL: `https://projectsoulbytmb.github.io/project---soul/`.

- Edit HTML/CSS under `docs/`, review locally, merge to `main`. The `Deploy project website` workflow uploads `docs/` as the Pages artifact.
- If Pages was never enabled: Settings → Pages → Source **GitHub Actions** (not “Deploy from a branch” unless you also change the workflow). GitHub enforces HTTPS on `*.github.io`.
- The homepage tells visitors: visit the site → download the unsigned Stable Alpha Windows installer when a Release exists, or build from source → the desktop app is the product → cloud is optional config/health only.
- Do not put `workers.dev` URLs in the public site as a required API. Operator-example Worker URLs belong in this owner guide only.

## 2. Public Windows download (GitHub Releases)

- User-facing link: `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest`
- Official advertised artifact: Authenticode-**unsigned** Windows 10/11 x64 NSIS `Setup.exe`, 18+. SmartScreen may warn. Users should verify `SHA256SUMS.txt` and GitHub/Sigstore provenance. There is no Authenticode claim.
- If a Release has no `Setup.exe`, the site tells users to build on Windows with `npm run dist:win:installer`. Linux/macOS scripts are development targets, not official products.
- CI: `.github/workflows/release-windows.yml` runs on `windows-latest` for `v*` tags (publish) and `workflow_dispatch` (unsigned artifacts on a branch). It sets `CSC_IDENTITY_AUTO_DISCOVERY=false` and does **not** produce a signed installer. GitHub build provenance is not Authenticode.
- Local Windows build is always valid: `npm run dist:win:installer` then attach files per `docs/GITHUB_RELEASES.md` if Actions cannot run.

## 3. Optional Cloudflare Worker (`/health`, `/v1/config`, `/v1/status`)

Source: `server/worker.js` plus `server/wrangler.toml` (`name = "eidovara-api"`). Fail-closed: only GET `/health`, GET `/v1/config`, and GET `/v1/status`; other methods/paths 405/404. Payments stay empty (`paymentsEnabled: false`). The desktop app ignores checkout even if a future config lied.

1. Create a Cloudflare account and enable Workers Free.
2. From `server/`, authenticate with `npx wrangler login` or export `CLOUDFLARE_API_TOKEN` in your own shell. Never commit the token.
3. Deploy with `npx wrangler deploy`. Wrangler is not an Eidovara runtime dependency.
4. Copy the generated HTTPS **base** URL (no path) into Eidovara **Settings → Eidovara service** and **Connect**, or the private Ctrl+A panel **Soul HTTPS service**, then **Test service**. After the 18+ gate the app requests `{base}/health`, `{base}/v1/config`, and `{base}/v1/status`. Health JSON is `{ "service": "Eidovara", "status": "ok", "version": "0.18.0" }`. If those requests fail, Offline Soul continues locally.
5. `/v1/config` returns the public website URL and optional provider-hosted checkout links. Leave Stripe/PayPal/Gumroad empty until a real store exists.

The desktop product never hard-codes `workers.dev`. Users do not need a Worker URL.

Operator example (operator paste only, not a user-required server, not compiled into the app): `https://eidovara-api.dreambot333.workers.dev` currently serves `/health`, `/v1/config`, and `/v1/status` on Workers Free. Re-deploy after editing `worker.js`. Prefer a later custom domain if you add one.

## 4. Optional custom domain (Cloudflare in front)

Keep Pages and the Worker on separate hostnames if you add a domain you control.

**Website (Pages)**

1. Register the domain in an account you control and add it to Cloudflare DNS.
2. GitHub → Settings → Pages → Custom domain → `www.example.com` (or apex if you use A/ALIAS records GitHub documents).
3. In Cloudflare DNS, CNAME `www` to `projectsoulbytmb.github.io` (or follow GitHub’s current Pages custom-domain records). Enable Cloudflare proxy only after GitHub has issued the Pages certificate, or follow GitHub’s custom-domain HTTPS notes so you do not break issuance.
4. Update `server/wrangler.toml` `WEBSITE_URL` and re-deploy the Worker so `/v1/config` points at the custom site.

**Worker (API)**

1. In the Cloudflare dashboard, add a route such as `api.example.com/*` to the `eidovara-api` Worker, or set a custom domain on the Worker.
2. Paste `https://api.example.com` (base only) into Settings → Eidovara service or Ctrl+A **Test service**. Still do not hard-code it in the app.

## Payment management (still off)

Use a provider-hosted checkout so Soul never receives payment-card data:

- Stripe: create a product and Payment Link in the Stripe Dashboard.
- PayPal: use a Business account to create a Payment Link or Buy Button.
- Gumroad: create a digital software product and use its public checkout URL.

Complete the provider’s identity, business, payout, tax, refund, and dispute configuration yourself. Test the provider’s sandbox or test mode before accepting real payments. Do not paste secret/API keys into the website, app store URL, Worker variables, issues, or commits.

Open Eidovara’s private administrator panel with Ctrl+A, enter the local administrator password, paste the provider’s public `https://` checkout URL into **Secure store / payment page**, and save. Free users then see **View Eidovara Premium** in Settings. The link opens in their system browser.

v0.18.0 does not sell Premium. Leave Worker store URLs empty.

## Required customer-facing decisions before selling

Before selling, publish the final price, license scope, refund/cancellation policy, support contact, privacy notice, and applicable tax treatment. Do not describe the project as PCI certified, legally certified, government approved, Authenticode-signed, or guaranteed secure unless a qualified independent authority has actually issued that result.
