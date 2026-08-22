// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import assert from 'node:assert/strict';

const stripMd = value => String(value ?? '').replace(/[*_`]/g, '');

const variantsOf = value => {
  const text = String(value ?? '');
  return [text, text.replace(/\s+/g, ' '), text.replace(/\s+/g, ''), stripMd(text.replace(/\s+/g, ' '))];
};

const flexPatterns = new Map();
const flexible = regexp => {
  if (!flexPatterns.has(regexp)) {
    flexPatterns.set(
      regexp,
      new RegExp(regexp.source.replace(/\\? /g, '\\s*'), regexp.flags)
    );
  }
  return flexPatterns.get(regexp);
};

export function matchTolerant(value, regexp, message) {
  const flex = flexible(regexp);
  const matched = variantsOf(value).some(variant => regexp.test(variant) || flex.test(variant));
  assert.ok(
    matched,
    message || `Expected ${regexp} to match (tolerating formatting drift):\n${String(value ?? '').slice(0, 400)}`
  );
}

export function matchAny(haystacks, regexp, message) {
  const ok = haystacks.some(hay => matchTolerantBool(hay, regexp));
  assert.ok(ok, message);
}

function matchTolerantBool(value, regexp) {
  const flex = flexible(regexp);
  return variantsOf(value).some(variant => regexp.test(variant) || flex.test(variant));
}

