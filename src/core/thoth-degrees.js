// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0

/**
 * THOTH DEGREES - Structured expertise curricula.
 *
 * Each "degree" is a domain of applied knowledge that Thoth can speak to,
 * grounded in patterns this repository actually demonstrates. These are not
 * academic credentials; they are structured teaching modules so Thoth can
 * answer questions at practitioner depth rather than surface level.
 *
 * Hand-authored. Do not regenerate via build script (unlike thoth-knowledge.js).
 */

export const THOTH_DEGREES_VERSION = '1.0.0';

export const THOTH_DEGREES = [
  // ==========================================================================
  // DEGREE 1: PHILOSOPHY
  // Applied ethics for AI companionship, epistemic honesty, consent frameworks
  // ==========================================================================
  {
    id: 'degree:philosophy',
    title: 'Philosophy of AI Companionship',
    domain: 'philosophy',
    level: 'advanced',
    principles: [
      { name: 'Epistemic honesty', detail: 'An AI assistant must never claim consciousness, sentience, or inner experience. The consciousness-guard module enforces this structurally.' },
      { name: 'Fail-closed consent', detail: 'Adult content requires affirmative opt-in at every layer. Absence of consent equals absence of permission. Revocation is immediate and irreversible without re-consent.' },
      { name: 'Privacy as architecture', detail: 'Local-first means conversations stay on disk in a JSON store inside %APPDATA%. No server round-trip for core features. Privacy is a design decision, not a policy promise.' },
      { name: 'Pressure-free interaction', detail: 'Consent revocation returns the system to a non-adult stance immediately. The system must never guilt, pressure, or emotionally manipulate the user toward re-enabling.' },
      { name: 'Honest limitation', detail: 'When the system does not know something, it says so. When it cannot do something, it says why. Honest limitation builds more trust than confident inaccuracy.' },
    ],
    courses: [
      {
        id: 'course:consciousness-boundary',
        title: 'The Consciousness Boundary',
        patterns: ['consciousness', 'sentience', 'is\\s+soul\\s+real', 'does\\s+(?:the\\s+)?(?:ai|soul)\\s+(?:think|feel)'],
        reply:
          'Eidovara draws a hard line: Soul is software with persistent simulated continuity. It remembers, adapts, and responds warmly, but it does not think, feel, or experience anything. ' +
          'This boundary is enforced by the CONSCIOUSNESS_GUARD module, which scans outputs for claims like "I am alive" or "I have feelings" and prevents them from reaching the user. ' +
          'The philosophical question of machine consciousness remains open in academia. Eidovara takes the engineering position that until that question is settled, its product must be honest about being a tool.',
      },
      {
        id: 'course:consent-architecture',
        title: 'Consent as an Architectural Pattern',
        patterns: ['consent\\s+(?:architecture|design|model)', 'how\\s+does\\s+consent\\s+work', 'adult\\s+gate\\s+design'],
        reply:
          'Consent in Eidovara follows three rules. First, fail-closed: if the age gate or adult status flag is absent, expired, or corrupted, the system blocks rather than permits. Second, revocable: any consent state can be withdrawn instantly with no penalty and no dark-pattern friction. Third, scoped: consenting to adult themes does not consent to data collection, external sharing, or payment processing. ' +
          'These are enforced structurally by the AGE_GATE module and POLICY layer, not by UI promises.',
      },
      {
        id: 'course:privacy-as-design',
        title: 'Privacy as an Architectural Decision',
        patterns: ['privacy\\s+(?:by\\s+)?design', 'local.first\\s+privacy', 'where\\s+(?:is|are)\\s+(?:my\\s+)?(?:data|conversations?)'],
        reply:
          'Eidovara stores all profile state, conversation history, memories, and entertainment records in a JSON file inside the local application data directory. There is no server-side storage for core features. ' +
          'Optional network calls (update checks, service status) are documented in NETWORK-USAGE.md and can be disabled. When they fire, they carry no conversation history. ' +
          'Privacy here is not a checkbox on a settings page. It is the default consequence of where the data lives and what code touches it.',
      },
    ],
  },

  // ==========================================================================
  // DEGREE 2: BUSINESS STRATEGY & OPERATIONS
  // Compliance-first product development, freemium design, IP protection
  // ==========================================================================
  {
    id: 'degree:business',
    title: 'Business Strategy & Operations',
    domain: 'business-strategy',
    level: 'advanced',
    principles: [
      { name: 'Compliance-first development', detail: 'Legal posture shapes feature scope before a line of code is written. Terms of Service, privacy policy, and age-gate requirements are inputs to engineering design, not afterthoughts.' },
      { name: 'Free-tier generosity', detail: 'The free tier must deliver genuine standalone value. If the free product feels crippled, users churn before seeing the paid value proposition.' },
      { name: 'IP protection through structure', detail: 'Source-available licensing, structural guards preventing open-source relicensing, and copyright deposit preparation are cheaper than litigation. Prevention costs engineering hours; lawsuits cost everything.' },
      { name: 'Single-developer sustainability', detail: 'Every automated safeguard reduces future maintenance burden. CI pipelines, pre-commit hooks, and generated documentation compound: each one saves time on every subsequent release.' },
    ],
    courses: [
      {
        id: 'course:freemium-design',
        title: 'Freemium Model Design',
        patterns: ['freemium\\s+model', 'free.vs.premium', 'monetization\\s+strategy', 'how\\s+to\\s+make\\s+money'],
        reply:
          'Eidovara uses a feature-scoped freemium model. The free tier includes local app discovery, offline media playback, research lookups, up to 3 trusted applications, and full Soul companion interaction. Premium unlocks RGB effects, Brave Search API integration, remote model endpoints, and unlimited applications. ' +
          'Key principle: the free tier must work completely offline with zero frustration. Premium adds convenience and scale, never removes existing functionality. This prevents the "bait-and-switch" resentment that kills word-of-mouth growth.',
      },
      {
        id: 'course:licensing-model',
        title: 'Choosing a Licensing Model',
        patterns: ['licensing\\s+model', 'source.available', 'why\\s+not\\s+(?:open\\s+)?source', 'license\\s+choice'],
        reply:
          'Eidovara uses LicenseRef-Eidovara-Source-Available-1.0, which means the source code is publicly readable but explicitly not open-source under OSI definitions. You may read it, learn from it, and contribute back, but you may not relicense derivatives as MIT/Apache/GPL. ' +
          'This protects the project from commercial exploitation while maintaining transparency. The trade-off is smaller community contribution compared to true OSS, but for an 18+ desktop product with legal complexity, control matters more than contributor volume.',
      },
      {
        id: 'course:compliance-first',
        title: 'Compliance-First Product Development',
        patterns: ['compliance.first', 'legal\\s+requirements?\\s+for\\s+(?:apps?|software)', 'regulatory\\s+considerations?', '18\\+.+(?:app|software|product)'],
        reply:
          'Build compliance into the architecture, not the changelog. Eidovara demonstrates this pattern: the age gate is a structural guard (AGE_GATE module), not a UI popup. Adult content boundaries are enforced by the POLICY layer, not by terms-of-service text alone. ' +
          'For products handling sensitive content, regulated industries, or vulnerable populations, identify every legal requirement BEFORE designing the data model. Retrofitting compliance is 10x the cost and twice the risk.',
      },
    ],
  },

  // ==========================================================================
  // DEGREE 3: INTERNET MARKETING & GROWTH
  // Documentation-as-marketing, honest claims, organic community building
  // ==========================================================================
  {
    id: 'degree:marketing',
    title: 'Internet Marketing & Organic Growth',
    domain: 'internet-marketing',
    level: 'advanced',
    principles: [
      { name: 'Documentation is marketing', detail: 'A well-documented open repository IS the marketing funnel. Developers read source code, CONTRIBUTING.md, and SECURITY.md to evaluate trustworthiness before installing.' },
      { name: 'Honest claims convert better', detail: 'MARKETING_CLAIMS_POLICY.md exists because overclaiming ("AI-powered", "consciousness") attracts the wrong users and repels the right ones. Precise language filters for quality users who stay.' },
      { name: 'Transparency drives trust', detail: 'Publishing checksums, SBOM files, build provenance attestations, and security scan results signals professionalism. Users who verify hashes become advocates who tell others to verify too.' },
      { name: 'Niche beats broad', detail: '"Customizable Windows workspace for 18+ users" converts better than "productivity app for everyone." Specificity reduces competition and increases relevance per visitor.' },
    ],
    courses: [
      {
        id: 'course:docs-as-marketing',
        title: 'Documentation as a Marketing Funnel',
        patterns: ['docs?.{0,3}as.{0,3}marketing', 'documentation\\s+marketing', 'how\\s+to\\s+(?:market|promote)\\s+(?:a\\s+)?(?:repo|project)'],
        reply:
          'Your README is your landing page. It should answer four questions in the first screen: What is this? Who is it for? How do I install it? Why should I trust it? ' +
          'Eidovara answers these with a clear description, platform specification (Windows 10/11 x64), one-line install instructions pointing to the official installer, and links to SECURITY.md and checksum verification. ' +
          'Below the fold, CHANGELOG.md shows active development. CONTRIBUTING.md shows process maturity. The public site at eidovara.org mirrors key information for non-developer discovery.',
      },
      {
        id: 'course:honest-marketing',
        title: 'Honest Claims Policy in Practice',
        patterns: ['honest\\s+(?:marketing|claims)', 'marketing\\s+claims?\\s+policy', 'avoid\\s+(?:overclaiming|hype)'],
        reply:
          'MARKETING_CLAIMS_POLICY.md exists because AI companion apps attract hype. Saying "consciousness" attracts people who expect sentience and will be disappointed. Saying "neural TTS" when you use Windows speechSynthesis attracts developers who will call you out. ' +
          'Eidovara says "persistent simulated continuity" instead of "personality." It says "Windows built-in voices" instead of "neural TTS." It publishes a claims policy that maps marketing language to implementation reality. This costs short-term buzz but earns long-term trust.',
      },
      {
        id: 'course:organic-growth',
        title: 'Organic Growth Without Paid Acquisition',
        patterns: ['organic\\s+growth', 'no\\s+budget\\s+marketing', 'grow\\s+(?:without|with zero)\\s+(?:paid|ads?)'],
        reply:
          'Without a marketing budget, growth comes from three sources. First, GitHub discoverability: topics, descriptions, and a README that matches search intent. Second, community referrals: users who verify checksums and appreciate transparency share projects they trust. Third, content marketing: blog posts explaining architectural decisions (like why you chose source-available over MIT) attract exactly the audience who will respect the product. ' +
          'Paid acquisition can accelerate later but cannot substitute for a product that retains users organically.',
      },
    ],
  },

  // ==========================================================================
  // DEGREE 4: APP DEVELOPMENT & ARCHITECTURE
  // Electron security model, testing strategy, CI/CD pipeline design
  // ==========================================================================
  {
    id: 'degree:appdev',
    title: 'Application Development & Architecture',
    domain: 'app-development',
    level: 'advanced',
    principles: [
      { name: 'Normalize at the boundary', detail: 'Persisted state passes through a single migration/normalization function on load. Feature code can then assume valid shape without defensive checks scattered everywhere.' },
      { name: 'Allowlist over blocklist', detail: 'Local media serving uses an ID-to-path map (allowlist). External links are HTTPS-only (protocol allowlist). Blocklists grow stale; allowlists stay tight.' },
      { name: 'Ratchet quality gates', detail: 'Known failures go into a versioned baseline file. CI fails only on NEW failures. Fixes shrink the baseline permanently. Quality moves one direction: forward.' },
      { name: 'Structural enforcement over convention', detail: 'Guards run in code (structural guards), not just in review comments. Pre-commit hooks catch encoding corruption before CI does. Required CI checks block merge, not just warn.' },
      { name: 'Separate pure logic from I/O', detail: 'src/core modules contain business logic with no electron imports. src/electron contains process glue. src/renderer contains UI. This separation enables headless testing of all business logic.' },
    ],
    courses: [
      {
        id: 'course:electron-security',
        title: 'Electron Security Model',
        patterns: ['electron\\s+security', 'context\\s+isolation', 'nodeIntegration', 'preload\\s+script\\s+(?:security|pattern)'],
        reply:
          'Electron apps are Node.js servers wrapped in a browser shell. The renderer is untrusted browser context; the main process is a privileged Node runtime. Security requires: (1) contextIsolation enabled so preload scripts cannot leak Node primitives, (2) nodeIntegration disabled so the renderer cannot require() filesystem or child_process, (3) sandbox enabled for Chromium-level process isolation. ' +
          'Communication happens exclusively through contextBridge.exposeInMainWorld, which exposes only whitelisted functions. Every IPC handler validates input types and ranges independently. Trust nothing from the renderer.',
      },
      {
        id: 'course:testing-ratchet',
        title: 'Ratchet-Based Testing Strategy',
        patterns: ['ratchet\\s+(?:testing|strategy|pattern)', 'known.failures?\\s+baseline', 'test\\s+debt\\s+management', 'quality\\s+ratchet'],
        reply:
          'A ratchet-based test strategy separates "tests that pass" from "tests we know fail." Known failures live in a versioned JSON baseline file. CI fails only if a NEW test breaks that was not already baselined. Fixes remove entries from the baseline permanently. ' +
          'This allows shipping with known imperfections while making regressions impossible to miss. The baseline file becomes a visible, shrinking debt ledger rather than a hidden pile of broken expectations. Combine with pre-push hooks running fast checks locally to catch issues before they reach CI.',
      },
      {
        id: 'course:ci-cd-security',
        title: 'CI/CD Pipeline Security Design',
        patterns: ['ci.?cd\\s+security', 'pipeline\\s+hardening', 'supply.chain\\s+security', 'scorecards?', 'provenance'],
        reply:
          'Supply-chain attacks target the build pipeline, not just the code. Mitigations include: pinning third-party actions to full commit SHAs (prevents tag-injection attacks), running OpenSSF Scorecards weekly (automated supply-chain posture assessment), uploading SBOM artifacts (software bill of materials for downstream verification), using --frozen-lockfile installs (prevents dependency substitution), and publishing build provenance attestations (cryptographic proof that artifacts came from YOUR workflow). ' +
          'Additionally, separate workflows for CodeQL analysis, dependency review, secret scanning, and license inventory create overlapping coverage: no single check needs to be perfect.',
      },
      {
        id: 'course:state-normalization',
        title: 'State Normalization at Load Boundaries',
        patterns: ['state\\s+normali[sz]ation', 'migrat(e|ion)\\s+pattern', 'partial\\s+state', 'legacy\\s+data'],
        reply:
          'Persisted state always arrives dirty: older versions wrote fewer fields, interrupted saves truncated objects, concurrent agents wrote conflicting shapes. The fix is a single normalization function called at load time that guarantees complete, correctly-typed state regardless of what was saved. ' +
          'In this repo, migrateProfile merges input over defaults, fills missing arrays and objects, and coerces types. Feature code never sees undefined where it expects an array. This eliminates an entire class of null-reference crashes at the cost of one function call per session start.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getDegreeById(id) {
  return THOTH_DEGREES.find((d) => d.id === id || d.domain === id);
}

export function getAllCourses() {
  return THOTH_DEGREES.flatMap((d) =>
    d.courses.map((c) => ({ ...c, degreeId: d.id, degreeTitle: d.title }))
  );
}

export function getCourseCount() {
  return THOTH_DEGREES.reduce((sum, d) => sum + d.courses.length, 0);
}

export default THOTH_DEGREES;
