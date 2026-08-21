# Owner runbook: public website, Windows download, Worker, and payments

Eidovara v0.19.0 is a **local-first Windows desktop app**. Making it “online for all users” means a public HTTPS site, a public Windows download, and an optional public Worker for `/health`, `/v1/config`, `/v1/status`, and website-helper `/v1/assist`. It does **not** mean hosting everyone’s Soul, chat, or memories in the cloud. Free / Offline Soul works with no Worker URL. The desktop app can attach to that service for status/config while remaining local-first. Ask Eidovara on GitHub Pages and eidovara.org works with zero secrets.

Do not commit API tokens, Wrangler credentials, or payment secrets. Do not hard-code `dreambot333.workers.dev` in the app or public HTML/JS.

## Live after PR #10 (merged)

GitHub Pages deploys `docs/` from **`main` via `.github/workflows/pages.yml`**. PR #10 (`cursor/engine-product-surface-c180`) **is merged** to `main`. Live `github.io` serves the product-surface site (Home, Product, Download, Assist, Help, FAQ, Status, Legal). HTTPS is already on for `*.github.io`. Do not retarget Pages at a feature branch and do not stand up a second production site. See the repository root [LIVE.md](https://github.com/ProjectSoulbyTmb/project---soul/blob/main/LIVE.md) for the ship snapshot.

| Surface | Live now |
| --- | --- |
| Cloudflare Pages `https://eidovara.org/` | Official consumer hostname. Project `eidovara` publishes the same `docs/` (Home, Product, Download, Assist, Help, FAQ, Status, Legal). Deploy: `npx wrangler pages deploy docs --project-name=eidovara`. Worker API stays separate. |
| GitHub Pages `https://projectsoulbytmb.github.io/project---soul/` | Product-surface `docs/` from `main`. `pages.yml` publishes on push to `main` (HTTPS). |
| Cloudflare Worker (`npx wrangler deploy` from `server/`) | Optional public `/health` `/v1/config` `/v1/status` `/v1/assist`. Paste the HTTPS **base** — no host is compiled into the app or public JS. Redeploy after `worker.js` changes so the live Worker does not drift. Custom hostname `https://api.eidovara.org`. |
| Desktop app | Settings → Eidovara service **Connect** after 18+; launch retry; Ctrl+A **Test service**. Offline fallback. Paste-base still required. |

Owner merge path completed: PR #10 merged to `main` → `Deploy project website` uploaded `docs/` → github.io updated. Cloudflare Pages project `eidovara` serves that same `docs/` at `https://eidovara.org/`. Do not invent another production site.

## Remaining owner clicks (solution paths git cannot finish)

These cannot be completed from source code. Each item is a **solution path**, not an unsolved bug in this PR.

1. **Dependency review CI (seen on pull request #5)** — GitHub Actions cannot turn on Dependency graph. Keep `.github/workflows/dependency-review.yml` (`fail-on-severity: moderate`); do not delete or weaken it. **Fix:** repository **Settings → Code security** (Code security and analysis) → enable **Dependency graph**. Direct link: `https://github.com/ProjectSoulbyTmb/project---soul/settings/security_analysis`. After that click, Dependency review can run on pull requests.
2. **GitHub Pages still serves `main`** — `.github/workflows/pages.yml` already deploys `docs/` on push to `main` (and `workflow_dispatch`). The live URL `https://projectsoulbytmb.github.io/project---soul/` therefore shows whatever `main` last published. PR #10 (`cursor/engine-product-surface-c180`) is already merged; do not retarget Pages at a feature branch. If Pages was never enabled: Settings → Pages → Build and deployment → **GitHub Actions**.
3. **Worker vs git drift** — `server/worker.js` serves `/health`, `/v1/config`, `/v1/status`, and `/v1/assist`. A previously deployed Worker can lag until you redeploy. **Fix:** from `server/`, `npx wrangler login` or a local `CLOUDFLARE_API_TOKEN` (never committed), then `npx wrangler deploy`. The desktop already defaults to `https://api.eidovara.org`. Optional: paste another HTTPS **base** (no path) into desktop **Settings → Eidovara service** to override, or the same base in the website Status page or Ask Eidovara sheet (localStorage) for `/v1/assist`. Skip deploy if you have no token; the Pages helper still works.
4. **GitHub Releases** — Push a `v*` tag on `main` (next: `v0.19.1`) so `Release Windows` builds unsigned NSIS on `windows-latest` and publishes `Eidovara-*-Windows-x64-Setup.exe` plus `latest.yml`. Tags `v0.18.0`, `v0.18.1`, `v0.18.2`, `v0.18.3`, and `v0.19.0` already exist and must not be force-moved. `workflow_dispatch` on a branch only uploads unsigned build artifacts; it does not Authenticode-sign and does not publish a Release unless the ref is a `v*` tag.
5. **www custom domain** — Apex `eidovara.org` is already a Cloudflare Pages custom domain on project `eidovara` (same `docs/` as GitHub Pages). `www.eidovara.org` does not resolve until the owner creates a proxied CNAME `www` → `eidovara.pages.dev`. Do not add `docs/CNAME` and do not retarget GitHub Pages at this hostname. This API token cannot write DNS records. The desktop already defaults to `https://api.eidovara.org`. Do not hard-code `dreambot333.workers.dev`.

Windows Setup overwrites an existing Eidovara program install (`build/installer.nsh`, `SetOverwrite on`, nsProcess close/kill). AppData is not wiped.

## Honest cannot-ship (document, do not fake)

Leave these documented. Do not “fix” them in git by claiming they exist:

- **Live payments / automatic Premium** — Leave store URLs empty. v0.19.0 has no live checkout and is not PCI processing.
- **Authenticode** — Official advertised Windows installers stay unsigned until the owner obtains a code-signing identity outside this repository.
- **Official Linux/macOS product** — Packaging scripts are development targets only.
- **Neural TTS / VRM / OBS websocket control** — Not bundled; adapters stay document-only.
- **Consciousness** — Soul is software, not a scientific or legal claim of sentience.

## 1. Public HTTPS website (Cloudflare Pages + GitHub Pages)

Source: `docs/`. Official live URL: `https://eidovara.org/`. GitHub Pages mirror: `https://projectsoulbytmb.github.io/project---soul/`.

- Edit HTML/CSS under `docs/`, review locally, **merge to `main`**. The `Deploy project website` workflow uploads `docs/` as the GitHub Pages artifact. `https://projectsoulbytmb.github.io/project---soul/` serves the product-surface site from `main` (Home, Product, Download, Assist, Help, FAQ, Status, Legal).
- Publish the official hostname with `npx wrangler pages deploy docs --project-name=eidovara` (Cloudflare Pages project `eidovara`, custom domain `eidovara.org`). Keep the Worker API (`eidovara-api`) on a separate hostname. Wrangler is not an Eidovara runtime dependency. Never commit `CLOUDFLARE_API_TOKEN`.
- If Pages was never enabled: Settings → Pages → Source **GitHub Actions** (not “Deploy from a branch” unless you also change the workflow). GitHub enforces HTTPS on `*.github.io`.
- The site tells visitors: visit Home → read Product → confirm 18+ on Download → install the unsigned Windows Alpha or build with `npm run dist:win:installer` → the desktop app is the product → cloud is optional config/health only.
- Ask Eidovara is a website helper (`docs/knowledge.js`, `docs/assist.js`) with `script-src 'self'`. No API key. Optional Worker assist is visitor-paste only.
- Do not put `workers.dev` URLs in the public site as a required API. Operator-example Worker URLs belong in this owner guide only. Status and the helper fail closed when no base is pasted.
- Do not add `docs/CNAME`. GitHub Pages custom-domain files would fight the live Cloudflare zone for `eidovara.org`.

## 2. Public Windows download (GitHub Releases)

- User-facing installer (primary): `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.0-Windows-x64-Setup.exe`
- Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.19.0/Eidovara-0.19.0-Windows-x64-Setup.exe`
- Release notes / checksums: `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest`
- Official advertised artifact: Authenticode-**unsigned** Windows 10/11 x64 NSIS `Setup.exe`, 18+, about 101.3 MiB. Not Microsoft-certified, EV-signed, or SmartScreen-preapproved. SHA-256 `F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310` (also `SHA256SUMS.txt` on the GitHub Release). SmartScreen may warn. Users should verify checksums and GitHub/Sigstore provenance. There is no Authenticode claim. We cannot Authenticode-sign until the owner provides a certificate.
- Cloning the GitHub source repository is a secondary fallback (`npm run dist:win:installer` on Windows), not the primary download. Linux/macOS scripts are development targets, not official products.
- CI: `.github/workflows/release-windows.yml` runs on `windows-latest` for `v*` tags (publish) and `workflow_dispatch` (unsigned artifacts on a branch). It sets `CSC_IDENTITY_AUTO_DISCOVERY=false` and does **not** produce a signed installer. GitHub build provenance is not Authenticode.
- Local Windows build is always valid: `npm run dist:win:installer` then attach files per `docs/GITHUB_RELEASES.md` if Actions cannot run.

## 3. Optional Cloudflare Worker (`/health`, `/v1/config`, `/v1/status`, `/v1/assist`)

Source: `server/worker.js` plus `server/wrangler.toml` (`name = "eidovara-api"`). Fail-closed: GET `/health`, GET `/v1/config`, GET `/v1/status`; GET or POST `/v1/assist` (same allowlisted knowledge pack as the Pages helper). Other methods/paths 405/404. Payments stay empty (`paymentsEnabled: false`). Assist does **not** store transcripts and does **not** accept desktop conversation history. The desktop app ignores checkout even if a future config lied.

1. Create a Cloudflare account and enable Workers Free.
2. From `server/`, authenticate with `npx wrangler login` or export `CLOUDFLARE_API_TOKEN` in your own shell. Never commit the token.
3. Deploy with `npx wrangler deploy`. Wrangler is not an Eidovara runtime dependency.
4. Copy the generated HTTPS **base** URL (no path) into Eidovara **Settings → Eidovara service** and **Connect**, or the private Ctrl+A panel **Soul HTTPS service**, then **Test service**. After the 18+ gate the app requests `{base}/health`, `{base}/v1/config`, and `{base}/v1/status`. Health JSON is `{ "service": "Eidovara", "status": "ok", "version": "0.19.1" }`. If those requests fail, Offline Soul continues locally. The public site’s Ask Eidovara widget can `POST {base}/v1/assist` after a visitor pastes the same base; if that fetch fails, the on-page knowledge pack still answers.
5. `/v1/config` returns the public website URL and optional provider-hosted checkout links. Leave Stripe/PayPal/Gumroad empty until a real store exists.

The desktop product and the public HTML/JS never hard-code `workers.dev`. Users do not need a Worker URL. Ask Eidovara on eidovara.org and GitHub Pages works with zero secrets via `docs/knowledge.js`.

Operator example (operator paste only, not a user-required server, not compiled into the app): `https://api.eidovara.org` and `https://eidovara-api.dreambot333.workers.dev` currently serve `/health`, `/v1/config`, `/v1/status`, and `/v1/assist` on Workers Free **after** you re-deploy `worker.js` from `main` (`npx wrangler deploy`). A live Worker can drift behind git until that command runs.

## 4. Custom domain (already on Cloudflare Pages)

Keep the marketing site and the Worker on separate hostnames. This is the same `docs/` product, not a second site.

**Website (Cloudflare Pages project `eidovara`)**

1. Apex `eidovara.org` is already attached to project `eidovara` (`eidovara.pages.dev`). Publish with `npx wrangler pages deploy docs --project-name=eidovara`.
2. Do **not** set GitHub → Settings → Pages → Custom domain to `eidovara.org` and do **not** add `docs/CNAME`. That would fight this Cloudflare zone.
3. `www.eidovara.org` still needs an owner DNS click: CNAME `www` → `eidovara.pages.dev` (proxied).
4. `server/wrangler.toml` `WEBSITE_URL` should be `https://eidovara.org/` so `/v1/config` points at the official site after `npx wrangler deploy`.

**Worker (API)**

1. Keep `eidovara-api` off the marketing hostname. Custom hostname `api.eidovara.org` is operator-paste only.
2. Paste that HTTPS **base** (no path) into Settings → Eidovara service or Ctrl+A **Test service**. Still do not hard-code it in the app.

## Payment management (still off)

Use a provider-hosted checkout so Soul never receives payment-card data:

- Stripe: create a product and Payment Link in the Stripe Dashboard.
- PayPal: use a Business account to create a Payment Link or Buy Button.
- Gumroad: create a digital software product and use its public checkout URL.

Complete the provider’s identity, business, payout, tax, refund, and dispute configuration yourself. Test the provider’s sandbox or test mode before accepting real payments. Do not paste secret/API keys into the website, app store URL, Worker variables, issues, or commits.

Open Eidovara’s private administrator panel with Ctrl+A, enter the local administrator password, paste the provider’s public `https://` checkout URL into **Secure store / payment page**, and save. Free users then see **View Eidovara Premium** in Settings. The link opens in their system browser.

v0.19.0 does not sell Premium. Leave Worker store URLs empty.

## Required customer-facing decisions before selling

Before selling, publish the final price, license scope, refund/cancellation policy, support contact, privacy notice, and applicable tax treatment. Do not describe the project as PCI certified, legally certified, government approved, Authenticode-signed, or guaranteed secure unless a qualified independent authority has actually issued that result.
