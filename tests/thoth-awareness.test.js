// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  awarenessView,
  commandSummary,
  createAwarenessState,
  maintenanceSummary,
  recordMaintenance,
  recordOperatorRun,
  recordServiceSnapshot,
  recordUpdateCheck,
  serviceSummary,
  updatesSummary,
} from '../src/core/thoth/awareness.js';

const T0 = '2026-08-22T00:00:00.000Z';
const later = n => `2026-08-22T00:0${n}:00.000Z`;

test('awareness starts empty and summarizes honestly', () => {
  const s = createAwarenessState();
  const v = awarenessView(s);
  assert.match(v.service, /No service probe recorded yet/);
  assert.match(v.updates, /No update check recorded yet/);
  assert.match(v.maintenance, /No maintenance actions recorded yet/);
  assert.match(v.commands, /0 operator command/);
});

test('service snapshots track failures consecutively and reset on success', () => {
  const s = createAwarenessState();
  recordServiceSnapshot(s, { at: T0, ok: false, detail: 'timeout' });
  recordServiceSnapshot(s, { at: later(1), ok: false });
  assert.match(serviceSummary(s), /2 consecutive failure/);
  recordServiceSnapshot(s, { at: later(2), ok: true, latencyMs: 120 });
  assert.match(serviceSummary(s), /Service was UP.*120 ms/);
  assert.equal(s.service.consecutiveFailures, 0);
});

test('update checks remember availability and verification state', () => {
  const s = createAwarenessState();
  recordUpdateCheck(s, { at: T0, available: true, version: '1.1.0', verified: true });
  assert.match(updatesSummary(s), /Update 1\.1\.0 was available.*verified/);
  recordUpdateCheck(s, { at: later(1), available: false });
  assert.match(updatesSummary(s), /No newer installer/);
});

test('command and maintenance rings stay bounded', () => {
  const s = createAwarenessState();
  for (let i = 0; i < 30; i++) {
    recordOperatorRun(s, { at: later(i % 10), phrase: `cmd ${i}`, allowed: i % 2 === 0 });
    recordMaintenance(s, { at: later(i % 10), actionId: `action-${i}` });
  }
  assert.equal(s.commands.length, 20);
  assert.equal(s.maintenance.length, 20);
  assert.match(commandSummary(s), /20 operator command\(s\) on record; 10 authorized/);
  assert.match(maintenanceSummary(s), /latest: action-29/);
});

test('awarenessView tolerates garbage input', () => {
  const v = awarenessView(null);
  assert.ok(v.service && v.updates && v.commands && v.maintenance);
});
