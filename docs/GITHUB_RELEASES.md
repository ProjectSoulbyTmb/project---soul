# Eidovara GitHub release setup

Repository: `https://github.com/ProjectSoulbyTmb/project---soul`

Official advertised distribution is an **Authenticode-unsigned** Windows 10/11 x64 NSIS installer for users **18+**. GitHub Actions on `windows-latest` builds the installer and publishes checksums, updater metadata, an SPDX SBOM, `CODE-SIGNING-STATUS.txt`, and GitHub/Sigstore build provenance. That provenance is **not** Authenticode. CI cannot create an Authenticode-signed Setup.exe until a code-signing identity exists outside this repository.

## Current published release

- Version/tag: `v1.0.0`
- Installer: `Eidovara-v1.0.0-Windows-x64-Setup.exe`
- Size: measured from the tagged build; see the release’s SHA256SUMS.txt
- SHA-256: measured from the tagged build; see the release’s SHA256SUMS.txt
- Latest asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-v1.0.0-Windows-x64-Setup.exe`
- Pinned asset: `https://github.com/ProjectSoulbyTmb/project---soul/releases/download/v1.0.0/Eidovara-v1.0.0-Windows-x64-Setup.exe`
- Signing: Authenticode-unsigned; Windows SmartScreen may warn.
- Provenance: GitHub/Sigstore build provenance is available and is not Authenticode signing.
- Edition: full free v1.0.0 Alpha; no paid entitlement is required for currently implemented features.

## Tag release procedure

1. Set `package.json` `version` to the intended new release and merge the tested source to `main`.
2. Create a new matching `v*` tag. Never move or reuse a published release tag after changing files.
3. The `Release Windows` workflow runs tests/checks/smoke tests, builds the NSIS installer on `windows-latest`, creates updater metadata and release evidence, computes checksums, and publishes the matching release artifacts.
4. After publication, update the public website, helper knowledge pack, Worker/service release payload, README, release runbook, and live-state record to the measured installer filename, size, and checksum.
5. Keep `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest` as the release-notes/checksum destination and make the actual Setup.exe the primary Windows download.

Example for the next release (replace the version before using):

```powershell
git checkout main
git pull origin main
git tag vNEXT
git push origin vNEXT
```

Do not reuse `v1.0.0` or any earlier published tag for changed release bytes.

## Manual dispatch

`workflow_dispatch` on `.github/workflows/release-windows.yml` can build unsigned Windows artifacts for verification. A branch build must not be presented as a published release unless the matching tag/release is actually created and its files are measured.

Windows NSIS must be built on Windows (`windows-latest` or a supported local Windows 10/11 x64 machine). Linux/macOS packaging scripts in `package.json` are development targets, not official products.

## Local Windows build if Actions cannot run

```powershell
npm install
npm test
npm run check
npm run smoke
npm run dist:win:installer
npm run release:manifest
npm run release:evidence
```

Attach the matching `dist/Eidovara-*-Windows-x64-Setup.exe`, `dist/latest.yml`, `dist/update.json`, `dist/SHA256SUMS.txt`, `dist/SBOM.spdx.json`, and `dist/CODE-SIGNING-STATUS.txt` to the matching GitHub Release. Never upload a private signing key. Installed copies can check GitHub Releases, verify update metadata/checksums, and prompt before applying an update.

## Publication consistency rule

A release is not considered fully promoted until these surfaces agree on the same measured release facts:

- `package.json`
- GitHub Release/tag and assets
- `README.md`
- `LIVE.md`
- `docs/index.html`, `docs/product.html`, `docs/download.html`, `docs/help.html`, `docs/faq.html`, `docs/status.html`
- `docs/knowledge.js` and the website helper
- `server/worker.js` `/health`, `/v1/config`, and `/v1/status` payloads
- release/update metadata and checksums

Historical changelog entries can retain older-version history, but current-release statements must identify the actual live release as v1.0.0 until a later version is formally published.