// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { THOTH_DEGREES, getDegreeById, getAllCourses, getCourseCount, THOTH_DEGREES_VERSION } from '../src/core/thoth-degrees.js';

test('exports version string', () => {
  assert.match(THOTH_DEGREES_VERSION, /^\d+\.\d+\.\d+$/);
});

test('has exactly 4 degrees with unique ids and domains', () => {
  assert.equal(THOTH_DEGREES.length, 4);
  const ids = THOTH_DEGREES.map((d) => d.id);
  const domains = THOTH_DEGREES.map((d) => d.domain);
  assert.equal(new Set(ids).size, 4, 'duplicate degree ids');
  assert.equal(new Set(domains).size, 4, 'duplicate domains');
  for (const d of THOTH_DEGREES) {
    assert.ok(d.title, `${d.id} missing title`);
    assert.ok(d.level, `${d.id} missing level`);
    assert.ok(Array.isArray(d.principles) && d.principles.length >= 3, `${d.id} needs >=3 principles`);
    assert.ok(Array.isArray(d.courses) && d.courses.length >= 3, `${d.id} needs >=3 courses`);
  }
});

test('every course has routing patterns and a substantive reply', () => {
  const all = getAllCourses();
  assert.ok(all.length >= 12, `expected >=12 courses total, got ${all.length}`);
  for (const c of all) {
    assert.ok(Array.isArray(c.patterns), `${c.id} missing patterns`);
    assert.ok(c.patterns.every((p) => typeof p === 'string'), `${c.id} non-string pattern`);
    assert.ok(typeof c.reply === 'string' && c.reply.length > 80, `${c.id} reply too short (${c.reply?.length ?? 0} chars)`);
  }
});

test('getDegreeById resolves by id and domain', () => {
  assert.ok(getDegreeById('degree:philosophy'));
  assert.ok(getDegreeById('philosophy'));
  assert.ok(getDegreeById('business-strategy'));
  assert.ok(getDegreeById('app-development'));
  assert.equal(getDegreeById('nonexistent'), undefined);
});

test('getAllCourses flattens correctly with degree metadata', () => {
  const all = getAllCourses();
  assert.ok(all.length > 0);
  for (const c of all) {
    assert.ok(c.degreeId, 'missing degreeId on course');
    assert.ok(c.degreeTitle, 'missing degreeTitle on course');
  }
});

test('getCourseCount matches sum of courses across degrees', () => {
  const expected = THOTH_DEGREES.reduce((sum, d) => sum + d.courses.length, 0);
  assert.equal(getCourseCount(), expected);
});

test('no duplicate course ids across all degrees', () => {
  const all = getAllCourses();
  const ids = all.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate course ids: ${ids.filter((v, i, a) => a.indexOf(v) !== i).join(', ')}`);
});

test('all replies are ASCII-safe (mojibake prevention)', () => {
  for (const d of THOTH_DEGREES) {
    for (const p of d.principles) {
      assert.doesNotMatch(p.detail, /[^\x20-\x7E]/, `non-ASCII in principle "${p.name}"`);
    }
    for (const c of d.courses) {
      assert.doesNotMatch(c.reply, /[\u0080-\uFFFF]/, `non-ASCII in reply for "${c.id}"`);
    }
  }
});
