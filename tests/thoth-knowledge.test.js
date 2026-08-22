// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
// THOTH project-knowledge index: generated pack integrity + routing merge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  DESKTOP_KNOWLEDGE_ENTRIES,
  knowledgeEntry,
  matchProductIntent,
  shouldUseKnowledgeReply,
} from '../src/core/knowledge.js';
import { THOTH_ENTRIES, THOTH_RULES, THOTH_KNOWLEDGE_VERSION } from '../src/core/thoth-knowledge.js';

test('thoth index is present, versioned, and well-formed', () => {
  assert.equal(THOTH_KNOWLEDGE_VERSION, JSON.parse(fs.readFileSync('package.json', 'utf8')).version);
  assert.ok(THOTH_ENTRIES.length >= 8, `expected >=8 entries, got ${THOTH_ENTRIES.length}`);
  const ids = new Set(THOTH_ENTRIES.map(e => e.id));
  assert.ok(ids.has('thoth:self'));
  assert.ok(ids.has('thoth:overview'));
  for (const entry of THOTH_ENTRIES) {
    assert.equal(typeof entry.title, 'string');
    assert.ok(entry.reply && entry.reply.length > 20, `${entry.id} needs a real reply`);
    assert.ok(Array.isArray(entry.patterns) && entry.patterns.length > 0, `${entry.id} needs patterns`);
    for (const pattern of entry.patterns) assert.doesNotThrow(() => new RegExp(pattern, 'i'), pattern);
  }
});

test('every thoth id is namespaced and merged without shadowing hand-written entries', () => {
  for (const entry of THOTH_ENTRIES) assert.match(entry.id, /^thoth:/);
  for (const entry of THOTH_ENTRIES) {
    assert.equal(knowledgeEntry(entry.id), entry, `${entry.id} must resolve through knowledge.js`);
  }
  // hand-written precedence intact
  assert.equal(knowledgeEntry('age').title, 'Age 18+');
  assert.ok(DESKTOP_KNOWLEDGE_ENTRIES['what'], 'hand-written "what" survives the merge');
});

test('thoth rules route product questions through the standard matcher', () => {
  assert.equal(matchProductIntent('what is thoth?'), 'thoth:self');
  assert.ok(matchProductIntent('how many tests does this have'), 'thoth:tests');
  assert.ok(matchProductIntent('show me the core modules map'), 'thoth:core-modules');
  assert.ok(shouldUseKnowledgeReply('thoth:overview'));
  // hand-written rules still win by order
  assert.equal(matchProductIntent('are you conscious?'), 'forbidden');
});

test('generated output is deterministic and ASCII-safe', () => {
  const first = fs.readFileSync('src/core/thoth-knowledge.js', 'utf8');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thoth-check-'));
  try {
    execFileSync(process.execPath, ['scripts/build-thoth-knowledge.js'], { cwd: process.cwd() });
    const second = fs.readFileSync('src/core/thoth-knowledge.js', 'utf8');
    assert.equal(second, first, 'regeneration must be deterministic');
    for (const ch of first) assert.ok(ch.charCodeAt(0) <= 0x7f, 'non-ASCII byte in generated file');
    assert.doesNotMatch(first, /COMPANY_FORMATION|CHAIN_OF_TITLE|NAME_CLEARANCE|RUNBOOK\.md/, 'internal records leaked');
    assert.doesNotMatch(first, /[A-Z]:\\\\Users|\/home\//, 'absolute path leaked');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('thoth rules compile from declared patterns exactly once', () => {
  assert.equal(THOTH_RULES.length, THOTH_ENTRIES.length);
});
