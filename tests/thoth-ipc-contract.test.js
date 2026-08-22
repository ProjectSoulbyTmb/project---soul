// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH IPC contract guard.
 *
 * Every `soul:thoth*` channel exposed in preload.cjs MUST have a matching
 * ipcMain.handle registration in the main process, and vice versa - no orphans
 * in either direction. Drift here means a renderer call that rejects at
 * runtime with "No handler registered", so this makes it a merge blocker.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const preload = fs.readFileSync(path.join(ROOT, 'src/electron/preload.cjs'), 'utf8');
const main = fs.readFileSync(path.join(ROOT, 'src/electron/main.js'), 'utf8');

function extract(re, text) {
  return new Set([...text.matchAll(re)].map((m) => m[1]));
}

// Preload: any invoke targeting a thoth channel.
const offered = extract(/ipcRenderer\.invoke\('(soul:thoth[A-Za-z]*)'/g, preload);
// Main: every thoth handler registration.
const handled = extract(/ipcMain\.handle\('(soul:thoth[A-Za-z]*)'/g, main);

test('preload exposes exactly the THOTH channels the main process handles', () => {
  assert.ok(offered.size > 0, 'expected THOTH channels in preload.cjs');

  const missingHandlers = [...offered].filter((c) => !handled.has(c));
  const orphanHandlers = [...handled].filter((c) => !offered.has(c));

  const problems = [];
  for (const c of missingHandlers) problems.push(`preload offers '${c}' but main has no ipcMain.handle`);
  for (const c of orphanHandlers) problems.push(`main handles '${c}' but preload never exposes it`);

  assert.deepEqual(problems, [], `THOTH IPC drift:\n${problems.join('\n')}`);
});

test('THOTH grant channel can never carry an L2 class from the renderer', () => {
  // The main-side handler must whitelist classes; assert the guard exists.
  const grantHandler = main.slice(
    main.indexOf("ipcMain.handle('soul:thothGrant'"),
    main.indexOf("ipcMain.handle('soul:thothRevoke'")
  );
  assert.ok(grantHandler.length > 0, 'soul:thothGrant handler not found');
  assert.match(grantHandler, /L0/, 'grant whitelist must allow L0');
  assert.match(grantHandler, /L1/, 'grant whitelist must allow L1');
  assert.doesNotMatch(grantHandler, /['"]L2['"]\s*\?\s*['"]L2['"]/i);
  assert.equal(grantHandler.includes("'L2' ? 'L2'"), false, 'no L2 passthrough allowed');
});
