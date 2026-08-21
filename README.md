# Eidovara v0.18.0

Eidovara is a customizable Windows desktop workspace for applications, gaming, media, research, accessibility, and optional personal assistance. It is created and owned by Tyler Michael Bosworth and published under the intended business name Soul Consciousness Studios™.

> **Release status:** Stable Alpha for Windows 10/11 x64, restricted to users age 18 or older. This label means the documented alpha surface passed the repository's automated and packaged-runtime checks; it is not a claim of universal compatibility or production certification.

[Download the latest Windows installer](https://github.com/ProjectSoulbyTmb/project---soul/releases/latest) · [Website](https://projectsoulbytmb.github.io/project---soul/) · [Release notes](CHANGELOG.md)

## What is included

- Local application discovery, trusted shortcuts, and user-confirmed Windows launching without process injection.
- Local and sourced online media playback, queues, favorites, DJ-style discovery, and external Spotify/YouTube handoff.
- User-requested internet research with visible sources, images, audio, and video; optional broad search with a user-supplied key.
- Local-first conversations, memories, preferences, encrypted settings/backups when Windows protection is available, diagnostics, and verified updates.
- Custom themes, RGB effects, low-overhead gaming mode, setup roles, optional stream-helper configuration, voice output, dictation support, and a hideable 2D/3D-styled companion.
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

Eidovara Free includes core workspace, offline/local assistance, public research, media, backups, updates, personalization, and up to three linked apps. Premium gates compatible remote-model endpoints, broad keyed search, unlimited linked apps, and premium appearance options. The private Ctrl+A panel uses a per-installation administrator password and provides local testing controls only; it does not prove payment or entitlement.

## Build and test

The CLI, automated tests, and `pnpm run check` / `pnpm run smoke` run on **Node.js 20+**. Installing or packaging the Electron 43 desktop binary requires **Node.js >=22.12**, which is the engine declared by the `electron` npm package itself. Official CI uses **Node 22** and **pnpm 10** with `pnpm install --frozen-lockfile`. `npm install` can produce a one-off tree, but the committed lockfile and Windows release workflow are pnpm.

```powershell
pnpm install
pnpm test
pnpm run check
pnpm run smoke
pnpm start
pnpm run cli
pnpm run dist:win:installer
```

On Node 20, `pnpm install` skips downloading the Electron binary so CLI and tests still work. Use Node 22.12+ for `pnpm start` and Windows packaging. `pnpm run server:test` runs the Cloudflare Worker unit tests without deploying or using secrets.

`run-gui.bat` and `run-cli.bat` install dependencies if needed and launch the documented Windows desktop or terminal app. The app starts in the existing offline mode; optional local models, remote providers, keyed search, and the HTTPS service remain Settings/Ctrl+A configuration after launch. Linux and macOS development hosts can use `./run-gui.sh` or `./run-cli.sh`; on Linux, Chromium sandbox and GPU are reduced only when the host cannot provide them.

The Windows installer is generated in `dist/`. Linux and macOS packaging scripts are development targets and are not represented as signed official releases.

## Rights and project records

Copyright © 2026 Tyler Michael Bosworth. All rights reserved. This public repository is source-available for lawful evaluation, not open source. Use is governed by [LICENSE](LICENSE). Third-party components and marks remain their owners' property.

See [Ownership](NOTICE.md), [Authors](AUTHORS.md), [Trademarks](TRADEMARKS.md), [Contribution Policy](CONTRIBUTING.md), and the evidence-based [Marketing Claims Policy](docs/MARKETING_CLAIMS_POLICY.md). These records do not constitute patent, trademark, or copyright registration or a legal clearance opinion.
