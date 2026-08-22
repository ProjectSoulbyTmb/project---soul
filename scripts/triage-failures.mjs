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

const src =
  process.argv[2] && fs.existsSync(process.argv[2])
    ? fs.readFileSync(process.argv[2], 'utf8')
    : fs.readFileSync(0, 'utf8');
const clean = src.replace(/\x1b\[[0-9;]*m/g, '');

const suites = new Map();
// Format A: spec reporter "✖ name (ms)"
const reA = /✖ ([^\n]+?) \((\d+(?:\.\d+)?)ms?\)\n([\s\S]*?)(?=\n✖ |\nℹ |$)/g;
// Format B: "test at tests\xxx.js:L:1" followed by failure block
const reB = /test at (tests\\[^\n]+?):(\d+):1\n([\s\S]*?)(?=\ntest at tests|\n$|$)/g;
let m;
while ((m = reB.exec(clean))) {
  const key = `${m[1]}:${m[2]}`;
  const err =
    (m[3].match(/AssertionError \[[^\]]*\]: ([^\n]+)/) || m[3].match(/Error: ([^\n]+)/) || [])[1] ||
    'failure';
  const exp = (m[3].match(/expected: '?([^\n]{0,80})/) || [])[1] || '';
  const act = (m[3].match(/actual: '?([^\n]{0,80})/) || [])[1] || '';
  if (!suites.has(key))
    suites.set(key, { err: err.slice(0, 90), exp, act, tests: [`${m[1]}:${m[2]}`] });
}
while ((m = reA.exec(clean))) {
  const g = [...suites.values()][0];
  if (g && !g.tests.includes(m[1].trim())) g.tests.push(m[1].trim());
}

let out = '# Test Failure Triage\n\n';
out += `_Auto-generated ${new Date().toISOString()} — ${suites.size} distinct failure group(s)._\n\n`;
for (const [_key, g] of [...suites.entries()].sort((a, b) => b.tests.length - a.tests.length)) {
  out += `## ${g.err.slice(0, 90)}\n`;
  out += `- **Failing tests (${g.tests.length}):** ${g.tests.join('; ')}\n`;
  if (g.exp) out += `- **expected:** \`${g.exp}\`\n`;
  if (g.act) out += `- **actual:** \`${g.act}\`\n`;
  out +=
    '- **likely cause:** test expectation drifted from doc/content change — verify which side is authoritative, update one side\n\n';
}
fs.writeFileSync('docs/TEST_TRIAGE.md', out);
console.log(`triage written: ${suites.size} groups`);
