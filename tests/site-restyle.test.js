// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = file => fs.readFileSync(file, 'utf8');
const htmlFiles = fs.readdirSync('docs').filter(name => name.endsWith('.html')).map(name => path.join('docs', name));

test('homepage restyle keeps three benefits, one hero fill CTA, and no Adult Soul', () => {
  const home = read('docs/index.html');
  const benefits = [...home.matchAll(/<article class="benefit">/g)];
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
  assert.match(home, /Source v0\.22\.2 does not sell Premium/);
  assert.match(home, /live installer remains v0\.19\.1/);
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

test('every public HTML page names source v0.22.2 without inventing a 0.22.2 installer', () => {
  assert.ok(htmlFiles.length >= 14, htmlFiles.length);
  for (const file of htmlFiles) {
    const html = read(file);
    assert.match(html, /v0\.22\.2/, file);
    assert.doesNotMatch(html, /Eidovara-0\.22\.2-Windows-x64-Setup\.exe/, file);
  }
  for (const file of ['docs/product.html', 'docs/download.html', 'docs/help.html']) {
    const html = read(file);
    assert.match(html, /v0\.19\.1/, file);
    assert.match(html, /Eidovara-0\.19\.1-Windows-x64-Setup\.exe/, file);
  }
  assert.match(read('docs/site.css'), /--eidovara-visual:\s*sleek-c180/);
  assert.match(read('docs/site.css'), /#site-nav > a\.nav-cta/);
  assert.match(read('docs/site.css'), /\.benefit-grid/);
  assert.equal(read('docs/tokens.css'), read('src/renderer/tokens.css'));
});
