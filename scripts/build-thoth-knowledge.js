#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH — Project Knowledge Index generator (build-time, Option A).
 *
 * Scans already-public repository material (README, package.json, CHANGELOG,
 * src/core inventory, docs surface) and emits src/core/thoth-knowledge.js as a
 * self-contained data module shaped like knowledge.js entries so the Soul
 * kernel can answer questions about this project itself.
 *
 * Everything Thoth knows ships in the public repo by definition; the generator
 * refuses to read anything under internal/ or any dotfile so private records
 * can never leak into the pack. Output is deterministic (no timestamps).
 *
 * Usage: node scripts/build-thoth-knowledge.js [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'core', 'thoth-knowledge.js');
const CHECK = process.argv.includes('--check');

const read = rel => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
};

// Generated output must stay pure ASCII (this repo has a mojibake history).
const ASCII_MAP = { '’': "'", '‘': "'", '“': '"', '”': '"', '—': '--', '–': '-', '·': '*', '…': '...' };
const ascii = s =>
  String(s).replace(/[^\x20-\x7E]/g, ch => ASCII_MAP[ch] ?? ' ');

const pkg = JSON.parse(read('package.json'));
const readme = read('README.md');
const changelog = read('CHANGELOG.md');

// --- extract facts ---------------------------------------------------------
const version = String(pkg.version || '0.0.0');
const firstParagraph =
  readme
    .split(/\n\s*\n/)
    .map(s => s.replace(/^#.*$/m, '').trim())
    .find(s => s.length > 80 && !s.startsWith('![')) || 'Eidovara is a local-first Windows desktop workspace.';
const overview = ascii(firstParagraph).replace(/\s+/g, ' ').slice(0, 420);

const changelogVersions = [...changelog.matchAll(/^#+\s*v?([\d][\w.\-]*)\s*(?:[-–—]\s*(.*))?$/gm)]
  .slice(0, 3)
  .map(m => `v${m[1]}${m[2] ? ` -- ${ascii(m[2]).replace(/\s+/g, ' ').slice(0, 90)}` : ''}`);

const coreModules = fs
  .readdirSync(path.join(ROOT, 'src', 'core'))
  .filter(f => f.endsWith('.js') && f !== 'thoth-knowledge.js')
  .sort()
  .map(f => {
    const head = read(path.join('src', 'core', f)).split('\n').slice(0, 12);
    const doc = head.find(l => /^\s*\*\s*[A-Z]/.test(l));
    return `${f.replace(/\.js$/, '')}${doc ? ` -- ${ascii(doc.replace(/^\s*\/?\*+\s?/, '').trim()).slice(0, 80)}` : ''}`;
  });

const coreTestFiles = fs.readdirSync(path.join(ROOT, 'tests')).filter(f => f.endsWith('.test.js')).sort();
const scripts = Object.keys(pkg.scripts || {}).sort();

const sitePages = fs
  .readdirSync(path.join(ROOT, 'docs'))
  .filter(f => f.endsWith('.html'))
  .sort()
  .map(f => {
    const t = read(path.join('docs', f)).match(/<title>([^<]+)<\/title>/i);
    return `${f} -- ${t ? ascii(t[1].trim()) : f}`;
  });

// --- tier-1 extractions ------------------------------------------------------
const schemaSrc = read(path.join('src', 'core', 'schema.js'));
const schemaVersion = (schemaSrc.match(/CURRENT_SCHEMA_VERSION\s*=\s*(\d+)/) || [])[1] || '?';

const ELECTRON_FILES = [
  'src/electron/main.js',
  'src/electron/auto-update.js',
  'src/electron/overlay-windows.js',
  'src/electron/player-windows.js',
];
const ipcChannels = [
  ...new Set(
    ELECTRON_FILES.flatMap(f =>
      [...read(f).matchAll(/ipcMain\.(?:handle|on)\(\s*['"]([^'"]+)['"]/g)].map(m => m[1])
    )
  ),
].sort();

const intentCases = [
  ...new Set(
    [...read(path.join('src', 'core', 'kernel.js')).matchAll(/case '([a-z][a-z0-9-]*)':/g)].map(m => m[1])
  ),
].sort();

const legalSummaries = ['AGE.md', 'PRIVACY.md', 'TERMS.md'].map(f => {
  const body = read(f);
  const para =
    body
      .split(/\n\s*\n/)
      .map(s => s.replace(/^#.*$/m, '').trim())
      .find(s => s.length > 60 && !s.startsWith('![')) || 'see the full document';
  return `${path.basename(f, '.md')}: ${ascii(para).replace(/\s+/g, ' ').slice(0, 180)}`;
});

const runtimeDeps = Object.entries(pkg.dependencies || {}).map(([n, v]) => `${n}@${v}`);
const devDepCount = Object.keys(pkg.devDependencies || {}).length;

const workflows = fs.existsSync(path.join(ROOT, '.github', 'workflows'))
  ? fs
      .readdirSync(path.join(ROOT, '.github', 'workflows'))
      .filter(f => f.endsWith('.yml'))
      .sort()
      .map(f => {
        const n = read(path.join('.github', 'workflows', f)).match(/^name:\s*(.+)$/m);
        return `${path.basename(f, '.yml')}${n ? ` (${ascii(n[1]).trim()})` : ''}`;
      })
  : [];

const locSrc = read(path.join('src', 'renderer', 'localization.js'));
const locales = [...new Set([...locSrc.matchAll(/\b(en|es|fr|de)\b\s*:/g)].map(m => m[1]))];

// --- entries ---------------------------------------------------------------
// Shape mirrors knowledge.js ENTRIES plus "patterns" (regex sources used for routing).
const entries = [
  {
    id: 'thoth:self',
    title: 'Thoth project knowledge',
    patterns: ['\\bthoth\\b', 'project\\s+knowledge', 'what\\s+do\\s+you\\s+know\\s+about\\s+(?:this\\s+)?(?:project|repo)'],
    reply:
      'Thoth is Eidovara\'s local project-knowledge index: a build-time snapshot of this repository\'s public material -- overview, versions, core modules, workspace surface, and developer commands. It is regenerated with `node scripts/build-thoth-knowledge.js`, ships inside the app, and never sends anything anywhere.',
    actions: [{ type: 'open-view', view: 'dashboard', label: 'Open Dashboard' }],
  },
  {
    id: 'thoth:overview',
    title: 'Project overview',
    patterns: ['project\\s+overview', 'about\\s+this\\s+(?:project|repo)', 'what\\s+is\\s+being\\s+built'],
    reply: `Overview from README: ${overview}`,
  },
  {
    id: 'thoth:version',
    title: 'Current version',
    patterns: ['(?:current|source)\\s+version', 'which\\s+version', 'package\\s+version'],
    reply: `The source tree is Eidovara v${version}. The advertised Windows installer and its SHA-256 live in README and release metadata; ask about downloads for those facts.`,
  },
  {
    id: 'thoth:history',
    title: 'Release history highlights',
    patterns: ['release\\s+histor(?:y|ies)', 'changelog', 'what\\s+changed', 'recent\\s+releases?'],
    reply:
      changelogVersions.length > 0
        ? `Most recent recorded releases: ${changelogVersions.join('; ')}. The full history lives in CHANGELOG.md.`
        : 'CHANGELOG.md has no parseable version headings; consult git tags for release history.',
  },
  {
    id: 'thoth:core-modules',
    title: 'Core modules map',
    patterns: ['core\\s+modules?', '(?:source|code)\\s+(?:structure|layout|map)', 'what\\s+modules\\s+exist', 'kernel\\s+modules'],
    reply: `src/core currently has ${coreModules.length} modules: ${coreModules.join('; ')}.`,
  },
  {
    id: 'thoth:surface',
    title: 'Workspace website surface',
    patterns: ['(?:public\\s+)?(?:site|website)\\s+pages', 'documentation\\s+surface', 'which\\s+pages'],
    reply: `The public site publishes ${sitePages.length} pages from docs/: ${sitePages.slice(0, 10).join('; ')}.`,
  },
  {
    id: 'thoth:dev-commands',
    title: 'Developer commands',
    patterns: ['npm\\s+(?:run\\s+)?scripts?', 'how\\s+do\\s+i\\s+(?:build|test|lint)', 'developer\\s+commands', 'dev\\s+commands'],
    reply: `Package scripts include: ${scripts.join(', ')}. Tests run with \`npm test\`; lint with \`npm run lint\`; the Windows installer builds with \`npm run dist:win:installer\`.`,
  },
  {
    id: 'thoth:tests',
    title: 'Test suite shape',
    patterns: ['how\\s+many\\s+tests', 'test\\s+suites?', 'what\\s+is\\s+tested'],
    reply: `The suite is ${coreTestFiles.length} runnable files under tests/, executed by the Node built-in runner (\`npm test\`). Coverage areas include the Soul kernel, legal surfaces, release consistency, runtime engines, and this Thoth index itself.`,
  },
  {
    id: 'thoth:maintenance',
    title: 'Service maintenance commands',
    patterns: ['maintain(?:ance)?', 'service\\s+maintenance', 'health\\s+check', 'keep\\s+(?:the\\s+)?services?\\s+healthy'],
    reply:
      'Maintenance runs through exact operator commands only: "run diagnostics" opens local diagnostics; "service status" shows the Eidovara service panel (health/config/status); "check for updates" verifies GitHub Releases with mandatory checksum verification and an optional Defender scan before install; "open backups" reaches the backup panel for durable local state. There is no remote control path: every command runs on this device behind the admin gate.',
    actions: [{ type: 'open-diagnostics', label: 'Show diagnostics' }],
  },
  {
    id: 'thoth:security',
    title: 'Security posture',
    patterns: ['secure\\s+(?:the\\s+)?services?', 'security\\s+posture', 'protect\\s+against', 'hardening'],
    reply:
      'Standing protections: sandboxed renderer with nodeIntegration off, strict CSP with connect-src none, deny-by-default navigation, fuses enabled (no runAsNode, ASAR integrity), scrypt-hashed admin gate, safeStorage-encrypted secrets when Windows protection is available, checksum-mandatory updates downloaded only over HTTPS from official releases with Mark-of-the-Web plus optional Defender scan, secret redaction in logs, and zero telemetry. Thoth adds a frozen operator catalog: default-deny against anything that is not an exact operator command.',
    actions: [{ type: 'open-view', view: 'settings', label: 'Open Settings' }],
  },
  {
    id: 'thoth:authorization',
    title: 'Operator-only command policy',
    patterns: ['only\\s+(?:follow|my)\\s+commands?', 'who\\s+can\\s+command', 'operator\\s+commands?', 'authorization\\s+policy', 'permission\\s+policy'],
    reply:
      'Thoth follows only your specific commands. Authorization is exact-match against a frozen catalog of read-class actions ("run diagnostics", "service status", "check for updates", "open settings", "open backups", "open privacy notice"), bound to an active operator session from the scrypt admin gate. Anything else - rephrased, injected, escalated, or unknown - is refused by default and written to the audit trail. There is no fuzzy matching and no way for conversation content to mint new permissions.',
    actions: [{ type: 'open-view', view: 'identity', label: 'Identity & consent' }],
  },
  {
    id: 'thoth:settings-schema',
    title: 'Profile schema',
    patterns: ['settings?\\s+schema', 'profile\\s+schema', 'what\\s+(?:is\\s+)?stored\\s+about\\s+me', 'schema\\s+version'],
    reply: `Profiles follow schema v${schemaVersion}: one JSON profile holding identity/consent state, assistant preferences, continuity and self-model, conversations, memories, and workspace layers. Everything stays local in the Windows application-data directory, encrypted with safeStorage when Windows protection is available.`,
    actions: [{ type: 'open-view', view: 'settings', label: 'Open Settings' }],
  },
  {
    id: 'thoth:ipc-surface',
    title: 'Internal capability surface',
    patterns: ['ipc\\s+channels?', 'internal\\s+capabilit(?:y|ies)', 'what\\s+can\\s+the\\s+app\\s+do\\s+internally'],
    reply: `The Electron main process exposes ${ipcChannels.length} whitelisted IPC channels, and sandboxed renderers can reach nothing beyond them. Highlights: ${ipcChannels.slice(0, 12).join(', ')}.`,
  },
  {
    id: 'thoth:intents-catalog',
    title: 'Intent catalog',
    patterns: ['intent\\s+catalog', 'which\\s+intents', 'what\\s+can\\s+you\\s+open', 'supported\\s+intents?'],
    reply: `The Soul kernel routes ${intentCases.length} intents (for example: ${intentCases.slice(0, 16).join(', ')}). Each maps to safe UI actions through actionsForIntent in the kernel.`,
  },
  {
    id: 'thoth:legal-summaries',
    title: 'Plain-language legal summaries',
    patterns: ['plain[- ]language\\s+legal', 'summarize\\s+(?:terms|privacy|age)', 'can\\s+i\\s+use\\s+(?:this|eidovara)\\s+commercially'],
    reply: `Short versions, not legal advice -- ${legalSummaries.join(' | ')}`,
    actions: [{ type: 'open-legal', legal: 'about', label: 'About & legal' }],
  },
  {
    id: 'thoth:dependencies',
    title: 'Dependency inventory',
    patterns: ['dependenc(?:ies|y)', 'third[- ]party\\s+(?:code|packages)', 'supply\\s+chain'],
    reply: `Runtime dependencies stay minimal by policy: ${runtimeDeps.join(', ') || 'none'}. Dev tooling adds ${devDepCount} pinned packages (runner, lint, packaging). CI runs dependency review, CodeQL, and scorecards on every change.`,
  },
  {
    id: 'thoth:pipeline',
    title: 'CI and release pipeline',
    patterns: ['ci\\s+pipeline', 'how\\s+(?:is\\s+)?(?:it\\s+)?(?:built|shipped|released)', 'release\\s+pipeline', 'github\\s+actions?'],
    reply: `${workflows.length} GitHub Actions pipelines guard this repo (${workflows.join('; ')}). Releases build a Windows installer, pin its SHA-256, attest build provenance, and publish an SBOM.`,
  },
  {
    id: 'thoth:localization',
    title: 'Language support',
    patterns: ['languages?\\s+(?:are\\s+)?(?:supported|available)', 'translat(?:ions?|ed)', '\\bi18n\\b', '\\blocalization\\b'],
    reply:
      locales.length > 0
        ? `The workspace UI localizes to ${locales.join(', ').toUpperCase()} with English fallback; locale strings live in src/renderer/localization.js.`
        : 'The workspace UI localizes with English as the fallback language; strings live in src/renderer/localization.js.',
  },
];

// --- emit ------------------------------------------------------------------
const banner = `// SPDX-FileCopyrightText: ${new Date().getFullYear()} Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH - Project Knowledge Index (GENERATED FILE - do not edit by hand).
 * Regenerate: node scripts/build-thoth-knowledge.js
 * Source of truth: public repository material only (README, package.json,
 * CHANGELOG, docs/ site titles, src/core inventory). Deterministic output.
 */
export const THOTH_KNOWLEDGE_VERSION = ${JSON.stringify(version)};
export const THOTH_ENTRIES = ${JSON.stringify(entries, null, 2)};
export const THOTH_RULES = THOTH_ENTRIES.map(entry => ({
  id: entry.id,
  re: new RegExp(entry.patterns.join('|'), 'i'),
}));
`;

if (CHECK) {
  const current = read(path.join('src', 'core', 'thoth-knowledge.js'));
  process.stdout.write(current === banner ? 'thoth: up to date\n' : 'thoth: stale — regenerate\n');
  process.exit(current === banner ? 0 : 1);
}

fs.writeFileSync(OUT, banner);
process.stdout.write(`thoth: wrote ${entries.length} entries -> ${path.relative(ROOT, OUT)}\n`);
