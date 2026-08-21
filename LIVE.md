# Eidovara live snapshot (post PR #10)

This is an operator note, not a consumer marketing page. It does not claim Authenticode signing, live checkout, official Linux/macOS products, patents, registered marks, or consciousness.

## What is live

| Surface | Status |
| --- | --- |
| `main` | PR #10 (`cursor/engine-product-surface-c180`) merged. Merge commit: `394cf3a287fa6fc665aed7568201e93df4165884`. Current product version on this snapshot is `0.18.2`. |
| GitHub Pages | `docs/` from **main only** via `.github/workflows/pages.yml`. Do not retarget Pages at a feature branch. Do not invent a second production site. Mirror: `https://projectsoulbytmb.github.io/project---soul/`. |
| Cloudflare Pages | Official consumer hostname `https://eidovara.org` (project `eidovara`, same `docs/` folder). Production also at `https://eidovara.pages.dev`. Redeploy with `npx wrangler pages deploy docs --project-name=eidovara`. Worker API stays separate (`eidovara-api`, `https://api.eidovara.org`) and fail-closed. Do not add `docs/CNAME` — a GitHub Pages custom-domain file would fight this Cloudflare zone. `www.eidovara.org` has no DNS record yet. |
| Cloudflare Worker | Wrangler name `eidovara-api`. Public GET `/health`, `/v1/config`, `/v1/status`; GET/POST `/v1/assist`. Fail-closed otherwise. Payments stay off. Custom hostname `https://api.eidovara.org`. Redeploy with `npx wrangler deploy` from `server/` after Worker `version` changes. Health JSON version is `0.18.2`. `WEBSITE_URL` is `https://eidovara.org/`. |
| Windows installer | Tag `v0.18.2` publishes unsigned `Eidovara-0.18.2-Windows-x64-Setup.exe` (~101.3 MiB). Primary site CTA is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.2-Windows-x64-Setup.exe`. Pinned tag asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.2/Eidovara-0.18.2-Windows-x64-Setup.exe`. SHA-256 `EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711`. Authenticode-unsigned; GitHub/Sigstore provenance is not Authenticode. Tags `v0.18.0` and `v0.18.1` already exist and must not be force-moved. |

Desktop app id stays `com.soulconsciousnessstudios.eidovara`. The official service default is `https://api.eidovara.org` (HTTPS base only). Settings → Eidovara service (or Ctrl+A Test service) still accepts another HTTPS base as an override; empty/default resolves to the official host. No `workers.dev` host is compiled into the Electron app or public site JS. Ask Eidovara `/v1/assist` stays paste/save-only. Conversations are not sent.

## Official site (HTTPS eidovara.org)

Cloudflare Pages project `eidovara` serves the same `docs/` IA as GitHub Pages. After `npx wrangler pages deploy docs --project-name=eidovara`, these should return HTTP 200 with the v0.18.2 product surface (not the retired Ask Soul homepage):

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

`/download/windows` must 302 to `/download.html` (18+ gate), not to a raw `.exe`. Nested 404s use `<base href="https://eidovara.org/">`.

## Pages URLs (HTTPS github.io mirror)

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

Ask Eidovara works from `docs/knowledge.js` with no Worker URL. Status prefills `https://api.eidovara.org` for `/health` and `/v1/status`. Optional `/v1/assist` stays fail-closed until a visitor saves an HTTPS base.

## Worker contract

`server/worker.js` must stay compatible with `src/core/service.js` and `docs/assist.js`:

- Desktop Connect / launch / Ctrl+A Test service: GET `/health`, `/v1/config`, `/v1/status` (HTTPS except loopback). Default base `https://api.eidovara.org`. Conversations are not sent.
- Website helper: optional POST `/v1/assist` after a pasted base. GET `/v1/assist` is metadata or `?q=`. Does not accept `history` / `messages` / `conversations`.
- `/v1/config` keeps `paymentsEnabled: false`, `checkoutEnabled: false`, `authenticodeSigned: false`, `minimumAge: 18`, empty store URLs.
- Other methods/paths: 405 / 404.

Operator paste example (not baked into the app or public JS): see [docs/PAYMENTS_AND_SITE.md](docs/PAYMENTS_AND_SITE.md). Never commit `CLOUDFLARE_API_TOKEN`.

## Remaining owner clicks

Git cannot finish these:

1. **Dependency graph** — Settings → Code security → enable Dependency graph (`https://github.com/ProjectSoulbyTmb/project---soul/settings/security_analysis`). Keep `.github/workflows/dependency-review.yml` at `fail-on-severity: moderate`. Do not weaken it.
2. **Official API default** — Desktop already defaults to `https://api.eidovara.org`. After `npx wrangler deploy` from `server/`, Connect / launch / Test service hit that host unless overridden. Do not compile a `workers.dev` host. Ask Eidovara `/v1/assist` still needs a saved HTTPS base.
3. **www.eidovara.org DNS** — Apex `eidovara.org` is already a Cloudflare Pages custom domain. `www` does not resolve. Owner click: Cloudflare Dashboard → Pages → `eidovara` → Custom domains → add `www.eidovara.org` if needed, and DNS CNAME `www` → `eidovara.pages.dev` (proxied). Do not point GitHub Pages at this hostname (no `docs/CNAME`).
4. **Authenticode certificate** — Official advertised installers stay unsigned until the owner obtains a code-signing identity outside this repository. Do not claim Microsoft certification.
5. **Live payments / company filings** — remain cannot-ship. Do not enable live checkout.

## Honest cannot-ship

Leave documented, do not fake: live payments, Authenticode, official Linux/macOS product, neural TTS / VRM / OBS websocket, scientific consciousness claims.
