# Eidovara v0.18.0

Eidovara is a customizable Windows desktop workspace for applications, gaming, media, research, accessibility, and optional personal assistance. It is created and owned by Tyler Michael Bosworth and published under the intended business name Soul Consciousness Studios™.

> **Release status:** Stable Alpha for Windows 10/11 x64, restricted to users age 18 or older. This label means the documented alpha surface passed the repository's automated and packaged-runtime checks; it is not a claim of universal compatibility or production certification.

[Download the latest Windows installer](https://github.com/ProjectSoulbyTmb/project---soul/releases/latest) · [Website](https://projectsoulbytmb.github.io/project---soul/) · [Release notes](CHANGELOG.md)

## What is included

- Local application discovery, trusted shortcuts, and user-confirmed Windows launching without process injection.
- Local and sourced online media playback, queues, favorites, DJ-style discovery, and external Spotify/YouTube handoff.
- Explicit internet/web/online research with cited Wikipedia/Wikimedia sources, images, audio, and video; optional Premium Brave Search with a user-supplied key.
- Local-first conversations, memories, preferences, encrypted settings/backups when Windows protection is available, diagnostics, and verified updates.
- Custom themes, Premium RGB effects, low-overhead gaming mode (Eidovara visuals only), setup roles, optional stream-helper checklists, Windows voice output, dictation support, and a hideable 2D/3D-styled companion.
- English, Spanish, French, and German language preference foundation with English fallback.
- Free and locally testable Premium feature gates. No live subscription or payment processing is represented by this release.

Soul is an optional assistant layer with configurable tone, memory, initiative, voice, avatar, boundaries, and consent state. It is software with persistent simulated continuity—not a human, professional authority, or proof of consciousness.

## Adult Mode

Adult Mode is off by default and appears only after legal-adult confirmation, explicit enablement, and current revocable consent. The local confirmation is not independent age verification. The alpha includes bounded body-shape controls and optional non-photorealistic presentation for Soul's fictional, clearly adult avatar. It excludes minors or age-ambiguous characters, real-person/deepfake nudity, coercion, exploitation, trafficking, and unlawful content. See [Legal Notices](LEGAL_NOTICES.md).

## Privacy and security

The renderer is sandboxed and isolated from Node.js. Navigation, unsafe permissions, insecure external handoffs, unverified update packages, unsafe backup paths, and documented high-risk requests are restricted. Official releases publish SHA-256 checksums, an SPDX SBOM, and GitHub build provenance.

Windows installers remain Authenticode-unsigned until an identity-validated certificate is obtained. Download only from the official release page and verify its checksum and provenance. No software can guarantee perfect security.

Read [Privacy](PRIVACY.md), [Security](SECURITY.md), [Network Usage](NETWORK-USAGE.md), and [Third-Party Notices](THIRD_PARTY_NOTICES.md).

## Editions

Eidovara Free includes core workspace, offline/local assistance, public Wikipedia/Wikimedia research, media, backups, updates, personalization, and up to three linked apps. Premium gates compatible remote-model endpoints (`/chat/completions`), broad keyed Brave search, unlimited linked apps, and RGB appearance. The private Ctrl+A panel uses a per-installation administrator password and provides local testing controls only; it does not prove payment or entitlement.

## Build and test

```powershell
npm install
npm test
npm run check
npm run smoke
npm run dist:win:installer
```

`npm install` works. The repository also ships `pnpm-lock.yaml` (`packageManager` `pnpm@10.33.3`). Node 20 runs CLI, tests, and checks. Electron 43 (desktop `npm start` / Windows packaging) needs Node >= 22.12.0. A postinstall helper skips the Electron binary download on older Node instead of failing the whole install.

The Windows installer is generated in `dist/`. Linux and macOS packaging scripts are development targets and are not represented as signed official releases.

## Rights and project records

Copyright © 2026 Tyler Michael Bosworth. All rights reserved. This public repository is source-available for lawful evaluation, not open source. Use is governed by [LICENSE](LICENSE). Third-party components and marks remain their owners' property.

See [Ownership](NOTICE.md), [Authors](AUTHORS.md), [Trademarks](TRADEMARKS.md), [Contribution Policy](CONTRIBUTING.md), and the evidence-based [Marketing Claims Policy](docs/MARKETING_CLAIMS_POLICY.md). These records do not constitute patent, trademark, or copyright registration or a legal clearance opinion.
