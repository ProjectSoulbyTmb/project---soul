// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH - Project Knowledge Index (GENERATED FILE - do not edit by hand).
 * Regenerate: node scripts/build-thoth-knowledge.js
 * Source of truth: public repository material only (README, package.json,
 * CHANGELOG, docs/ site titles, src/core inventory). Deterministic output.
 */
export const THOTH_KNOWLEDGE_VERSION = "1.0.0";
export const THOTH_ENTRIES = [
  {
    "id": "thoth:self",
    "title": "Thoth project knowledge",
    "patterns": [
      "\\bthoth\\b",
      "project\\s+knowledge",
      "what\\s+do\\s+you\\s+know\\s+about\\s+(?:this\\s+)?(?:project|repo)"
    ],
    "reply": "Thoth is Eidovara's local project-knowledge index: a build-time snapshot of this repository's public material -- overview, versions, core modules, workspace surface, and developer commands. It is regenerated with `node scripts/build-thoth-knowledge.js`, ships inside the app, and never sends anything anywhere.",
    "actions": [
      {
        "type": "open-view",
        "view": "dashboard",
        "label": "Open Dashboard"
      }
    ]
  },
  {
    "id": "thoth:overview",
    "title": "Project overview",
    "patterns": [
      "project\\s+overview",
      "about\\s+this\\s+(?:project|repo)",
      "what\\s+is\\s+being\\s+built"
    ],
    "reply": "Overview from README: Eidovara is a customizable Windows desktop workspace for applications, gaming, media, research, accessibility, and optional personal assistance. It is created and owned by Soul Consciousness Studios and published under the intended business name Soul Consciousness Studios ."
  },
  {
    "id": "thoth:version",
    "title": "Current version",
    "patterns": [
      "(?:current|source)\\s+version",
      "which\\s+version",
      "package\\s+version"
    ],
    "reply": "The source tree is Eidovara v1.0.0. The advertised Windows installer and its SHA-256 live in README and release metadata; ask about downloads for those facts."
  },
  {
    "id": "thoth:history",
    "title": "Release history highlights",
    "patterns": [
      "release\\s+histor(?:y|ies)",
      "changelog",
      "what\\s+changed",
      "recent\\s+releases?"
    ],
    "reply": "Most recent recorded releases: v1.0.0; v0.22.2 -- Final published Windows release: `Eidovara-0.22.2-Windows-x64-Setup.exe`, 106,691,524 byte; v0.19.1 -- Next-layer similar-app desktop chrome on the advertised v0.19.0 kernel (not a cloned launc. The full history lives in CHANGELOG.md."
  },
  {
    "id": "thoth:core-modules",
    "title": "Core modules map",
    "patterns": [
      "core\\s+modules?",
      "(?:source|code)\\s+(?:structure|layout|map)",
      "what\\s+modules\\s+exist",
      "kernel\\s+modules"
    ],
    "reply": "src/core currently has 42 modules: adult-ambient -- Procedural Adult Soul beds: heartbeat, breath, and a quiet drone.; adult-feel -- Adult Feel desk -- popular settings from Vibease-style pattern pads and; adult-intents -- Lightweight Adult Soul / Adult Media intent classifiers.; adult-life -- Adult Soul life layer -- first-party vertex animation, not VRM / Mixamo / mocap.; adult-media -- Adult Media desk -- tube/creator UX patterns on Eidovara's own library and; adult-mesh -- First-party Adult Soul figure mesh. Not VRM, not MakeHuman, not a scanned person; adult-show -- Adult Soul entertainment surface -- theater chrome the user did not have to name; adult-soul; adult-voices -- Adult Soul voice studio: every OS-installed speechSynthesis voice, ranked for; bounded-read; capabilities; companion; desktop-chrome -- Next-layer desktop chrome for Eidovara (not a cloned brand).; engine; entertainment; growth; guest-overlay; kernel; knowledge; layers -- In-app consumer workspace layers for the Soul kernel.; learning; log-redact; media-protocol; memory; modules -- First-party feature modules for the in-app Soul kernel.; now-playing; overlays; policy; presence; registry; relationship; release -- Canonical source/product and published Windows installer metadata.; runtime-engines -- Honest inventory of engines and frameworks Eidovara actually ships versus; schema; service; soul-online; store; telemetry -- No external dependencies - uses native Performance API; thoth-scribe -- THOTH -- Scribe and Protector.; updater; voices; workspace."
  },
  {
    "id": "thoth:surface",
    "title": "Workspace website surface",
    "patterns": [
      "(?:public\\s+)?(?:site|website)\\s+pages",
      "documentation\\s+surface",
      "which\\s+pages"
    ],
    "reply": "The public site publishes 18 pages from docs/: 404.html -- Page not found * Eidovara; 500.html -- Server error * Eidovara; age.html -- Age 18+ * Eidovara; assist.html -- Assist * Eidovara; download.html -- Download * Eidovara; faq.html -- FAQ * Eidovara; help.html -- Help * Eidovara; index.html -- Eidovara -- Your Windows space, organized.; legal.html -- Legal * Eidovara; licensing.html -- Rights & Licensing * Eidovara."
  },
  {
    "id": "thoth:dev-commands",
    "title": "Developer commands",
    "patterns": [
      "npm\\s+(?:run\\s+)?scripts?",
      "how\\s+do\\s+i\\s+(?:build|test|lint)",
      "developer\\s+commands",
      "dev\\s+commands"
    ],
    "reply": "Package scripts include: check, cli, dist, dist:dir, dist:linux, dist:mac:arm64, dist:mac:x64, dist:win, dist:win:installer, format, format:check, ip:deposit, lint, lint:fix, perf:check, postinstall, prepare, prepush, release:configure, release:evidence, release:manifest, server:test, smoke, start, start:test, test, test:a11y, test:coverage, test:e2e, test:e2e:headed, test:e2e:ui, test:gate. Tests run with `npm test`; lint with `npm run lint`; the Windows installer builds with `npm run dist:win:installer`."
  },
  {
    "id": "thoth:tests",
    "title": "Test suite shape",
    "patterns": [
      "how\\s+many\\s+tests",
      "test\\s+suites?",
      "what\\s+is\\s+tested"
    ],
    "reply": "The suite is 53 runnable files under tests/, executed by the Node built-in runner (`npm test`). Coverage areas include the Soul kernel, legal surfaces, release consistency, runtime engines, and this Thoth index itself."
  },
  {
    "id": "thoth:maintenance",
    "title": "Service maintenance commands",
    "patterns": [
      "maintain(?:ance)?",
      "service\\s+maintenance",
      "health\\s+check",
      "keep\\s+(?:the\\s+)?services?\\s+healthy"
    ],
    "reply": "Maintenance runs through exact operator commands only: \"run diagnostics\" opens local diagnostics; \"service status\" shows the Eidovara service panel (health/config/status); \"check for updates\" verifies GitHub Releases with mandatory checksum verification and an optional Defender scan before install; \"open backups\" reaches the backup panel for durable local state. There is no remote control path: every command runs on this device behind the admin gate.",
    "actions": [
      {
        "type": "open-diagnostics",
        "label": "Show diagnostics"
      }
    ]
  },
  {
    "id": "thoth:security",
    "title": "Security posture",
    "patterns": [
      "secure\\s+(?:the\\s+)?services?",
      "security\\s+posture",
      "protect\\s+against",
      "hardening"
    ],
    "reply": "Standing protections: sandboxed renderer with nodeIntegration off, strict CSP with connect-src none, deny-by-default navigation, fuses enabled (no runAsNode, ASAR integrity), scrypt-hashed admin gate, safeStorage-encrypted secrets when Windows protection is available, checksum-mandatory updates downloaded only over HTTPS from official releases with Mark-of-the-Web plus optional Defender scan, secret redaction in logs, and zero telemetry. Thoth adds a frozen operator catalog: default-deny against anything that is not an exact operator command.",
    "actions": [
      {
        "type": "open-view",
        "view": "settings",
        "label": "Open Settings"
      }
    ]
  },
  {
    "id": "thoth:authorization",
    "title": "Operator-only command policy",
    "patterns": [
      "only\\s+(?:follow|my)\\s+commands?",
      "who\\s+can\\s+command",
      "operator\\s+commands?",
      "authorization\\s+policy",
      "permission\\s+policy"
    ],
    "reply": "Thoth follows only your specific commands. Authorization is exact-match against a frozen catalog of read-class actions (\"run diagnostics\", \"service status\", \"check for updates\", \"open settings\", \"open backups\", \"open privacy notice\"), bound to an active operator session from the scrypt admin gate. Anything else - rephrased, injected, escalated, or unknown - is refused by default and written to the audit trail. There is no fuzzy matching and no way for conversation content to mint new permissions.",
    "actions": [
      {
        "type": "open-view",
        "view": "identity",
        "label": "Identity & consent"
      }
    ]
  },
  {
    "id": "thoth:settings-schema",
    "title": "Profile schema",
    "patterns": [
      "settings?\\s+schema",
      "profile\\s+schema",
      "what\\s+(?:is\\s+)?stored\\s+about\\s+me",
      "schema\\s+version"
    ],
    "reply": "Profiles follow schema v19: one JSON profile holding identity/consent state, assistant preferences, continuity and self-model, conversations, memories, and workspace layers. Everything stays local in the Windows application-data directory, encrypted with safeStorage when Windows protection is available.",
    "actions": [
      {
        "type": "open-view",
        "view": "settings",
        "label": "Open Settings"
      }
    ]
  },
  {
    "id": "thoth:ipc-surface",
    "title": "Internal capability surface",
    "patterns": [
      "ipc\\s+channels?",
      "internal\\s+capabilit(?:y|ies)",
      "what\\s+can\\s+the\\s+app\\s+do\\s+internally"
    ],
    "reply": "The Electron main process exposes 83 whitelisted IPC channels, and sandboxed renderers can reach nothing beyond them. Highlights: overlay:close, overlay:history, overlay:navigate, overlay:status, overlay:toggleTop, soul:acceptAgeGate, soul:addAdultFolderBookmark, soul:addApplication, soul:addDiscoveredApplication, soul:adminConfigure, soul:adminLogin, soul:adminLogout."
  },
  {
    "id": "thoth:intents-catalog",
    "title": "Intent catalog",
    "patterns": [
      "intent\\s+catalog",
      "which\\s+intents",
      "what\\s+can\\s+you\\s+open",
      "supported\\s+intents?"
    ],
    "reply": "The Soul kernel routes 51 intents (for example: accessibility, adult-media, adult-media-blocked, adult-session, adult-soul, apps, backups, chat, cheatsheet, conversation, create, dashboard, entertainment, favorites, focus, focus-stop). Each maps to safe UI actions through actionsForIntent in the kernel."
  },
  {
    "id": "thoth:legal-summaries",
    "title": "Plain-language legal summaries",
    "patterns": [
      "plain[- ]language\\s+legal",
      "summarize\\s+(?:terms|privacy|age)",
      "can\\s+i\\s+use\\s+(?:this|eidovara)\\s+commercially"
    ],
    "reply": "Short versions, not legal advice -- AGE: Eidovara is **adult-only software**. You must be at least **18 years old** to download, install, or use the Windows desktop app, CLI, or related official releases. | PRIVACY: This notice describes Eidovara v1.0.0 Stable Alpha (Windows 10/11 x64). It is a self-declared product notice, **not** an independent audit, ISO certification, or guarantee of compl | TERMS: These product terms describe advertised use of the current release. They are **not legal advice**, a lawyer letterhead, a certification of compliance, or a substitute for qualified",
    "actions": [
      {
        "type": "open-legal",
        "legal": "about",
        "label": "About & legal"
      }
    ]
  },
  {
    "id": "thoth:dependencies",
    "title": "Dependency inventory",
    "patterns": [
      "dependenc(?:ies|y)",
      "third[- ]party\\s+(?:code|packages)",
      "supply\\s+chain"
    ],
    "reply": "Runtime dependencies stay minimal by policy: electron-updater@6.8.9. Dev tooling adds 15 pinned packages (runner, lint, packaging). CI runs dependency review, CodeQL, and scorecards on every change."
  },
  {
    "id": "thoth:pipeline",
    "title": "CI and release pipeline",
    "patterns": [
      "ci\\s+pipeline",
      "how\\s+(?:is\\s+)?(?:it\\s+)?(?:built|shipped|released)",
      "release\\s+pipeline",
      "github\\s+actions?"
    ],
    "reply": "17 GitHub Actions pipelines guard this repo (auto-debug (Auto-Debug); auto-fix (Auto-Fix); ci (CI); cloudflare-pages (Deploy Cloudflare Pages); cloudflare-worker (Deploy Cloudflare Worker); codeql (CodeQL); dependency-review (Dependency review); link-check (Docs Link Check); pages (Deploy project website); release-drafter (Release Drafter); release-windows (Release Windows); safeguards (Safeguards); scorecards (Scorecards supply-chain security); security-hardening (Security Hardening Audit); security (Security checks); stale (Stale Queue Hygiene); windows-ci (Windows CI)). Releases build a Windows installer, pin its SHA-256, attest build provenance, and publish an SBOM."
  },
  {
    "id": "thoth:localization",
    "title": "Language support",
    "patterns": [
      "languages?\\s+(?:are\\s+)?(?:supported|available)",
      "translat(?:ions?|ed)",
      "\\bi18n\\b",
      "\\blocalization\\b"
    ],
    "reply": "The workspace UI localizes to EN, ES, FR, DE with English fallback; locale strings live in src/renderer/localization.js."
  }
];
export const THOTH_RULES = THOTH_ENTRIES.map(entry => ({
  id: entry.id,
  re: new RegExp(entry.patterns.join('|'), 'i'),
}));
