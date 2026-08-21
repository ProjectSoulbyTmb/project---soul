import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaPlaybackDecision, premiumFeatureAllowed } from '../src/core/capabilities.js';

test('mediaPlayback confirm is required except after an explicit picker or when enabled', () => {
  assert.deepEqual(mediaPlaybackDecision('disabled'), { allowed: false, needsConfirm: false, mode: 'disabled' });
  assert.deepEqual(mediaPlaybackDecision('confirm'), { allowed: true, needsConfirm: true, mode: 'confirm' });
  assert.deepEqual(mediaPlaybackDecision('confirm', { alreadyConfirmed: true }), { allowed: true, needsConfirm: false, mode: 'confirm' });
  assert.deepEqual(mediaPlaybackDecision('enabled'), { allowed: true, needsConfirm: false, mode: 'enabled' });
  assert.equal(mediaPlaybackDecision(undefined).needsConfirm, true);
});

test('v0.22.2 full free edition does not entitlement-lock implemented features', () => {
  for (const feature of ['rgb', 'compatible', 'searchKey', 'unlimitedApps', 'offline']) {
    assert.equal(premiumFeatureAllowed('free', feature), true, feature);
  }
  // Keep compatibility with profiles that previously stored the old edition label.
  assert.equal(premiumFeatureAllowed('premium', 'rgb'), true);
  assert.equal(premiumFeatureAllowed(undefined, 'searchKey'), true);
});
