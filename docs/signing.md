# Code Signing - Eidovara Windows Installer

## Current state

Installers are **Authenticode-unsigned** until a code-signing certificate is configured. Every release artifact ships with a `CODE-SIGNING-STATUS.txt` file that states its signing status honestly, and the website/download page repeats that status.

## Activating signing (when the certificate arrives)

1. Obtain an OV or EV Authenticode certificate (EV removes SmartScreen friction for a new publisher).
2. Export the certificate **with private key** as PFX/PKCS#12.
3. Base64-encode it and add two repository secrets:
   - `WINDOWS_PFX_BASE64` - base64 of the PFX file
   - `WINDOWS_PFX_PASSWORD` - the PFX export password
4. Tag `v*` releases as usual. The Release Windows workflow detects the secrets and signs automatically:
   - digest: SHA-256 (`/fd SHA256`)
   - timestamp: RFC 3161 via `http://timestamp.digicert.com` (`/td SHA256`)
   - `dist/CODE-SIGNING-STATUS.txt` is rewritten to report the signed state
5. Verify after release: download the Setup.exe and run
   `signtool verify /pa /all Eidovara-vX.Y.Z-Windows-x64-Setup.exe`

## Enforcing signature verification in updates

Once real signed builds are shipping, flip updater verification on by removing the stub in `src/electron/auto-update.js` (`verifyUpdateCodeSignature`) so electron-updater rejects unsigned packages. Until then, integrity rests on mandatory SHA digests fetched over HTTPS from official GitHub Releases, plus Mark-of-the-Web and an optional Defender scan before install.

## Secrets handling rules

- Never commit PFX/key material; `.gitignore` already excludes `*.pfx`, `*.key`.
- Secrets live only in repository/environment secrets; the workflow exposes them to a single pwsh step that deletes the temp PFX immediately after use.
- If a certificate is ever compromised: revoke via the CA, rotate the secret, and cut a new release.

## Honest-labeling policy

`authenticodeSigned: false` / "unsigned" statements across README, worker payload, download page, and tests are updated in the same commit that first ships a signed build - the legal-surface test suite fails otherwise.
