# Eidovara live snapshot — v0.22.2

This is an operator note, not a consumer marketing page. It does not claim Authenticode signing, live checkout, official Linux/macOS products, patents, registered marks, or consciousness.

## What is live

| Surface | Status |
| --- | --- |
| `main` | Canonical source version is `0.22.2`. The published Windows release is also `0.22.2`. |
| GitHub Pages | `docs/` from **main only** via `.github/workflows/pages.yml`. Do not retarget Pages at a feature branch. Mirror: `https://projectsoulbytmb.github.io/project---soul/`. |
| Cloudflare Pages | Official consumer hostname `https://eidovara.org` (project `eidovara`, same `docs/` folder). Production also at `https://eidovara.pages.dev`. `.github/workflows/cloudflare-pages.yml` deploys `docs/` after website changes reach `main`; manual fallback remains `npx wrangler pages deploy docs --project-name=eidovara --branch=main`. Worker API stays separate (`eidovara-api`, `https://api.eidovara.org`) and fail-closed. Do not add `docs/CNAME` because the Cloudflare zone owns the public hostname. |
| Cloudflare Worker | Wrangler name `eidovara-api`. Public GET `/health`, `/v1/config`, `/v1/status`; GET/POST `/v1/assist`. Fail-closed otherwise. Payments stay off. Custom hostname `https://api.eidovara.org`. Redeploy from `server/` after Worker contract/version changes. Health/config/status source version and live installer version are `0.22.2`. `WEBSITE_URL` is `https://eidovara.org/`. |
| Windows installer | Tag `v0.22.2` publishes unsigned `Eidovara-0.22.2-Windows-x64-Setup.exe` (106,691,429 bytes, about 101.75 MiB). Primary site CTA is `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.22.2-Windows-x64-Setup.exe`. Pinned asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.22.2/Eidovara-0.22.2-Windows-x64-Setup.exe`. SHA-256 `A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE`. Authenticode-unsigned; GitHub/Sigstore provenance is not Authenticode. Historical tags must not be force-moved. |

Desktop app id stays `com.soulconsciousnessstudios.eidovara`. The official service default is `https://api.eidovara.org` (HTTPS base only). Settings → Eidovara service still accepts another HTTPS base as an override; empty/default resolves to the official host. No `workers.dev` host is compiled into the Electron app or public site JS. Conversations are not sent automatically.

## Official site (HTTPS eidovara.org)

Cloudflare Pages project `eidovara` serves the same `docs/` information architecture as GitHub Pages. The current product surface should identify v0.22.2 as the published Windows release while keeping the consumer site restrained around Adult-mode functionality.

Expected public pages:

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

`/download/windows` must 302 to `/download.html` so the 18+ confirmation remains in front of the installer rather than redirecting directly to a raw `.exe`. Nested 404s keep site assets working through the configured base URL.

Public release facts that must remain consistent across Home, Product, Download, Status, FAQ/help, release metadata, and tests:

- version `0.22.2`
- `Eidovara-0.22.2-Windows-x64-Setup.exe`
- 106,691,429 bytes / about 101.75 MiB
- SHA-256 `A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE`
- Authenticode-unsigned
- GitHub/Sigstore provenance available
- Windows 10/11 x64
- 18+ gate remains
- payments remain fail-closed / no live checkout

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

Do not add a GitHub Pages custom-domain CNAME for `eidovara.org`; Cloudflare Pages owns the official domain.

Ask Eidovara works from `docs/knowledge.js` without requiring a Worker URL. Status uses `https://api.eidovara.org` for `/health` and `/v1/status`. Optional `/v1/assist` remains fail-closed until the visitor explicitly enables the relevant connection path.

## Worker contract

`server/worker.js` must stay compatible with `src/core/service.js` and `docs/assist.js`:

- Desktop service/status: GET `/health`, `/v1/config`, `/v1/status` (HTTPS except allowed loopback development). Default base `https://api.eidovara.org`. Conversations are not sent by the heartbeat.
- Website helper: optional POST `/v1/assist` only through explicit use. It must not accept full history / messages / conversations as an automatic transcript surface.
- `/v1/config` keeps `paymentsEnabled: false`, `checkoutEnabled: false`, `authenticodeSigned: false`, `minimumAge: 18`, and no live store URLs.
- Other methods/paths remain fail-closed with 405 / 404 behavior.

Never commit Cloudflare credentials. The Cloudflare Pages workflow expects repository/environment secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Remaining owner/environment actions

Git cannot manufacture external credentials or legal filings. Keep these truthful:

1. **Cloudflare deployment credentials** — `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must exist in the GitHub production environment/repository for automatic `eidovara.org` deployment. If unavailable, use the manual Wrangler Pages deployment from an authenticated owner environment.
2. **Worker deployment** — redeploy `server/` when its source contract changes so `api.eidovara.org` does not drift from desktop/site expectations.
3. **www.eidovara.org DNS** — optional; configure in Cloudflare only if the `www` hostname is desired. Do not point GitHub Pages at the public hostname.
4. **Authenticode certificate** — official installers remain unsigned until the owner obtains a real code-signing identity outside the repository. Do not claim Microsoft certification.
5. **Live payments / company filings** — remain separate owner/legal actions. Do not enable checkout by code or copy alone.

## Honest cannot-ship

Leave documented, do not fake: live payments, Authenticode, official Linux/macOS product status unless separately built/tested/released, scientific consciousness claims, or third-party certifications/registrations that have not actually occurred.
