// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { INSTALLER_NAME, INSTALLER_SHA256, SOURCE_VERSION } from '../src/core/release.js';
import { matchTolerant } from './helpers/match-tolerant.js';

const read = file => fs.readFileSync(file, 'utf8');
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const htmlFiles = fs
  .readdirSync('docs')
  .filter(name => name.endsWith('.html'))
  .map(name => path.join('docs', name));

test('homepage restyle keeps three benefits, one hero fill CTA, and no Adult Soul marketing', () => {
  const home = read('docs/index.html');
  const benefits = [...home.matchAll(/<article class="benefit[ "]/g)];
  assert.equal(benefits.length, 3);
  assert.match(home, /Local Windows workspace/);
  assert.match(home, /Media and research/);
  assert.match(home, /Optional Soul/);
  assert.doesNotMatch(home, /class="feature-grid"/);
  assert.doesNotMatch(home, /Adult Soul/);
  const hero = home.split('id="download"')[0];
  const heroPrimary = [...hero.matchAll(/<a class="primary[^"]*"/g)];
  assert.equal(heroPrimary.length, 1);
  assert.match(hero, /class="text-link"/);
  assert.match(home, /v1\.0\.0 is published/);
  assert.match(home, /Eidovara-v1\.0\.0-Windows-x64-Setup\.exe/);
  assert.match(home, /Authenticode-unsigned/);
});

test('public nav Download uses nav-cta to download.html on every HTML page', () => {
  assert.ok(htmlFiles.length >= 14, htmlFiles.length);
  for (const file of htmlFiles) {
    const html = read(file);
    assert.match(html, /class="nav-cta" href="download\.html"/, file);
    assert.doesNotMatch(html, /class="nav-cta primary/, file);
    assert.doesNotMatch(html, /class="primary[^"]*nav-cta/, file);
  }
});

test('public release pages advertise the real current installer', () => {
  for (const file of [
    'docs/index.html',
    'docs/product.html',
    'docs/download.html',
    'docs/status.html',
  ]) {
    const html = read(file);
    matchTolerant(html, new RegExp('v' + escapeRe(SOURCE_VERSION)), file);
  }
  for (const file of ['docs/product.html', 'docs/download.html']) {
    const html = read(file);
    matchTolerant(html, new RegExp(escapeRe(INSTALLER_NAME)), file);
    // Pending tagged build: pages point at SHA256SUMS.txt instead of a digest.
matchTolerant(html, /SHA256SUMS\.txt/, file);
  }
  matchTolerant(read('docs/site.css'), /--eidovara-visual:\s*modern-2026/);
  matchTolerant(read('docs/site.css'), /#site-nav > a\.nav-cta/);
  matchTolerant(read('docs/site.css'), /\.benefit-grid/);
  assert.equal(read('docs/tokens.css'), read('src/renderer/tokens.css'));
});
