# Eidovara live snapshot — v1.0.0

This is an operator note, not a consumer marketing page. It does not claim Authenticode signing, live checkout, official Linux/macOS products, patents, registered marks, or consciousness.

## What is live

| Surface           | Status                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`            | Canonical source version is `1.0.0`. The published Windows release is also `1.0.0`.                                                                                                                                                                               |
| GitHub Pages      | `docs/` from **main only** via `.github/workflows/pages.yml`. Mirror: `https://projectsoulbytmb.github.io/project---soul/`.                                                                                                                                       |
| Cloudflare Pages  | Official consumer hostname `https://eidovara.org` (project `eidovara`, same `docs/` folder). `.github/workflows/cloudflare-pages.yml` deploys `docs/` after website changes reach `main` when production credentials are available.                               |
| Cloudflare Worker | Wrangler name `eidovara-api`. Public GET `/health`, `/v1/config`, `/v1/status`; GET/POST `/v1/assist`. Fail-closed otherwise. Payments stay off. Health/config/status source version and live installer version are `1.0.0`.                                      |
| Windows installer | Tag `v1.0.0` publishes unsigned `Eidovara-v1.0.0-Windows-x64-Setup.exe`; its measured size and SHA-256 land in the release’s SHA256SUMS.txt and latest.yml when CI builds it. SHA-256 `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`. Authenticode-unsigned; GitHub/Sigstore provenance is not Authenticode. |
| Edition           | v1.0.0 is a full free Alpha. Currently implemented features are not blocked by paid entitlement; live checkout/subscription processing remains off.                                                                                                               |

Desktop app id stays `com.soulconsciousnessstudios.eidovara`. The official service default is `https://api.eidovara.org` (HTTPS base only). Settings → Eidovara service accepts another HTTPS base as an override. Conversations are not sent automatically.

## Official site (HTTPS eidovara.org)

Cloudflare Pages project `eidovara` serves the same `docs/` information architecture as GitHub Pages. The current product surface should identify **v1.0.0** as the published Windows release while keeping the consumer site restrained around Adult-mode functionality.

Expected public pages include Home, Download, Assist, Product, Legal, Status, Help, FAQ, and their GitHub Pages mirror equivalents.

`/download/windows` must route through `/download.html` so the 18+ confirmation remains in front of the installer rather than redirecting directly to a raw `.exe`.

## Official release facts that must remain consistent across Home, Product, Download, Status, FAQ/help, helper knowledge, Worker/service payloads, release metadata, and tests:

- version `1.0.0`
- installer `Eidovara-v1.0.0-Windows-x64-Setup.exe`
- Measured installer size / SHA-256: recorded per tagged build in SHA256SUMS.txt + latest.yml (no v1.0.0 artifact exists yet).
- Authenticode-unsigned
- GitHub/Sigstore provenance available
- Windows 10/11 x64
- 18+ gate remains
- v1.0.0 is a full free Alpha
- payments remain fail-closed / no live checkout

## Worker contract

`server/worker.js` must stay compatible with `src/core/service.js` and `docs/assist.js`:

- Desktop service/status: GET `/health`, `/v1/config`, `/v1/status`.
- Website helper: optional POST `/v1/assist` only through explicit use; it must not accept desktop conversation history as an automatic transcript surface.
- `/v1/config` keeps `paymentsEnabled: false`, `checkoutEnabled: false`, `authenticodeSigned: false`, `minimumAge: 18`, and no live store URLs.
- Current payloads must identify release/source `1.0.0` and the final v1.0.0 installer facts above.
- Other methods/paths remain fail-closed with 405 / 404 behavior.

Never commit Cloudflare credentials. The Cloudflare Pages workflow expects secure credentials named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` when automatic production deployment is used.

## Remaining owner/environment actions

External credentials or legal filings cannot be manufactured in git. Keep these truthful:

1. Cloudflare deployment credentials must be available to the production workflow, or deployment must be performed from an authenticated owner environment.
2. Redeploy `server/` when its source contract changes so `api.eidovara.org` does not drift from desktop/site expectations. After each release build, publish the measured installer facts from `dist/LIVE-INSTALLER-FACTS.json` as Worker vars (`LIVE_INSTALLER_SHA256`, `LIVE_INSTALLER_SIZE`) so `/v1/config` stops reporting null checksums; see `server/README.md`. Never hardcode a digest from an older build into the Worker source.
3. Configure optional `www.eidovara.org` in Cloudflare only if desired.
4. Official installers remain Authenticode-unsigned until a real code-signing identity exists.
5. Live payments/company filings remain separate future actions and must not be implied by product copy.

## Historical-version rule

Older releases may remain in `CHANGELOG.md`, old GitHub tags/releases, or immutable git history as historical evidence. No current-facing website, README, live-state, helper, Worker/service, installer, updater, or release-policy statement should identify v0.22.2 as the current product. The current release is v1.0.0.
