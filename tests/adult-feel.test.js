// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { FEEL_PATTERNS, defaultAdultFeel, feelSample, publicStealth, normalizeAdultFeel } from '../src/core/adult-feel.js';

test('Feel Sync ships eleven named patterns in 0–1', () => {
  assert.equal(FEEL_PATTERNS.length, 11);
  const feel = defaultAdultFeel();
  for (const pattern of FEEL_PATTERNS) {
    const sample = feelSample({ ...feel, pattern: pattern.id, intensity: 80, speed: 55, loop: true, float: false }, 1800, 0.4);
    assert.ok(sample >= 0 && sample <= 1, `${pattern.id} ${sample}`);
  }
});

test('public stealth never leaks PIN hash', () => {
  const feel = normalizeAdultFeel({
    stealth: { pinEnabled: true, pinHash: 'abc123', pinSalt: 'def456', locked: true }
  });
  const pub = publicStealth(feel.stealth);
  assert.equal(pub.pinEnabled, true);
  assert.equal(pub.locked, true);
  assert.equal('pinHash' in pub, false);
  assert.equal('pinSalt' in pub, false);
});
