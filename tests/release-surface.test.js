import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('release exposes and persists the application-wide 18+ gate', () => {
  const main = read('src/electron/main.js');
  const preload = read('src/electron/preload.cjs');
  const renderer = read('src/renderer/renderer.js');
  const html = read('src/renderer/index.html');
  assert.match(main, /ageGateAccepted/);
  assert.match(preload, /acceptAgeGate/);
  assert.match(renderer, /ageGateOverlay/);
  assert.match(html, /I confirm I am 18 or older/);
});

test('adult avatar controls require every adult gate and revocation clears presentation', () => {
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  assert.match(main, /adultStatusConfirmed === true && policy\.adultSoulEnabled === true && policy\.currentConsent === true && policy\.mode === 'adult'/);
  assert.match(main, /!result\.adultAllowed && config\.companion\?\.adultPresentation/);
  assert.match(renderer, /adultAvatarSettings.*hidden/s);
});

test('public claims retain alpha and unsigned boundaries', () => {
  assert.match(read('README.md'), /Stable Alpha/);
  assert.match(read('README.md'), /Authenticode-unsigned/);
  assert.match(read('LEGAL_NOTICES.md'), /age 18 or older/);
});
