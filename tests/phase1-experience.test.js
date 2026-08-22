// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SoulEngine } from '../src/core/engine.js';
import { JsonStore } from '../src/core/store.js';

function makeEngine() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eido-phase1-'));
  return new SoulEngine({ store: new JsonStore({ dataDir: dir }) });
}

test('respond attaches reply provenance to the assistant message', async () => {
  const e = makeEngine();
  await e.respond('Hello Soul');
  const conv = e.snapshot().conversations[0];
  const assistant = [...conv.messages].reverse().find(m => m.role === 'assistant');
  assert.ok(assistant, 'assistant message exists');
  assert.ok(assistant.why, 'why provenance attached');
  assert.ok(Array.isArray(assistant.why.policyEvents), 'policyEvents is an array');
  assert.equal(typeof assistant.why.learningCount, 'number');
  assert.equal(assistant.why.providerFallback, false);
});

test('explainLastReply returns messageId and why for the latest exchange', async () => {
  const e = makeEngine();
  await e.respond('Hello Soul');
  const ex = e.explainLastReply();
  assert.equal(typeof ex.messageId, 'string');
  assert.ok(ex.why);
});

test('explainLastReply throws before any reply exists', () => {
  const e = makeEngine();
  assert.throws(() => e.explainLastReply(), /No explained assistant reply/);
});

test('funnel records installedAt at creation and firstReplyAt after respond', async () => {
  const e = makeEngine();
  const snap = e.snapshot();
  assert.match(String(snap.funnel.installedAt), /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(snap.funnel.firstReplyAt, null);
  await e.respond('Hello Soul');
  assert.match(String(e.snapshot().funnel.firstReplyAt), /^\d{4}-\d{2}-\d{2}T/);
});

test('configureSetup records setupCompletedAt exactly once', () => {
  const e = makeEngine();
  e.configureSetup({ categories: ['personal'] });
  const first = e.snapshot().funnel.setupCompletedAt;
  assert.match(String(first), /^\d{4}-\d{2}-\d{2}T/);
  e.configureSetup({ categories: ['gaming-editing'] });
  assert.equal(e.snapshot().funnel.setupCompletedAt, first, 'idempotent');
});

test('moodMix ranks known titles by taste and keyword overlap', () => {
  const e = makeEngine();
  e.recordMedia({ title: 'Deep Focus Instrumental', event: 'favorite' });
  e.recordMedia({ title: 'Workout Anthem', event: 'skip' });
  const mix = e.moodMix('focus', 5);
  assert.equal(mix.mood, 'focus');
  assert.ok(Array.isArray(mix.items));
  if (mix.items.length > 0) assert.match(mix.items[0].title, /Focus/i);
});

test('moodMix is safe on an empty entertainment profile', () => {
  const e = makeEngine();
  const mix = e.moodMix('unwind');
  assert.equal(mix.mood, 'unwind');
  assert.deepEqual(mix.items, []);
});
