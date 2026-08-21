# Security Policy

## Supported releases

Only the newest published Eidovara release receives security fixes. Install updates only from the official repository and verify the published checksum and GitHub build-provenance attestation. Windows SmartScreen may warn until an Authenticode identity is obtained; never bypass a warning for a file whose hash or origin does not match the release record.

Report security issues privately to the repository owner through GitHub's private vulnerability-reporting feature when enabled. Do not post credentials, private conversations, exploit details, or personal data in a public issue.

Official releases publish SHA-256 checksums, an SPDX SBOM, updater integrity metadata (`latest.yml` SHA-512 plus `update.json` SHA-256), and GitHub/Sigstore build provenance. Windows binaries remain Authenticode-unsigned until the project owner obtains a valid code-signing identity. The desktop app can check GitHub Releases for a newer installer; it refuses to install if checksum metadata is missing or mismatched.

The public repository runs CodeQL, dependency audits and review, Dependabot, prohibited-secret scanning, and OpenSSF Scorecard analysis. These controls provide independently inspectable evidence; they are not a substitute for Authenticode publisher identity.

**Owner click (Dependency review):** GitHub cannot run `.github/workflows/dependency-review.yml` until Dependency graph is on. Repository **Settings → Code security** → enable **Dependency graph** (`https://github.com/ProjectSoulbyTmb/project---soul/settings/security_analysis`). Keep `fail-on-severity: moderate`. Do not delete or weaken that workflow. Code cannot enable the graph.

The desktop renderer is sandboxed and isolated from Node.js. Navigation, popups, webviews, permissions, insecure HTTP external links, update packages outside the official release repository, unverified updates, oversized network responses, and unsafe backup paths are blocked. The app Content-Security-Policy uses `media-src https: eidovara-media:` for user-selected local files and must not use `media-src 'self'`. Automatic GitHub update checks default off after 18+ and can be enabled in Settings. Downloaded updates are checksum-verified (`latest.yml` SHA-512 via electron-updater, or `update.json` SHA-256). They receive Windows internet-zone metadata and a silent Microsoft Defender custom-scan attempt when Defender is available; an explicit Defender threat result prevents launch, while an unavailable scanner does not break updating. Builds are Authenticode-unsigned; SmartScreen may warn. Credentials, settings, profiles, conversations, memories, and new backups use the operating-system credential-protection facility when available. Existing plaintext profiles are migrated in place on first protected load. No software can promise absolute security; users should keep Windows, Defender, GPU/audio drivers, browsers, and local model services patched.

Payment checkout is external and provider-hosted. In v0.19.0 checkout stays **fail-closed**: the desktop sanitizer forces `paymentsEnabled` and `checkoutEnabled` to false even if a remote config lied. Eidovara does not accept or store card numbers, security codes, payout credentials, webhook secrets, or payment API keys. A public HTTPS checkout URL is not a secret; all private provider credentials must remain in the payment provider or a protected server-secret store. No PCI-DSS certification is claimed.

## Current network surface

Documented destinations are in [NETWORK-USAGE.md](NETWORK-USAGE.md). In v0.19.0 they are: Wikipedia/Wikimedia after an explicit research request; optional pasted HTTPS or loopback model providers; Premium Brave Search with a user key; official GitHub update checks; optional Worker `GET /v1/health` (fallback `/health`), `/v1/config`, `/v1/status` after a pasted HTTPS base; optional website `GET`/`POST /v1/assist` after a pasted HTTPS base; optional desktop `POST /v1/assist` only after a pasted HTTPS base, Soul-online opt-in, and a per-message send checkbox (default off; Assist is not Soul); and Spotify/YouTube HTTPS search links. Conversation history is never sent. No Worker URL is hardcoded.

## Enhancement limits

Neural TTS, VRM, OBS websocket control, and live payments may be documented as future adapters only. Do not enable them in this release. Do not weaken the renderer sandbox, the 18+ gates, app `media-src`, or `.github/workflows/dependency-review.yml` (`fail-on-severity: moderate`).
