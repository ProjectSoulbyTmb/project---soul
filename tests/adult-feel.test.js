// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEEL_PATTERNS, FEEL_PATTERN_IDS, defaultAdultFeel, feelSample, publicStealth, normalizeAdultFeel,
  mapGamepadStick, mapGamepadButtons, nextFeelPattern, rumbleFromLevel, GAMEPAD_HONESTY
} from '../src/core/adult-feel.js';

test('Feel Sync ships eleven named patterns in 0â€“1', () => {
  assert.equal(FEEL_PATTERNS.length, 11);
  const feel = defaultAdultFeel();
  for (const pattern of FEEL_PATTERNS) {
    const sample = feelSample({ ...feel, pattern: pattern.id, intensity: 80, speed: 55, loop: true, float: false }, 1800, 0.4);
    assert.ok(sample >= 0 && sample <= 1, `${pattern.id} ${sample}`);
  }
});

test('gamepad stick maps into Feel 0â€“100 and rumble stays dual-rumble math', () => {
  const idle = mapGamepadStick([0.02, -0.01], { speed: 40, intensity: 70 });
  assert.equal(idle.moved, false);
  assert.equal(idle.speed, 40);
  const moved = mapGamepadStick([1, -1], { speed: 40, intensity: 70 });
  assert.equal(moved.moved, true);
  assert.equal(moved.speed, 100);
  assert.equal(moved.intensity, 100);
  const rumble = rumbleFromLevel(0.5);
  assert.equal(rumble.duration, 140);
  assert.ok(rumble.strongMagnitude > 0 && rumble.strongMagnitude <= 1);
  assert.equal(nextFeelPattern('wave'), FEEL_PATTERN_IDS[(FEEL_PATTERN_IDS.indexOf('wave') + 1) % FEEL_PATTERN_IDS.length]);
  const edge = mapGamepadButtons([{ pressed: true }, { pressed: false }], { 0: false });
  assert.equal(edge.cyclePattern, true);
  const hold = mapGamepadButtons([{ pressed: true }], { 0: true });
  assert.equal(hold.cyclePattern, false);
  assert.match(GAMEPAD_HONESTY, /not Lovense/i);
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

