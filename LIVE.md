# Eidovara live snapshot (post PR #10)

This is an operator note, not a consumer marketing page. It does not claim Authenticode signing, live checkout, official Linux/macOS products, patents, registered marks, or consciousness.

## What is live

| Surface | Status |
| --- | --- |
| `main` | PR #10 (`cursor/engine-product-surface-c180`) merged. Merge commit: `394cf3a287fa6fc665aed7568201e93df4165884`. Current product version on this snapshot is `0.18.2`. |
| GitHub Pages | `docs/` from **main only** via `.github/workflows/pages.yml`. Do not retarget Pages at a feature branch. Do not invent a second production site. Live: `https://projectsoulbytmb.github.io/project---soul/`. |
| Cloudflare Pages | Project name `eidovara`. Same `docs/` as GitHub Pages (not a second product). Production `https://eidovara.pages.dev`. Custom domain `https://eidovara.org/` is attached and serving Home, Product, Download (18+), Assist, FAQ, Help, Legal, Status, and 404. Redeploy with `npx wrangler pages deploy docs --project-name=eidovara --branch=main`. |
| Cloudflare Worker | Wrangler name `eidovara-api`. Public GET `/health`, `/v1/config`, `/v1/status`; GET/POST `/v1/assist`. Fail-closed otherwise. Payments stay off. Custom hostname `https://api.eidovara.org`. Redeploy with `npx wrangler deploy` from `server/` after Worker `version` changes. Health JSON version is `0.18.2`. `WEBSITE_URL` is `https://eidovara.org/`. |
| Windows installer | Tag `v0.18.2` publishes unsigned `Eidovara-0.18.2-Windows-x64-Setup.exe` (~101.3 MiB). Primary site CTA is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.2-Windows-x64-Setup.exe`. Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.2/Eidovara-0.18.2-Windows-x64-Setup.exe`. SHA-256 `EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711`. Authenticode-unsigned; GitHub/Sigstore provenance is not Authenticode. Tags `v0.18.0` and `v0.18.1` already exist and must not be force-moved. |

Desktop app id stays `com.soulconsciousnessstudios.eidovara`. No `workers.dev` host is compiled into the Electron app or public site JS. Paste the HTTPS Worker **base** into Settings → Eidovara service (or Ctrl+A Test service) and, optionally, the website Status / Ask Eidovara fields.

## Pages URLs

Cloudflare Pages custom domain (HTTP 200 after `docs/` deploy to project `eidovara`):

- https://eidovara.org/
- https://eidovara.org/index.html
- https://eidovara.org/download.html
- https://eidovara.org/assist.html
- https://eidovara.org/product.html
- https://eidovara.org/legal.html
- https://eidovara.org/status.html
- https://eidovara.org/help.html
- https://eidovara.org/faq.html
- https://eidovara.pages.dev/

GitHub Pages mirror (same `docs/` from `main`):

- https://projectsoulbytmb.github.io/project---soul/
- https://projectsoulbytmb.github.io/project---soul/index.html
- https://projectsoulbytmb.github.io/project---soul/download.html
- https://projectsoulbytmb.github.io/project---soul/assist.html
- https://projectsoulbytmb.github.io/project---soul/product.html
- https://projectsoulbytmb.github.io/project---soul/legal.html
- https://projectsoulbytmb.github.io/project---soul/status.html
- https://projectsoulbytmb.github.io/project---soul/help.html
- https://projectsoulbytmb.github.io/project---soul/faq.html

`www.eidovara.org` is added on the Pages project but still pending a proxied CNAME `www` → `eidovara.pages.dev` (DNS write is owner-only for this API token).

Ask Eidovara works from `docs/knowledge.js` with no Worker URL. Status and optional `/v1/assist` stay fail-closed until a visitor pastes an HTTPS base.

## Worker contract

`server/worker.js` must stay compatible with `src/core/service.js` and `docs/assist.js`:

- Desktop Connect / launch / Ctrl+A Test service: GET `/health`, `/v1/config`, `/v1/status` (HTTPS except loopback). Conversations are not sent.
- Website helper: optional POST `/v1/assist` after a pasted base. GET `/v1/assist` is metadata or `?q=`. Does not accept `history` / `messages` / `conversations`.
- `/v1/config` keeps `paymentsEnabled: false`, `checkoutEnabled: false`, `authenticodeSigned: false`, `minimumAge: 18`, empty store URLs.
- Other methods/paths: 405 / 404.

Operator paste example (not baked into the app or public JS): see [docs/PAYMENTS_AND_SITE.md](docs/PAYMENTS_AND_SITE.md). Never commit `CLOUDFLARE_API_TOKEN`.

## Remaining owner clicks

Git cannot finish these:

1. **Dependency graph** — Settings → Code security → enable Dependency graph (`https://github.com/ProjectSoulbyTmb/project---soul/settings/security_analysis`). Keep `.github/workflows/dependency-review.yml` at `fail-on-severity: moderate`. Do not weaken it.
2. **Paste Worker base / www DNS** — After `npx wrangler deploy` from `server/`, paste the HTTPS Worker **base** (`https://api.eidovara.org` or the workers.dev host) into Settings → Eidovara service. Still do not hard-code the API host in the app. Apex `eidovara.org` is already attached to Cloudflare Pages project `eidovara`. `www.eidovara.org` still needs an owner DNS CNAME `www` → `eidovara.pages.dev` (proxied); this token cannot write DNS records or finish that TLS hostname.
3. **Authenticode certificate** — Official advertised installers stay unsigned until the owner obtains a code-signing identity outside this repository. Do not claim Microsoft certification.
4. **Live payments / company filings** — remain cannot-ship. Do not enable live checkout.

## Honest cannot-ship

Leave documented, do not fake: live payments, Authenticode, official Linux/macOS product, neural TTS / VRM / OBS websocket, scientific consciousness claims.
