# Eidovara v0.18.2

Eidovara is a customizable Windows desktop workspace for applications, gaming, media, research, accessibility, and optional personal assistance. It is created and owned by Tyler Michael Bosworth and published under the intended business name Soul Consciousness Studios™.

> **Release status:** Stable Alpha for Windows 10/11 x64, restricted to users age 18 or older. This label means the documented alpha surface passed the repository's automated and packaged-runtime checks; it is not a claim of universal compatibility or production certification.

[Download the official Windows installer (Eidovara-0.18.2-Windows-x64-Setup.exe)](https://github.com/ProjectSoulbyTmb/project---soul/releases/latest/download/Eidovara-0.18.2-Windows-x64-Setup.exe) · [Website](https://eidovara.org/) · [Release notes](CHANGELOG.md)

**Public online path:** anyone can open the HTTPS site at [eidovara.org](https://eidovara.org/) (Home, Product, Download, Assist, Help, FAQ, Status, Legal), download the official Authenticode-unsigned Windows installer `Eidovara-0.18.2-Windows-x64-Setup.exe` (18+) from GitHub Releases, or build from source with `npm run dist:win:installer` on Windows. That `.exe` is the advertised download — not the GitHub source tree. Ask Eidovara on the site is a website helper over a fixed knowledge pack (no API key); it is not Soul. The desktop app is the product and stays local-first; it can attach to the online Eidovara service for status/config (`/health`, `/v1/config`, `/v1/status`) while remaining usable offline. That attachment is not required. Cloudflare Pages project `eidovara` serves the same `docs/` at `https://eidovara.org/`. GitHub Pages also publishes `docs/` from `main` (PR #10 merged) at `https://projectsoulbytmb.github.io/project---soul/`. Owner clicks that git cannot finish (Dependency graph, `npx wrangler deploy` after Worker edits, `www` DNS) are in [docs/PAYMENTS_AND_SITE.md](docs/PAYMENTS_AND_SITE.md) and [LIVE.md](LIVE.md).

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

Adult Mode is off by default and appears only after legal-adult confirmation, explicit enablement, and current revocable consent. The local confirmation is not independent age verification. The alpha includes bounded body-shape controls and optional non-photorealistic presentation for Soul's fictional, clearly adult avatar. It excludes minors or age-ambiguous characters, real-person/deepfake nudity, coercion, exploitation, trafficking, and unlawful content.

## Legal use

Eidovara is **source-available, not open source**, and restricted to users **18 or older**. Official advertised distribution is an **Authenticode-unsigned Windows 10/11 x64** desktop build. Linux/macOS scripts are development targets, not official products. Premium in v0.18.2 is local-admin testing only; there is no live payment or automatic paid unlock.

Acceptable use: no criminal use, no unauthorized access, no ripping protected media. Built-in research is public Wikipedia/Wikimedia after an explicit internet/web/online request. Application launching is user-confirmed local Windows apps you already have the right to use. Soul is software assistance—not therapy, medical care, or a claim of consciousness. Eidovara is not affiliated with Apple, Microsoft, or Electron and is not an iOS/iPhone product.

Read [Terms](TERMS.md), [Privacy](PRIVACY.md), [Age 18+](AGE.md), [Legal Notices](LEGAL_NOTICES.md), [Security](SECURITY.md), [Network Usage](NETWORK-USAGE.md), and [Third-Party Notices](THIRD_PARTY_NOTICES.md).

## Privacy and security

The renderer is sandboxed and isolated from Node.js. Navigation, unsafe permissions, insecure external handoffs, unverified update packages, unsafe backup paths, and documented high-risk requests are restricted. Official releases publish SHA-256 checksums, an SPDX SBOM, and GitHub build provenance.

Windows installers remain Authenticode-unsigned until an identity-validated certificate is obtained. This is the official unsigned installer, not Microsoft certification, EV signing, or SmartScreen pre-approval. Download `Eidovara-0.18.2-Windows-x64-Setup.exe` (~101.3 MiB) from GitHub Releases (SHA-256 `EF228574DCDF34B8A9039654F2B762FAB6D289CCA9A94B2ECCF048AE971FE711`) and verify checksums plus provenance. No software can guarantee perfect security.

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

Copyright © 2026 Tyler Michael Bosworth. All rights reserved. Source-available; use governed by [LICENSE](LICENSE) + [TERMS.md](TERMS.md). Third-party stays third-party. Soul Consciousness Studios is the intended publisher name only.

See [Ownership limits](OWNERSHIP.md), [Authors](AUTHORS.md), [Trademarks](TRADEMARKS.md), [Contribution Policy](CONTRIBUTING.md), and the evidence-based [Marketing Claims Policy](docs/MARKETING_CLAIMS_POLICY.md). First-party JavaScript carries SPDX `LicenseRef-Eidovara-Source-Available-1.0` headers. Forks remain under LICENSE and may not be relicensed as open source. GitHub pull requests do not transfer ownership. These records do not constitute patent, trademark, or copyright registration or a legal clearance opinion. They are not legal advice.
