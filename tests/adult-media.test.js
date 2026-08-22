// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { officialSearchHandoffs, discoverMedia } from '../src/core/entertainment.js';
import { adultOfficialHandoffs, classifyAdultMediaIntent } from '../src/core/adult-media.js';
import { isHandoffOnlyHost, fetchPublicPage } from '../src/providers/internet.js';
import { shouldDestroyGuestOverlays } from '../src/core/overlays.js';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('Saturn official chips stay YouTube, Spotify, Internet Archive', () => {
  assert.deepEqual(officialSearchHandoffs('Saturn').map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
});

test('mood mix does not grow Pornhub chips', () => {
  const discovery = discoverMedia('Help me create a calm study soundtrack', { entertainment: { favorites: [], history: [], taste: {} } });
  assert.equal((discovery.adultHandoffs || []).length, 0);
  assert.deepEqual(discovery.handoffs.map(item => item.provider), ['YouTube', 'Spotify', 'Internet Archive']);
});

test('adult official handoffs exist separately and only for adult queries', () => {
  const chips = adultOfficialHandoffs('Saturn');
  assert.ok(chips.length >= 3);
  assert.ok(chips.every(item => item.adult === true && item.embed === false && /^https:/.test(item.url)));
  assert.equal(classifyAdultMediaIntent('open pornhub'), 'adult-media');
});

test('Pornhub stays handoff-only; HTML is not fetched', async () => {
  assert.equal(isHandoffOnlyHost('https://www.pornhub.com/video/search?search=test'), true);
  await assert.rejects(
    () => fetchPublicPage('https://www.pornhub.com/video/search?search=test'),
    /official browser searches|does not fetch their HTML/i
  );
});

test('Adult Mode closes guest overlays', () => {
  assert.equal(shouldDestroyGuestOverlays({ adultAllowed: true, ageGateAccepted: true }).closeGuests, true);
  assert.match(read('src/electron/guest-overlays.js'), /Adult Mode is on, so guest overlays stay closed/);
});

test('Adult Media desk is hidden without admin session and adult-mode', () => {
  const css = read('src/renderer/adult-media.css') + read('src/renderer/styles.css');
  assert.match(css, /body:not\(\.admin-session\) #adultMediaDesk/);
  assert.match(css, /body:not\(\.adult-mode\) #adultMediaDesk/);
  assert.match(read('src/electron/main.js'), /soul:adultMediaDesk[\s\S]*requireAdmin/);
});

