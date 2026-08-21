import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('website and desktop share identical system tokens', () => {
  const docs = read('docs/tokens.css');
  const app = read('src/renderer/tokens.css');
  assert.equal(docs, app);
  assert.match(docs, /-apple-system, BlinkMacSystemFont, "Segoe UI Variable"/);
  assert.doesNotMatch(docs, /"SF Pro Text"|"SF Pro Display"|"SF Mono"/);
  assert.doesNotMatch(read('docs/site.css'), /"SF Mono"/);
  assert.match(docs, /--tint: #007aff/);
  assert.match(docs, /prefers-color-scheme: dark/);
  assert.doesNotMatch(docs, /Apple Inc|SwiftUI|SF Symbols\.otf/i);
});

test('site and renderer load tokens without claiming Apple affiliation', () => {
  const site = read('docs/index.html');
  const app = read('src/renderer/index.html');
  assert.match(site, /href="tokens\.css"/);
  assert.match(app, /href="tokens\.css"/);
  assert.match(app, /media-src https: eidovara-media:/);
  assert.doesNotMatch(app, /media-src [^"]*'self'/);
  assert.doesNotMatch(site, /Apple-designed|Apple Inc\.|official iOS app/i);
  assert.doesNotMatch(app, /Apple-designed|Apple Inc\.|official iOS app/i);
});

test('premium RGB lighting remains gated in the desktop settings save path', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /rgbEffects: entitlement\(\) === 'premium' && Boolean\(incoming\.theme\.rgbEffects\)/);
});
