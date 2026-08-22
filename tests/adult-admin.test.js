// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('Adult Mode chrome is admin-session only until a later release', () => {
  const html = read('src/renderer/index.html');
  const renderer = read('src/renderer/renderer.js');
  const css = read('src/renderer/styles.css');
  assert.match(html, /id="adminAdultPanel"/);
  assert.match(html, /id="adminOpenAdultSoulBtn"/);
  assert.match(html, /Until a later release, Adult Mode enablement lives in Ctrl\+A/);
  assert.match(css, /body:not\(\.admin-session\) \.adult-soul-nav/);
  assert.match(css, /body:not\(\.admin-session\) \.adult-enable-action/);
  assert.match(renderer, /function adminSessionActive/);
  assert.match(renderer, /adminAdultCommand/);
  assert.match(read('src/electron/main.js'), /incoming\.adminAuthorized = adminAuthorized\(\)/);
  assert.match(read('src/core/policy.js'), /policy\.adult_admin_blocked/);
  assert.match(read('src/core/engine.js'), /cannot be enabled from chat/);
});

test('workspace does not import adult-soul (no schema cycle)', () => {
  const workspace = read('src/core/workspace.js');
  assert.match(workspace, /from '\.\/adult-intents\.js'/);
  assert.doesNotMatch(workspace, /from '\.\/adult-soul\.js'/);
  assert.doesNotMatch(workspace, /from '\.\/adult-media\.js'/);
});

test('player loadMedia function exists after Feel analyser', () => {
  const player = read('src/renderer/player.js');
  assert.match(player, /function loadMedia\(nextIndex, autoplay = true\)/);
  assert.match(player, /function attachFeel\(player\)/);
});

