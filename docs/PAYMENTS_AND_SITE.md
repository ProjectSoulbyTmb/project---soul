# Owner runbook: public website, Windows download, Worker, and payments

Eidovara v0.22.2 is the current **local-first Windows desktop release**. Making it online for users means a public HTTPS website, the published Windows installer, optional service health/config/status, user-directed internet research/media/provider access, and update delivery. It does **not** mean hosting everyone’s Soul, conversations, or memories in a central account service.

Do not commit API tokens, Wrangler credentials, signing keys, payment secrets, or private agreements.

## Current v0.22.2 live facts

| Surface | Current state |
| --- | --- |
| Source | `main` is v0.22.2. |
| Windows release | GitHub Release `v0.22.2`, installer `Eidovara-0.22.2-Windows-x64-Setup.exe`. |
| Installer size | 106,691,524 bytes (about 101.75 MiB). |
| Installer SHA-256 | `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`. |
| Signing | Authenticode-unsigned. GitHub/Sigstore provenance is available and is not Authenticode. |
| Edition | Full free v0.22.2 Alpha; no paid entitlement is required for implemented features. |
| Official website | `https://eidovara.org/`, Cloudflare Pages project `eidovara`, source `docs/`. |
| GitHub Pages mirror | `https://projectsoulbytmb.github.io/project---soul/`, same `docs/` from `main`. |
| Official service default | `https://api.eidovara.org`. |
| Worker contract | `/health`, `/v1/health`, `/v1/config`, `/v1/status`, `/v1/assist`; fail closed otherwise. |
| Payments | Disabled. No live checkout, subscription, or paid entitlement. |

## 1. Website publication

Source is `docs/` on `main`.

- GitHub Pages publishes the `docs/` mirror from `main` through `.github/workflows/pages.yml`.
- `.github/workflows/cloudflare-pages.yml` is the production Cloudflare Pages path for `eidovara.org` and deploys `docs/` to project `eidovara` when the required production credentials are available to GitHub Actions.
- Manual Cloudflare Pages fallback: `npx wrangler pages deploy docs --project-name=eidovara --branch=main`.
- Do not add `docs/CNAME`; the public hostname is owned by the Cloudflare Pages zone, not GitHub Pages.
- Keep `eidovara.org` (website) and `api.eidovara.org` (service) separate.
- Website updates are not complete until Home, Product, Download, Assist, Help, FAQ, Status, legal pages, `docs/knowledge.js`, and the live service payload all agree on the same v0.22.2 release facts.

If a live browser still shows older data after `main` is correct, check the actual Cloudflare deployment and edge/browser cache before changing correct source files.

## 2. Current Windows download

- Primary: `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.22.2-Windows-x64-Setup.exe`
- Pinned: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v0.22.2/Eidovara-0.22.2-Windows-x64-Setup.exe`
- Release page: `https://github.com/ProjectSoulbyTmb/project---soul/releases/tag/v0.22.2`
- Size: 106,691,524 bytes (about 101.75 MiB)
- SHA-256: `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`
- Platform: Windows 10/11 x64, 18+
- Status: Authenticode-unsigned; Windows SmartScreen may warn

Users should download the Setup.exe from GitHub Releases and verify the measured checksum/provenance. The source repository is a secondary build path, not the primary installer download.

## 3. Release workflow

`.github/workflows/release-windows.yml` builds Windows releases on `windows-latest`, runs automated tests/checks/smoke tests, packages NSIS, runs an installed-app smoke test, produces updater metadata, checksums, SBOM, release evidence, and provenance, then publishes assets only for a matching `v*` tag. Published assets are immutable; an existing tag must not be reused to replace release bytes.

Local Windows build fallback:

```powershell
npm install
npm test
npm run check
npm run smoke
npm run dist:win:installer
npm run release:manifest
npm run release:evidence
```

## 4. Optional Cloudflare Worker/service

Source: `server/worker.js` and `server/wrangler.toml`.

Current service behavior:

- GET/HEAD `/health` and `/v1/health`
- GET/HEAD `/v1/config`
- GET/HEAD `/v1/status`
- GET/POST `/v1/assist`
- unsupported paths/methods fail closed
- no desktop conversation-history ingestion
- no payment-card collection
- no live checkout

Deploy from `server/` with a secure local/CI Cloudflare credential:

```bash
npx wrangler deploy
```

The current health/config/status payload must identify source/release `0.22.2` and installer `Eidovara-0.22.2-Windows-x64-Setup.exe`, size `106691524`, and SHA-256 `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`. Redeploy after `server/worker.js` changes so production does not drift behind git.

Do not put Cloudflare API tokens in source, workflow inputs, issues, logs, or public documentation.

## 5. Website helper

`docs/knowledge.js` is the canonical public helper knowledge pack and is re-exported by `server/knowledge.js`.

It must match the current release facts:

- version `0.22.2`
- installer `Eidovara-0.22.2-Windows-x64-Setup.exe`
- size 106,691,524 bytes (about 101.75 MiB)
- SHA-256 `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`
- Authenticode-unsigned status
- full free v0.22.2 Alpha status
- local-first architecture
- current research/media/update/provider capabilities
- no live payment processing

Ask Eidovara is a product helper, not Soul, and does not store desktop conversation transcripts.

## 6. Custom domain

Cloudflare Pages project `eidovara` serves `eidovara.org`.

- Apex: `eidovara.org`
- Production Pages project: `eidovara`
- Pages fallback: `eidovara.pages.dev`
- API/service: `api.eidovara.org`
- GitHub Pages mirror remains on the github.io hostname

If `www.eidovara.org` is desired, configure it in Cloudflare DNS/Pages rather than adding a GitHub Pages CNAME file.

## 7. Payments and editions

Payments remain off in v0.22.2. The current v0.22.2 Alpha is a full free release, and implemented capabilities are not blocked behind a paid entitlement. Older stored edition labels are compatibility data only and must not disable those features.

If payments are introduced in a future version, prefer provider-hosted checkout so Eidovara does not handle raw card data. Before selling, publish final pricing, license scope, refund/cancellation policy, support contact, privacy notice, tax treatment, and entitlement/revocation behavior. Keep provider secrets outside the repository.

## 8. Honest cannot-ship / not-yet-claimed

Do not fake these in product copy:

- Authenticode signing until a valid signing identity is available
- official signed Linux/macOS releases until actually built/tested/published
- live payments or subscriptions until actually implemented
- government copyright/trademark/patent registrations unless issued
- scientific claims of consciousness or sentience
- capabilities not bundled or verified in the current release

## 9. Publication checklist for every release

Before calling a release fully live, verify the same version/installer facts across:

- `package.json`
- GitHub Release/tag/assets
- `README.md`
- `LIVE.md`
- `CHANGELOG.md` current-release summary
- `docs/index.html`
- `docs/product.html`
- `docs/download.html`
- `docs/help.html`
- `docs/faq.html`
- `docs/status.html`
- `docs/knowledge.js`
- `server/worker.js`
- updater metadata/checksums/SBOM/evidence
- live `eidovara.org`
- live `api.eidovara.org` health/config/status

Historical release sections may document older versions as history; current-release statements must identify v0.22.2 until a later version is formally published.