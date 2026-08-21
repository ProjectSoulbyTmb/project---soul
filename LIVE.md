# Eidovara live snapshot (post PR #10)

This is an operator note, not a consumer marketing page. It does not claim Authenticode signing, live checkout, official Linux/macOS products, patents, registered marks, or consciousness.

## What is live

| Surface | Status |
| --- | --- |
| `main` | PR #10 (`cursor/engine-product-surface-c180`) merged. Merge commit: `394cf3a287fa6fc665aed7568201e93df4165884`. Later `0.18.1` commits may sit on top of that merge. |
| GitHub Pages | `docs/` from **main only** via `.github/workflows/pages.yml`. Do not retarget Pages at a feature branch. Do not invent a second production site. |
| Cloudflare Worker | Wrangler name `eidovara-api`. Public GET `/health`, `/v1/config`, `/v1/status`; GET/POST `/v1/assist`. Fail-closed otherwise. Payments stay off. Redeploy with `npx wrangler deploy` from `server/` after Worker changes. |
| Windows installer | Tag `v0.18.1` is published. Primary consumer download is `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.18.1/Eidovara-0.18.1-Windows-x64-Setup.exe` (the `.exe`, not the source tree). SHA-256 `A7221E7781CEAD32F50E30FABE429092EC77826A5E8878E80D949D754A9404A9`. Authenticode-unsigned; GitHub/Sigstore provenance is not Authenticode. Tag `v0.18.0` remains the older-main installer and must not be force-moved. |

Desktop app id stays `com.soulconsciousnessstudios.eidovara`. No `workers.dev` host is compiled into the Electron app or public site JS. Paste the HTTPS Worker **base** into Settings → Eidovara service (or Ctrl+A Test service) and, optionally, the website Status / Ask Eidovara fields.

## Pages URLs (HTTPS github.io)

After the PR #10 Pages workflow succeeded, these returned HTTP 200:

- https://projectsoulbytmb.github.io/project---soul/
- https://projectsoulbytmb.github.io/project---soul/index.html
- https://projectsoulbytmb.github.io/project---soul/download.html
- https://projectsoulbytmb.github.io/project---soul/assist.html
- https://projectsoulbytmb.github.io/project---soul/product.html
- https://projectsoulbytmb.github.io/project---soul/legal.html
- https://projectsoulbytmb.github.io/project---soul/status.html
- https://projectsoulbytmb.github.io/project---soul/help.html
- https://projectsoulbytmb.github.io/project---soul/faq.html

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
2. **Worker paste / optional custom domain** — Paste the HTTPS Worker **base** into Settings → Eidovara service after a deploy. Optional Cloudflare / GitHub Pages custom domain; still do not hard-code the API host in the app.
3. **Authenticode / live payments / company filings** — remain cannot-ship. Do not enable live checkout. The published Windows file is the official unsigned installer, not Microsoft-certified.

## Honest cannot-ship

Leave documented, do not fake: live payments, Authenticode, official Linux/macOS product, neural TTS / VRM / OBS websocket, scientific consciousness claims.
