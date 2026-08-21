# Eidovara / Soul requirements audit

Updated: 2026-08-20

## Product purpose — intact and modular

Eidovara is the modular Windows workspace; Soul remains its optional adaptive assistant personality. Applications, gaming controls, media, entertainment, appearance, backups, diagnostics, and updates remain useful without a connected model. Soul's protected identity, local continuity, reviewable memory, configurable tone/focus/autonomy, consent boundaries, and relationship model remain separate from the product and publishing identity. User-authored memories and setup text are treated as untrusted data, not system authority.

## Working in v0.17.8

| Area | Status | Evidence |
| --- | --- | --- |
| Conversation and Soul personality | Working | Offline provider, optional local/compatible providers, persistent conversations and context tests. |
| Memory and restart continuity | Working | Atomic JSON persistence, migrations, corrupt-state recovery, backup/restore, restart tests. |
| Safety, consent, and lawful-use boundaries | Working within documented scope | Illegal facilitation block/report locally; adult mode gates and revocable consent; no automatic external reporting claim. |
| Internet research and media discovery | Working | Explicit-request detection, public sources, optional keyed search, citations, image/audio/video result handling. |
| Media player and DJ helpers | Working | Audio/video dock, queue controls, persistent taste signals, favorites, similar-search prompts, and consent-based Spotify/YouTube external search links. |
| Windows app workspace | Working | User-selected `.exe`/`.lnk` shelf and confirmation-based launching; no process injection. |
| Companion and accessibility | Working | Hideable 2D/3D-styled avatar, motion controls, installed Windows voices, optional narration and detected dictation. |
| Optional streaming help | Working as planning/setup assistance | OBS URL/goals stored locally and omitted from remote model context; direct OBS control is not claimed. |
| Appearance and gaming mode | Working | Colors, opacity, RGB option, low-overhead mode, GPU/media diagnostics. |
| Updates and releases | Working | GitHub manifest, HTTPS, SHA-256 verification, explicit install approval, Windows installer/portable build. |
| Privacy/security/legal surfaces | Working | In-app links, website trust center, privacy/terms/security/licensing notices, SBOM/checksums/provenance. |
| Free/Premium product gates | Working for product testing | Provider/search/app/theme gates exist; local admin selector is not payment enforcement. |
| Website | Working | GitHub Pages deployment with responsive product, trust, privacy, security, licensing, and terms pages. |

## Not yet production-complete

| Area | Required next dependency |
| --- | --- |
| Automatic paid Premium activation | Payment account, signed webhooks, D1/KV entitlement store, server signing key, activation UI, cancellation/refund tests. |
| Stable public API | Select the Cloudflare `workers.dev` account subdomain, deploy Worker, monitor `/health`, configure app service URL. |
| Branded permanent domain | Register an available domain in Tyler Michael Bosworth's account and maintain renewals/security controls. |
| Authenticode reputation | Obtain an organization/individual code-signing certificate or trusted signing service; current release is explicitly unsigned. |
| Native neural voice/model packs | Pin exact runtimes/assets only after per-model license, provenance, consent, hash, and sandbox review. |
| Real 3D imported characters | Add a reviewed VRM renderer and asset permission flow; current 3D option is CSS-styled, not a skeletal 3D model engine. |
| Direct OBS automation | Implement authenticated local obs-websocket adapter with least privilege and explicit user commands. |
| Patent/trademark/company registration | Government filings and professional clearance; repository notices do not replace them. |

## Release decision

v0.17.8 is suitable as a transparent alpha/free consumer release. It should not be represented as a fully deployed paid service, patented product, registered mark, formed company, certified legal-compliance system, perfect security system, scientifically proven consciousness, universally compatible application controller, or Authenticode-signed binary.
