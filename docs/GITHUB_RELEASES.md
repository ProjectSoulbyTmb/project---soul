# Eidovara GitHub release setup

Repository: `https://github.com/ProjectSoulbyTmb/project---soul`

Official advertised distribution is an **Authenticode-unsigned** Windows 10/11 x64 NSIS installer for users **18+**. GitHub Actions on `windows-latest` can build that installer and publish checksums, an SPDX SBOM, `CODE-SIGNING-STATUS.txt` (unsigned), and GitHub/Sigstore **build provenance**. That provenance is **not** Authenticode. CI cannot mint a signed Setup.exe until a code-signing identity exists outside this repository.

## Tag release (publishes to GitHub Releases)

1. Sign in to the ProjectSoulbyTmb GitHub account. Repository Actions must be enabled (`contents: write`, `id-token: write`, `attestations: write` for `.github/workflows/release-windows.yml`).
2. Set `package.json` `version` to the new release, commit to `main`, then create and push a matching tag:

```powershell
git checkout main
git pull origin main
git tag v0.19.1
git push origin v0.19.1
```

3. The `Release Windows` workflow tests, packages `pnpm run dist:win:installer`, writes the update manifest and evidence, and publishes `Eidovara-${version}-Windows-x64-Setup.exe` to the GitHub Release. Users download that `.exe`; they do not extract a ZIP.
4. Point the public site primary download at the Release `.exe` asset, for example `https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.19.1-Windows-x64-Setup.exe`. Keep `/releases/latest` as a checksums/notes link. Do not make the GitHub source tree the main download button. Current SHA-256: `F2B0D9BB0A887294CF58A43C75DF67FA422C2120540DE03D5227A9B239D08310`. Size about 101.3 MiB.

Do not reuse a release tag after changing its files. Increment the version and create a new tag so installed applications can compare versions safely.

## Manual dispatch (unsigned artifacts only)

`workflow_dispatch` on `.github/workflows/release-windows.yml` runs the same Windows NSIS build on `windows-latest`. On a **branch** it uploads unsigned artifacts; it does **not** create a GitHub Release (that would use the branch name as a tag). To publish, push a `v*` tag instead.

Windows NSIS must be built on Windows (this workflow’s `windows-latest` runner, or a local Windows 10/11 x64 machine with Node 22+). Linux/macOS packaging scripts in `package.json` are development targets, not official products.

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

Attach `dist/Eidovara-*-Windows-x64-Setup.exe`, `dist/update.json`, `dist/SHA256SUMS.txt`, `dist/SBOM.spdx.json`, and `dist/CODE-SIGNING-STATUS.txt` to a GitHub Release for the matching `v*` tag. Never upload a private signing key.

Overwrite-on-reinstall for existing Eidovara installs is a separate installer change (pull request #9).
