# Eidovara GitHub release setup

Repository: `https://github.com/ProjectSoulbyTmb/project---soul`

1. Sign in to the ProjectSoulbyTmb GitHub account.
2. In this project folder, initialize Git, add the repository as `origin`, commit, and push the `main` branch.
3. Ensure repository Actions are enabled. The included `.github/workflows/release-windows.yml` workflow needs only the default `contents: write` token permission.
4. Change `package.json` to the new release version, commit it, then create and push a matching tag such as `v0.16.0`.
5. GitHub Actions tests the source, injects `https://github.com/OWNER/REPOSITORY/releases/latest/download/update.json` into the packaged app, builds the Windows installer and portable executable, generates the SHA-256 manifest, and publishes all files to the GitHub Release.
6. The workflow also publishes SHA-256 checksums, an SPDX SBOM, an explicit Authenticode status report, and GitHub/Sigstore signed build-provenance attestations. A private signing certificate is never uploaded as a release asset.

PowerShell commands:

```powershell
git init
git branch -M main
git remote add origin https://github.com/ProjectSoulbyTmb/project---soul.git
git add .
git commit -m "Publish Eidovara"
git push -u origin main
git tag v0.15.0
git push origin v0.15.0
```

Do not reuse a release tag after changing its files. Increment the version and create a new tag so installed applications can compare versions safely.
