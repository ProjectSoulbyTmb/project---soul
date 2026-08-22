// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Test-failure triage generator.
 * Reads a captured test run, groups failures by suite, extracts the first
 * assertion error + expected/actual per group, and writes docs/TEST_TRIAGE.md
 * — an actionable fix checklist for humans or AI sessions.
 * Usage: node scripts/triage-failures.mjs <test-output-file>
 */
import fs from 'node:fs';

const src = process.argv[2] && fs.existsSync(process.argv[2])
  ? fs.readFileSync(process.argv[2], 'utf8')
  : fs.readFileSync(0, 'utf8');
const clean = src.replace(/\x1b\[[0-9;]*m/g, '');

const suites = new Map();
const re = /✖ ([^\n]+?) \((\d+(?:\.\d+)?)ms?\)\n([\s\S]*?)(?=\n✖ |\nℹ |$)/g;
let m;
while ((m = re.exec(clean))) {
  const name = m[1].trim();
  const body = m[3];
  const err = (body.match(/AssertionError \[[^\]]*\]: ([^\n]+)/) ||
               body.match(/Error: ([^\n]+)/) || [])[1] || 'non-assertion failure';
  const exp = (body.match(/expected: '?([^\n]{0,80})/) || [])[1] || '';
  const act = (body.match(/actual: '?([^\n]{0,80})/) || [])[1] || '';
  const key = err.slice(0, 60);
  if (!suites.has(key)) suites.set(key, { err, exp, act, tests: [] });
  suites.get(key).tests.push(name);
}

let out = '# 🧪 Test Failure Triage\n\n';
out += `_Auto-generated ${new Date().toISOString()} — ${suites.size} distinct failure group(s)._\\n\\n`;
for (const [key, g] of [...suites.entries()].sort((a, b) => b.tests.length - a.tests.length)) {
  out += `## ${g.err.slice(0, 90)}\n`;
  out += `- **Failing tests (${g.tests.length}):** ${g.tests.join('; ')}\n`;
  if (g.exp) out += `- **expected:** \`${g.exp}\`\n`;
  if (g.act) out += `- **actual:** \`${g.act}\`\n`;
  out += '- **likely cause:** test expectation drifted from doc/content change — verify which side is authoritative, update one side\n\n';
}
fs.writeFileSync('docs/TEST_TRIAGE.md', out);
console.log(`triage written: ${suites.size} groups`);
