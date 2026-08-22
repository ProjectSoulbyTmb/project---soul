# Ownership and provenance

SPDX-FileCopyrightText: 2026 Soul Consciousness Studios  
SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

Copyright Â© 2026 Soul Consciousness Studios. All rights reserved. Source-available; use governed by LICENSE + TERMS. Third-party stays third-party.

**Tyler M. Bosworth is the sole creator and owner of Soul Consciousness Studios and all associated products.** Soul Consciousness Studios is the business name under which Tyler M. Bosworth publishes and commercializes his work.

Soul Consciousness Studios is identified as Eidovara's owner, creator, and product director and claims qualifying original first-party expression. Soul Consciousness Studios is an intended publisher name, not a formed entity that owns this IP unless a signed assignment by Tyler M. Bosworth exists. Ideas, methods, facts, public-domain material, and third-party material (including Electron, Chromium, Node.js, Windows, and Wikimedia content) are excluded. Patent inventorship is determined claim by claim in an actual filing.

Preserve repository history, release checksums, SBOMs, and build provenance as development evidence. This notice is not a registration, patent grant, court judgment, or legal opinion. See OWNERSHIP.md and COPYRIGHT.txt.

## Copyright years

First-party Eidovara expression in this repository is claimed for **2026**. Update the year only when new original first-party work is first published in a later calendar year. Do not backdate, and do not add years for work that was not created.

## Third-party software actually used

Eidovara's advertised Windows runtime redistributes **Electron** and the **Chromium** and **Node.js** components Electron bundles. Those works stay under their own licenses. This NOTICE does not re-license them and does not invent packages that are not declared in `package.json`.

Declared dependencies in `package.json` (v0.19.1) that this project actually invokes:

| Component | Version in package.json | Role | License family (as published by that project) | Redistributed in the Windows app? |
| --- | --- | --- | --- | --- |
| Electron | 43.4.1 | Desktop runtime | MIT (Electron); Chromium/Node.js keep their own notices | Yes â€” runtime |
| Chromium | bundled by Electron 43.4.1 | Rendering engine | Chromium authors; see `LICENSES.chromium.html` in Windows builds | Yes â€” via Electron |
| Node.js | bundled by Electron 43.4.1 | JavaScript runtime | OpenJS Foundation and contributors; see Electron notices | Yes â€” via Electron |
| electron-updater | 6.8.9 | Official GitHub Releases updater | MIT | Yes â€” application dependency |
| electron-builder | 26.15.3 | Windows/Linux packaging | As published by electron-builder | No â€” build-time only |
| rcedit | 5.0.2 | Applies the approved `.ico` during Windows `afterPack` | As published by rcedit | No â€” build-time only |
| @electron/packager | 20.3.0 | macOS packaging scripts (not an official signed product) | As published by @electron/packager | No â€” build-time only |
| @noble/hashes | 1.4.0 | Development helper | As published by @noble/hashes | No â€” development only |
| yallist | 4.0.0 | Development helper | As published by yallist | No â€” development only |

Windows builds must keep Electron's `LICENSE.electron.txt` and `LICENSES.chromium.html` with redistributed copies. This repository does not paste those third-party license texts into LICENSE (Eidovara is not MIT/Apache/GPL). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Do not treat an unused or transitive listing as a grant of Eidovara rights.

Microsoft Windows, GitHub, Cloudflare, Wikipedia/Wikimedia, Spotify, YouTube, Brave Search, and other named platforms are **not** redistributed as source in this repository; they remain their owners' software, services, and marks.

