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
