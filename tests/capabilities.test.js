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

test('Free edition keeps RGB, remote endpoints, and Brave search behind Premium', () => {
  assert.equal(premiumFeatureAllowed('free', 'rgb'), false);
  assert.equal(premiumFeatureAllowed('free', 'compatible'), false);
  assert.equal(premiumFeatureAllowed('free', 'searchKey'), false);
  assert.equal(premiumFeatureAllowed('free', 'offline'), true);
  assert.equal(premiumFeatureAllowed('premium', 'rgb'), true);
  assert.equal(premiumFeatureAllowed('premium', 'searchKey'), true);
});
