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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eido-export-'));
  return new SoulEngine({ store: new JsonStore({ dataDir: dir }) });
}

test('exportConversation returns structured JSON for the active conversation', async () => {
  const e = makeEngine();
  await e.respond('Hello Soul');
  const out = e.exportConversation();
  assert.ok(out.messageCount >= 2, 'should include user + assistant messages');
  assert.match(out.filename, /\.json$/);
  const parsed = JSON.parse(out.data);
  assert.equal(parsed.app, 'Eidovara');
  assert.equal(parsed.version, 1);
  assert.equal(parsed.redacted, true);
  assert.ok(Array.isArray(parsed.messages));
  assert.equal(parsed.messages[0].role, 'user');
});

test('markdown export includes title and both roles', async () => {
  const e = makeEngine();
  await e.respond('Hello Soul');
  const md = e.exportConversation(undefined, { format: 'md' });
  assert.match(md.filename, /\.md$/);
  assert.match(md.data, /^# /m);
  assert.match(md.data, /Conversation ID:/);
  assert.match(md.data, /\*\*user\*\*/);
  assert.match(md.data, /\*\*assistant\*\*/);
});

test('unknown conversation id throws a clear error', () => {
  const e = makeEngine();
  assert.throws(() => e.exportConversation('does-not-exist'), /Conversation not found/);
});

test('exported content redacts obvious secrets by default', async () => {
  const e = makeEngine();
  await e.respond('my api_key=supersecret123 please remember');
  const out = e.exportConversation();
  assert.doesNotMatch(out.data, /supersecret123/);
  assert.match(out.data, /\[redacted\]/);
});

test('redaction can be explicitly disabled', async () => {
  const e = makeEngine();
  await e.respond('Hello Soul');
  const raw = e.exportConversation(undefined, { redact: false });
  const parsed = JSON.parse(raw.data);
  assert.equal(parsed.redacted, false);
});
