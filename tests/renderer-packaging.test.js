// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const main = fs.readFileSync(new URL('../src/electron/main.js', import.meta.url), 'utf8');

test('packages the complete renderer as an explicit runtime resource for the current version', () => {
  assert.equal(pkg.version, '1.0.0');
  assert.ok(pkg.build.extraResources.some(entry =>
    entry.from === 'src/renderer' &&
    entry.to === 'renderer' &&
    Array.isArray(entry.filter) &&
    entry.filter.includes('**/*')
  ));
});

test('packaged startup loads and validates the explicit renderer entry', () => {
  assert.match(main, /process\.resourcesPath, 'renderer', 'index\.html'/);
  assert.match(main, /app\.isPackaged \? packagedRenderer/);
  assert.match(main, /Renderer entry is missing/);
  assert.doesNotMatch(main, /title: 'Eidovara v0\.22\.2'/);
});

test('Windows executable metadata uses the electron-builder 26 option', () => {
  assert.equal(pkg.build.win.signExecutable, false);
  assert.equal(Object.hasOwn(pkg.build.win, 'signAndEditExecutable'), false);
});

