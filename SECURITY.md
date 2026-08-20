# Security Policy

## Supported releases

Only the newest published Eidovara release receives security fixes. Install updates only from the official repository and verify the published checksum and GitHub build-provenance attestation. Windows SmartScreen may warn until an Authenticode identity is obtained; never bypass a warning for a file whose hash or origin does not match the release record.

Report security issues privately to the repository owner through GitHub's private vulnerability-reporting feature when enabled. Do not post credentials, private conversations, exploit details, or personal data in a public issue.

Official releases publish SHA-256 checksums, an SPDX SBOM, updater integrity metadata, and GitHub/Sigstore build provenance. Windows binaries remain Authenticode-unsigned until the project owner obtains a valid code-signing identity.

The desktop renderer is sandboxed and isolated from Node.js. Navigation, popups, webviews, permissions, insecure HTTP external links, unverified updates, oversized network responses, and unsafe backup paths are blocked. Credentials use operating-system encryption when available. No software can promise absolute security; users should keep Windows, GPU/audio drivers, browsers, and local model services patched.

Payment checkout is external and provider-hosted. Eidovara does not accept or store card numbers, security codes, payout credentials, webhook secrets, or payment API keys. A public HTTPS checkout URL is not a secret; all private provider credentials must remain in the payment provider or a protected server-secret store.
