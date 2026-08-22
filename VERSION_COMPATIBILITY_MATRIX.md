# Eidovara Version Compatibility Matrix

## Current Version: v1.0.0 (Stable Alpha)

Released: August 21, 2026

---

## Core Platform Compatibility

| Component | Version | Status | Notes |
|-----------|---------|--------|-------|
| **Electron** | 43.4.1 | ✅ Required | Supported current runtime |
| **Node.js** | >=20.0.0 | ✅ Required | Node 20+ runs CLI, tests, checks |
| **pnpm** | 10.33.3 | ✅ Required | Package manager |
| **Chromium** | 115+ (via Electron 43) | ✅ Bundled | WebView/Renderer engine |
| **V8** | 11.5+ | ✅ Bundled | JavaScript engine |

---

## Operating System Compatibility

| Platform | Version | Architecture | Status | Notes |
|----------|---------|--------------|--------|-------|
| **Windows 10** | 1909+ | x64 | ✅ Official | Primary supported platform |
| **Windows 11** | 21H2+ | x64 | ✅ Official | Primary supported platform |
| **Linux** | Ubuntu 20.04+ | x64 | 🟡 Dev target | AppImage, deb - not official |
| **macOS** | 12+ | x64/arm64 | 🟡 Dev target | Not official signed products |

---

## Installer Compatibility

| Installer Version | Electron | Node | Status | SHA-256 |
|-------------------|----------|------|--------|---------|
| **v1.0.0** | 43.4.1 | 20+ | ✅ Current | F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675 |
| v0.22.2 | 43.4.1 | 20+ | ⚠️ Historical | A26B8232E6B81A77566610AFF110197022850AB4348F86D390663831584B5DEE |
| v0.19.1 | 43.x | 20+ | ⚠️ Historical | 72F4D09ADA17593F0391438A5375ABC9351041DA8ABB252E68271B8FDACCA7D8 |

**Note**: Only v1.0.0 installer should be downloaded from `releases/latest`. Historical versions remain for reference only.

---

## Update Channel Compatibility

| Channel | Manifest URL | Status | Notes |
|---------|--------------|--------|-------|
| **Stable** | GitHub Releases | ✅ Active | `latest.yml` via electron-updater |
| Prerelease | GitHub Releases | ⚠️ Tagged only | Requires explicit tag |

**Auto-update requirements**:
- Age gate accepted (18+)
- Auto-check enabled in settings
- Windows 10/11 x64
- Internet connectivity for GitHub Releases

---

## Service/API Compatibility

| Service | Version | Endpoints | Status |
|---------|---------|-----------|--------|
| **Eidovara Service** | v1.0.0 | `/health`, `/v1/config`, `/v1/status` | ✅ Active |
| **Website Helper** | v1.0.0 | `/v1/assist` | ✅ Active (opt-in) |
| **Worker (Cloudflare)** | v1.0.0 | Same as service | ✅ Active |

**Compatibility rules**:
- Desktop Connect: `GET /health`, `/v1/config`, `/v1/status`
- Website Helper: `POST /v1/assist` (opt-in, 32 KiB limit)
- Service base URL: defaults to `https://api.eidovara.org`, overridable
- Fail-closed: unknown methods/paths return 404/405
- No conversation data sent by default

---

## Feature Compatibility Matrix

| Feature | v1.0.0 | v0.22.2 | v0.19.1 | Notes |
|---------|--------|---------|---------|-------|
| **Local-first workspace** | ✅ | ✅ | ✅ | Core feature |
| **Media playback** | ✅ | ✅ | ✅ | `eidovara-media://` protocol |
| **Internet research** | ✅ | ✅ | ✅ | User-directed, bounded |
| **Soul layer** | ✅ | ✅ | ✅ | Optional, triple-gate |
| **Persistent continuity** | ✅ | ✅ | ✅ | Memory, backups, provider context |
| **Custom themes/RGB** | ✅ | ✅ | ✅ | Full customization |
| **Gaming mode** | ✅ | ✅ | ✅ | Low-overhead visuals only |
| **Linked applications** | ✅ | ✅ | ✅ | Trusted Windows launching |
| **Auto-updater** | ✅ | ✅ | ✅ | SHA-256 verified |
| **Adult Mode** | ✅ | ✅ | ✅ | Triple-gate (age+enable+consent) |
| **18+ age gate** | ✅ | ✅ | ✅ | Non-removable boundary |
| **Website helper** | ✅ | ✅ | ✅ | Fixed knowledge pack |
| **Authenticode signing** | ❌ | ❌ | ❌ | Unsigned builds only |
| **Live payments** | ❌ | ❌ | ❌ | Fail-closed |
| **Neural TTS/VRM** | ❌ | ❌ | ❌ | Not bundled |
| **OBS websocket** | ❌ | ❌ | ❌ | Not bundled |

---

## Dependency Compatibility

| Dependency | Version | Compatibility | Notes |
|------------|---------|---------------|-------|
| electron-updater | 6.8.9 | ✅ | Update mechanism |
| @electron/packager | 20.3.0 | ✅ | Packaging |
| @noble/hashes | 1.4.0 | ✅ | SHA-256/SHA-512 |
| rcedit | 5.0.2 | ✅ | Executable editing |
| yallist | 4.0.0 | ✅ | Internal utility |

**Security scanning**: Dependabot (npm + GitHub Actions), fail-on-severity: moderate

---

## Legal/Framework Compatibility

| Instrument | Version | Status | Notes |
|------------|---------|--------|-------|
| **Source-Available License** | LicenseRef-Eidovara-Source-Available-1.0 | ✅ Active | Not OSI open source |
| **Terms of Use** | v1.0.0 | ✅ Active | 18+ restriction |
| **Age Statement** | v1.0.0 | ✅ Active | 18+ boundary |
| **Privacy Notice** | v1.0.0 | ✅ Active | Local-first |
| **Security Policy** | v1.0.0 | ✅ Active | Unsigned builds |
| **IP Certification** | v1.0.0 | ✅ Active | Self-attestation |

**Non-negotiable boundaries** (cannot be changed without owner):
- 18+ age gate enforcement
- Source-available license (no open-source relicensing)
- No consciousness claims for Soul
- Adult Mode triple gate (age + enablement + consent)

---

## Website/API Version Matrix

| Surface | Version | URL | Status |
|---------|---------|-----|--------|
| **GitHub Pages** | v1.0.0 | `https://projectsoulbytmb.github.io/project---soul/` | ✅ Auto-deploy |
| **Cloudflare Pages** | v1.0.0 | `https://eidovara.org/` | ✅ Auto-deploy (when creds available) |
| **Service API** | v1.0.0 | `https://api.eidovara.org/` | ✅ Worker deployed |
| **Worker Helper** | v1.0.0 | Same as service | ✅ Opt-in |
| **GitHub Releases** | v1.0.0 | `releases/latest` | ✅ Auto-publish |

---

## Test Suite Compatibility

| Test Suite | v1.0.0 | Purpose |
|------------|--------|---------|
| `legal-surface.test.js` | ✅ | Legal boundary validation (62+ tests) |
| `ip-certification.test.js` | ✅ | IP self-attestation validation |
| `public-online.test.js` | ✅ | Download CTA + age gate |
| `release-019.test.js` | ✅ | v0.22.2 source compatibility |
| `release-0222.test.js` | ✅ | v0.22.2 installer metadata |
| `site-restyle.test.js` | ✅ | Website version consistency |
| `renderer-packaging.test.js` | ✅ | Electron packaging contract |
| `server.test.js` | ✅ | Worker/service endpoints |

---

## Migration Notes

### From v0.22.2 to v1.0.0

**Breaking changes**: None (v1.0.0 is stable Alpha continuation)

**Updated in v1.0.0**:
- Version string: `0.22.2` → `1.0.0` across all surfaces
- Installer filename: `Eidovara-0.22.2-Windows-x64-Setup.exe` → `Eidovara-v1.0.0-Windows-x64-Setup.exe`
- SHA-256 updated to measured v1.0.0 hash
- All website pages, legal docs, CI/CD updated

**Preserved**:
- All core functionality
- 18+ age gate enforcement
- Source-available license terms
- Adult Mode triple gate
- Local-first architecture
- No consciousness claims

---

## Version Support Policy

| Version | Support Status | End of Life |
|---------|----------------|-------------|
| **v1.0.0** | ✅ Active (Stable Alpha) | N/A - Current |
| v0.22.2 | ⚠️ Historical reference only | Archived |
| v0.19.1 | ⚠️ Historical reference only | Archived |

**Recommendation**: Always use latest v1.0.0 from `releases/latest`. Do not use historical installers.

---

## Verification Checklist for v1.0.0

- [x] All 9 website HTML pages display v1.0.0
- [x] SHA-256 F29A52F0495AB111A277780706E75ED616B6C236E25C3BDDF36E144ED5326675 consistent
- [x] Installer filename: Eidovara-v1.0.0-Windows-x64-Setup.exe
- [x] 18+ age gate on all touchpoints
- [x] Source-available license headers on all first-party files
- [x] CI/CD workflows updated for v1.0.0
- [x] Website helper (knowledge.js, assist.js) at v1.0.0
- [x] Service/Worker payloads identify v1.0.0
- [x] IP_CERTIFICATION.md updated with v1.0.0 installer hash
- [x] Legal documents (TERMS, AGE, PRIVACY, LICENSE) at v1.0.0
- [x] CHANGELOG.md has v1.0.0 at top
- [x] package.json version 1.0.0
- [x] src/renderer/index.html legal panel updated

---

## Next Version Planning

| Target | Planned | Notes |
|--------|---------|-------|
| v1.1.0 | TBD | Feature additions within 18+ framework |
| v2.0.0 | TBD | Potential major if framework changes |
| Authenticode signing | Owner action required | Requires code-signing certificate |
| Official Linux/macOS | Owner action required | Not current priority |

---

*Generated: August 21, 2026 | Eidovara v1.0.0 | Source-Available Evaluation License*