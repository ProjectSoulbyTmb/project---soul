// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';
import { classifyWorkspaceIntent } from '../src/core/workspace.js';
import { classifyAdultSoulIntent, classifyAdultMediaIntent } from '../src/core/adult-intents.js';
import { SESSION_KINDS, adultSoulView, migrateAdultSoul } from '../src/core/adult-soul.js';
import { buildAdultMesh, FIGURE_QUALITY } from '../src/core/adult-mesh.js';
import { applyPolicyCommand } from '../src/core/policy.js';
import { defaultProfile } from '../src/core/schema.js';

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'eidovara-adult-soul-'));
}
function make() {
  return new SoulEngine({ store: new JsonStore({ dataDir: tmp() }) });
}
async function enableAdult(engine) {
  await engine.respond('adult status confirmed', { adminAuthorized: true });
  await engine.respond('enable adult soul', { adminAuthorized: true });
  await engine.respond('I consent', { adminAuthorized: true });
}

test('jerk-off classifies as adult-session before adult-media', () => {
  assert.equal(classifyAdultSoulIntent('jerk off'), 'adult-session');
  assert.equal(classifyWorkspaceIntent('jerk off'), 'adult-session');
  assert.equal(classifyWorkspaceIntent('open pornhub'), 'adult-media');
  assert.equal(classifyWorkspaceIntent('watch porn'), 'adult-media');
  assert.equal(classifyAdultMediaIntent('open pornhub'), 'adult-media');
});

test('Adult Mode enablement is admin-panel only; revoke stays open', async () => {
  const s = make();
  const blocked = await s.respond('adult status confirmed');
  assert.match(blocked.reply, /administrator panel/i);
  assert.equal(s.snapshot().policy.adultStatusConfirmed, false);
  await enableAdult(s);
  assert.equal(s.snapshot().policy.currentConsent, true);
  const revoked = await s.respond('revoke consent');
  assert.equal(revoked.state.policy.currentConsent, false);
});

test('Adult Soul chat surfaces stay admin-gated until later', async () => {
  const s = make();
  await enableAdult(s);
  const closed = await s.respond('open adult soul');
  assert.match(closed.reply, /administrator panel/i);
  const open = await s.respond('open adult soul', { adminAuthorized: true });
  assert.match(open.reply, /Adult Soul/i);
});

test('snapshot redacts Adult PIN hash and salt', async () => {
  const s = make();
  await enableAdult(s);
  s.setAdultPin('2468', '2468');
  const snap = s.snapshot();
  assert.equal(snap.adultSoul.feel.stealth.pinEnabled, true);
  assert.equal(snap.adultSoul.feel.stealth.pinHash, undefined);
  assert.equal(snap.adultSoul.feel.stealth.pinSalt, undefined);
  const raw = JSON.parse(fs.readFileSync(path.join(s.store.dataDir, 'default.json'), 'utf8'));
  assert.match(String(raw.adultSoul.feel.stealth.pinHash || ''), /[a-f0-9]/i);
});

test('ultra first-party mesh is at least 72 by 112 and is not VRM', () => {
  const mesh = buildAdultMesh({}, 'ultra');
  const verts = mesh.positions.length / 3;
  assert.ok(verts >= FIGURE_QUALITY.ultra.slices * FIGURE_QUALITY.ultra.stacks, verts);
  assert.equal(mesh.vrm, false);
  assert.equal(mesh.makeHuman, false);
});

test('show-pack session kinds are in SESSION_KINDS', () => {
  for (const kind of ['whisper-only', 'voyeur-watch', 'cam-night', 'afterglow-hold']) {
    assert.ok(SESSION_KINDS.includes(kind), kind);
  }
});

test('policy apply without admin cannot confirm adult status', () => {
  const state = defaultProfile();
  applyPolicyCommand(state, 'adult status confirmed');
  assert.equal(state.policy.adultStatusConfirmed, false);
  applyPolicyCommand(state, 'adult status confirmed', { adminAuthorized: true });
  assert.equal(state.policy.adultStatusConfirmed, true);
});

test('hydrate keeps adultSoul schema 3', () => {
  const soul = migrateAdultSoul(undefined);
  assert.equal(soul.schema, 3);
  assert.equal(soul.kind, 'adult-soul-studio');
  const view = adultSoulView({
    policy: {
      mode: 'standard',
      adultSoulEnabled: false,
      adultStatusConfirmed: false,
      currentConsent: false,
    },
    adultSoul: soul,
  });
  assert.equal(view.open, false);
  assert.match(view.reason, /administrator panel/i);
  assert.equal(view.neuralTts, false);
  assert.equal(view.vrm, false);
  assert.equal(view.ambientEngine.neuralTts, false);
  assert.equal(view.engines.find(item => item.id === 'neural-tts').bundled, false);
});
