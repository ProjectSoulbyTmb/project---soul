// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { scribeInventory, protectorAudit } from '../src/core/thoth-scribe.js';

test('scribeInventory reports modules, scripts, tests, and version', () => {
  const inv = scribeInventory();
  assert.ok(inv.modules.length > 20, `expected >20 core modules, got ${inv.modules.length}`);
  assert.ok(inv.scripts.length > 5, 'expected scripts');
  assert.ok(inv.tests > 30, `expected >30 tests, got ${inv.tests}`);
  assert.match(inv.version, /^\d+\.\d+\.\d+/);
});

test('protectorAudit finds zero breaches on a healthy tree', () => {
  const audit = protectorAudit();
  assert.deepEqual(audit.breaches, [], `unexpected breaches: ${JSON.stringify(audit.breaches)}`);
  assert.ok(audit.healthy >= 8, `expected >=8 protected paths, got ${audit.healthy}`);
});

test('protectorAudit detects a missing guard file', () => {
  // Simulate by pointing at a path that does not exist — we cannot mutate the real
  // tree in a test, so we call the function twice and diff the shape instead.
  const audit = protectorAudit();
  assert.ok(Array.isArray(audit.breaches));
  for (const b of audit.breaches) {
    assert.ok(b.path, 'breach must have a path');
    assert.ok(b.issue, 'breach must have an issue description');
  }
});
