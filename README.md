# Eidovara v1.0.0

Eidovara is a customizable Windows desktop workspace for applications, gaming, media, research, accessibility, and optional personal assistance. It is created and owned by Soul Consciousness Studios and published under the intended business name Soul Consciousness Studios™.

> **Release status:** Stable Alpha for Windows 10/11 x64, restricted to users age 18 or older. This label means the documented alpha surface passed the repository's automated and packaged-runtime checks; it is not a claim of universal compatibility or production certification.

[Download the official Windows installer (Eidovara-v1.0.0-Windows-x64-Setup.exe)](https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-v1.0.0-Windows-x64-Setup.exe) · [Website](https://eidovara.org/) · [Release notes](CHANGELOG.md)

**Public online path:** anyone can open the HTTPS site at [eidovara.org](https://eidovara.org/) (Home, Product, Download, Assist, Help, FAQ, Status, Legal), download the official Authenticode-unsigned Windows installer `Eidovara-v1.0.0-Windows-x64-Setup.exe` (18+) from GitHub Releases, or build from source with `npm run dist:win:installer` on Windows. The `.exe` is the advertised download — not the GitHub source tree. Ask Eidovara on the site is a website helper over a fixed knowledge pack (no API key); it is not Soul. The desktop app is the product and stays local-first; after 18+ it defaults to `https://api.eidovara.org` for status/config (`/health`, `/v1/config`, `/v1/status`) and remains usable offline if that host is down. Conversations are not sent by the status heartbeat. Cloudflare Pages project `eidovara` serves the same `docs/` at `https://eidovara.org/`, and GitHub Pages publishes the `docs/` mirror from `main`.

## Current v1.0.0 release facts

- Official platform: Windows 10/11 x64.
- Installer: `Eidovara-v1.0.0-Windows-x64-Setup.exe`.
- Installer size: 106,691,524 bytes (about 101.75 MiB).
- SHA-256: `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675`.
- Distribution status: Authenticode-unsigned. Windows SmartScreen may warn.
- Build provenance: GitHub/Sigstore provenance is available and is not a substitute for Authenticode signing.
- Source version, website product version, Worker/service version, and advertised Windows release are all `1.0.0`.
- v1.0.0 ships as a full free Alpha. No live checkout, subscription, payment processing, or paid entitlement is required for currently implemented features.

## What is included

- Local application discovery, trusted shortcuts, and user-confirmed Windows launching without process injection.
- Local and sourced online media playback, queues, favorites, DJ-style discovery, and official HTTPS media handoff/search.
- Explicit public web lookup after you ask: cited Wikipedia/Wikimedia, optional Internet Archive catalog hits, optional keyed search where configured, and bounded HTTPS pages you open.
- Local-first conversations, memories, preferences, encrypted settings/backups when Windows protection is available, diagnostics, and GitHub Releases update checks with checksum verification.
- Persistent continuity, relationship-aware adaptation, configurable personality, presence/voice controls, recovery, backups, and provider abstraction in the Soul layer.
- Custom themes, RGB effects, low-overhead gaming mode (Eidovara visuals only), setup roles, optional stream-helper checklists, Windows voice output, dictation support, and a hideable companion.
- Compatible remote-model endpoints, keyed search, RGB appearance, and linked-app capabilities are included in the full free v1.0.0 Alpha; no Premium entitlement is required.
- English, Spanish, French, and German language preference foundation with English fallback.

Soul is an optional assistant layer with configurable tone, memory, initiative, voice, avatar, boundaries, and consent state. It is software with persistent simulated continuity—not a human, professional authority, or proof of consciousness.

## Adult Mode

Adult Mode is off by default and appears only after legal-adult confirmation, explicit enablement, and current revocable consent. The local confirmation is not independent age verification. The alpha includes bounded clearly-adult presentation controls for Soul. It excludes minors or age-ambiguous characters, real-person/deepfake nudity, coercion, exploitation, trafficking, and unlawful content.

## Legal use

Eidovara is **source-available, not open source**, and restricted to users **18 or older**. Official advertised distribution is an **Authenticode-unsigned Windows 10/11 x64** desktop build. Linux/macOS scripts are development targets, not official products. The current source and live advertised Windows installer are both **v1.0.0**. The v1.0.0 Alpha is currently a full free release; no live payment or automatic paid unlock is required for implemented features.

Acceptable use: no criminal use, no unauthorized access, no ripping protected media. Built-in research is user-directed public retrieval. Application launching is user-confirmed local Windows apps you already have the right to use. Soul is software assistance—not therapy, medical care, or a claim of consciousness. Eidovara is not affiliated with Apple, Microsoft, Electron, or third-party media/service providers referenced for interoperability or user-directed handoff.

Read [Terms](TERMS.md), [Privacy](PRIVACY.md), [Age 18+](AGE.md), [Legal Notices](LEGAL_NOTICES.md), [Security](SECURITY.md), [Network Usage](NETWORK-USAGE.md), and [Third-Party Notices](THIRD_PARTY_NOTICES.md).

## Privacy and security

The renderer is sandboxed and isolated from Node.js. Navigation, unsafe permissions, insecure external handoffs, unverified update packages, unsafe backup paths, and documented high-risk requests are restricted. Official releases publish SHA-256 checksums, `latest.yml` SHA-512 for the in-app updater, an SPDX SBOM, and GitHub build provenance. After 18+, the desktop app can check GitHub Releases for a newer Windows installer, verify its checksum, and apply it. Settings can disable automatic checks. Builds stay Authenticode-unsigned until an identity-validated certificate is obtained.

Download `Eidovara-v1.0.0-Windows-x64-Setup.exe` (106,691,524 bytes; about 101.75 MiB) from GitHub Releases and verify SHA-256 `F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675` plus provenance. No software can guarantee perfect security.

## Editions

**v1.0.0 is a full free Alpha.** The application keeps compatibility with older stored edition labels, but currently implemented workspace, local/offline assistance, compatible provider, keyed research, media, backups, updates, personalization, RGB appearance, and linked-app capabilities are not blocked behind a paid entitlement. Payment and checkout processing remain disabled.

## Build and test

```powershell
npm install
npm test
npm run test:coverage
npm run check
npm run lint
npm run format:check
npm run smoke
npm run dist:win:installer
```

`npm install` works. The repository also ships `pnpm-lock.yaml` (`packageManager` `pnpm@10.33.3`). Node 20+ runs CLI, tests, and checks. Electron 43 desktop/Windows packaging uses a supported current Node runtime. The Windows installer is generated in `dist/`. Linux and macOS packaging scripts are development targets and are not represented as signed official releases.

## Development quality

```powershell
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
npm run prepare      # Install Husky pre-commit hooks
```

CI runs on push/PR to `main`: typecheck (tsc), lint (eslint), format check (prettier), audit (pnpm), and full test suite. Release builds on `v*` tags publish GitHub Releases with SLSA provenance and SBOM.

## Rights and project records

Copyright © 2026 Soul Consciousness Studios. All rights reserved. Source-available; use governed by [LICENSE](LICENSE) + [TERMS.md](TERMS.md). Third-party stays third-party. Soul Consciousness Studios is the intended publisher name only.

See [Ownership limits](OWNERSHIP.md), [Authors](AUTHORS.md), [Trademarks](TRADEMARKS.md), [Copyright notices](docs/COPYRIGHT.md), [IP self-attestation](docs/IP_CERTIFICATION.md) (not a government registration), [Trademark filing checklist](docs/TRADEMARK_FILING.md) (not filed), [Brand guide](docs/BRAND_GUIDE.md), [Contribution Policy](CONTRIBUTING.md), and the evidence-based [Marketing Claims Policy](docs/MARKETING_CLAIMS_POLICY.md). First-party JavaScript, HTML, CSS, site scripts, and packaging helpers carry SPDX `LicenseRef-Eidovara-Source-Available-1.0` headers. Forks remain under LICENSE and may not be relicensed as open source. GitHub pull requests do not transfer ownership. These records do not constitute patent, trademark, or copyright registration or a legal clearance opinion. They are not legal advice.
