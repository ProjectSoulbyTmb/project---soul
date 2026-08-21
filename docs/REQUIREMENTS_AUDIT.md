# Eidovara / Soul requirements audit

Updated: 2026-08-21

## Product purpose — intact and modular

Eidovara is the modular Windows workspace; Soul remains its optional adaptive assistant personality. Applications, gaming controls, media, entertainment, appearance, backups, diagnostics, and updates remain useful without a connected model. Soul's protected identity, local continuity, reviewable memory, configurable tone/focus/autonomy, consent boundaries, and relationship model remain separate from the product and publishing identity. User-authored memories and setup text are treated as untrusted data, not system authority.

## Working in v0.19.0

| Area | Status | Evidence |
| --- | --- | --- |
| Conversation and Soul personality | Working | Offline provider uses setup roles, tone/length/language, memories, and workspace checklists; optional local/compatible providers; persistent conversations and context tests. |
| Memory and restart continuity | Working | Atomic JSON persistence, migrations, corrupt-state recovery, backup/restore, restart tests. |
| Safety, consent, and lawful-use boundaries | Working within documented scope | Illegal facilitation block/report locally; adult mode gates and revocable consent; no automatic external reporting claim. |
| Application age gate and adult avatar profile | Working within documented scope | App-wide local 18+ confirmation; Adult Mode requires local age of majority, enablement, and consent; bounded fictional-avatar profile controls. No photorealistic or anatomical model engine is bundled. |
| Internet research and media discovery | Working | Explicit internet/web/online request detection; local mood/mix/apps/gaming/study/stream intents do not fire Wikipedia; public sources, optional Premium keyed search, citations, image/audio/video result handling. |
| Media player and DJ helpers | Working | Audio/video dock, local `eidovara-media://` playback of user-selected files, confirm-first playback unless the user just picked a file, queue controls, persistent taste signals, favorites, similar-search prompts, and consent-based Spotify/YouTube HTTPS handoff. |
| Windows app workspace | Working | User-selected `.exe`/`.lnk` shelf, Start Menu discovery, and a Windows confirm dialog before launch; no process injection. Free max 3 apps. |
| Companion and accessibility | Working | Hideable 2D/3D-styled CSS avatar, motion controls, installed Windows voices, optional narration and detected dictation. Neural TTS/VRM not bundled. Persistent Soul dock (presence, heartbeat, modules, quick actions) after 18+. |
| In-app Soul kernel | Working after 18+ | Session kernel with workspace intent routing, local self-model JSON, feature-module registry (`register({ id, title, enabled, commands, ui? })`), OS `speechSynthesis` voices, CSS/canvas/local-image presence, Soul-online helper default off. Offline kernel remains source of truth. Assist is not Soul. |
| Optional streaming help | Working as planning/setup assistance | OBS URL/goals stored locally and omitted from remote model context; direct OBS control is not claimed. |
| Appearance and gaming mode | Working | Colors, opacity, Premium RGB, low-overhead mode (Eidovara visuals only), GPU/media diagnostics. |
| Conversation engines | Working | Offline Soul engine; optional loopback Ollama `/api/chat`; Premium HTTPS OpenAI-compatible `/chat/completions`; Chromium media/GPU engine. |
| HTTPS service | Working with official default | Cloudflare Worker `/v1/health` (and `/health`), `/v1/config`, `/v1/status`; Settings Connect plus Ctrl+A Test service; launch retry after 18+; baked default `https://api.eidovara.org` (overridable); no `workers.dev` hard-code in the app; fetch failure stays local-first. Website helper may `GET`/`POST /v1/assist` after a visitor-saved HTTPS base. Desktop `/v1/assist` is a separate opt-in (default off) and never sends conversations. Payments stay fail-closed. |
| Updates and releases | Working | GitHub manifest, HTTPS, SHA-256 verification, explicit install approval, Windows installer/portable build. |
| Privacy/security/legal surfaces | Working | In-app links, website trust center, privacy/terms/security/licensing notices, SBOM/checksums/provenance. |
| Free/Premium product gates | Working for product testing | Provider/search/app/theme gates exist; local admin selector is not payment enforcement. |
| Website | Live on eidovara.org plus github.io from `main` | Complete `docs/` marketing site (Home, Product, Download, Assist, Help, FAQ, Status, Legal, 404, robots/sitemap, Ask Eidovara). Cloudflare Pages project `eidovara` serves `https://eidovara.org/`. GitHub Pages also publishes `docs/` from `main` via `pages.yml` (HTTPS). Mirror: `https://projectsoulbytmb.github.io/project---soul/`. Do not add `docs/CNAME`. |
| Public Windows download | Working | Primary CTA is `releases/latest/download/Eidovara-0.19.0-Windows-x64-Setup.exe` (official unsigned NSIS `.exe`, ~101.3 MiB, 18+ gate on Download). SHA-256 `EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711`. `/releases/latest` remains the notes/checksums page. Source repo is secondary. Tag workflow on `windows-latest`; `workflow_dispatch` uploads unsigned artifacts only. `v0.18.0`, `v0.18.1`, `v0.18.2`, and `v0.18.3` remain published and must not be moved. |
| Optional Worker | Working when deployed | `/health`, `/v1/health`, `/v1/config`, `/v1/status`, and `/v1/assist` fail-closed; payments empty; Settings Connect + launch retry after 18+ against `https://api.eidovara.org` by default; website assist is paste/save-only; desktop assist is default + explicit opt-in; not required to run the app; no `workers.dev` hard-code. Redeploy with `npx wrangler deploy` after merge so the live Worker does not drift. Neural TTS/VRM/OBS/live payments stay documented only. |

## Owner clicks git cannot finish

| Problem | Solution path |
| --- | --- |
| Dependency review CI fails (“Dependency graph” off) | Settings → Code security → enable Dependency graph. Keep `.github/workflows/dependency-review.yml`. |
| Windows `v0.19.0` Release | Push tag `v0.19.0` on current `main` (do not move `v0.18.0`, `v0.18.1`, or `v0.18.2`). `Release Windows` publishes unsigned Setup.exe. Site CTAs use `releases/latest/download/Eidovara-0.19.0-Windows-x64-Setup.exe`. |
| Deployed Worker lags git | From `server/`, `npx wrangler deploy` after login/token. Never commit the token. |

## Not yet production-complete

| Area | Required next dependency |
| --- | --- |
| Automatic paid Premium activation | Payment account, signed webhooks, D1/KV entitlement store, server signing key, activation UI, cancellation/refund tests. |
| Stable public API | Select or keep a Cloudflare `workers.dev` account subdomain, deploy `server/worker.js` with Wrangler, paste the HTTPS base into Settings → Eidovara service, monitor `/health`. Not auto-deployed from this repository. |
| Branded permanent domain | Apex `eidovara.org` is live on Cloudflare Pages. Owner still needs DNS for `www.eidovara.org` (CNAME `www` → `eidovara.pages.dev`) and must keep renewals/security controls. |
| Authenticode reputation | Obtain an organization/individual code-signing certificate or trusted signing service; current release is explicitly unsigned. |
| Native neural voice/model packs | Pin exact runtimes/assets only after per-model license, provenance, consent, hash, and sandbox review. |
| Real 3D imported characters | Add a reviewed VRM renderer and asset permission flow; current 3D option is CSS-styled, not a skeletal 3D model engine. |
| Direct OBS automation | Implement authenticated local obs-websocket adapter with least privilege and explicit user commands. |
| Patent/trademark/company registration | Government filings and professional clearance; repository notices do not replace them. |

## Release decision

v0.19.0 is suitable as a transparent alpha/free consumer release. It should not be represented as a fully deployed paid service, patented product, registered mark, formed company, certified legal-compliance system, perfect security system, scientifically proven consciousness, universally compatible application controller, or Authenticode-signed binary.
