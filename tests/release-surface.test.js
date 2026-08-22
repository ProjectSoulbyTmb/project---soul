import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchTolerant } from './helpers/match-tolerant.js';

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
  assert.match(html, /ageGateTermsCheck/);
  assert.match(main, /function requireAgeGate/);
});

test('adult avatar controls require every adult gate and revocation clears presentation', () => {
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  matchTolerant(
    main,
    /adultStatusConfirmed === true && policy\.adultSoulEnabled === true && policy\.currentConsent === true && policy\.mode === 'adult'/
  );
  matchTolerant(main, /!result\.adultAllowed && config\.companion\?\.adultPresentation/);
  matchTolerant(renderer, /adultAvatarSettings.*hidden/s);
});

test('public claims retain alpha and unsigned boundaries', () => {
  assert.match(read('README.md'), /Stable Alpha/);
  assert.match(read('README.md'), /Authenticode-unsigned/);
  assert.match(read('LEGAL_NOTICES.md'), /age 18 or older/);
});

test('Windows local media uses a gated protocol instead of raw file URLs', () => {
  const main = read('src/electron/main.js');
  const html = read('src/renderer/index.html');
  assert.match(main, /LOCAL_MEDIA_SCHEME = 'eidovara-media'/);
  assert.match(main, /allowedLocalMedia/);
  assert.match(main, /protocol\.registerSchemesAsPrivileged/);
  assert.match(html, /media-src https: eidovara-media:/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
  assert.match(read('package.json'), /"cli": "node src\/cli\.js"/);
  assert.match(read('src/cli.js'), /await engine\.respond/);
});

test('advertised Free surface confirms launches and media, and does not hard-code workers.dev', () => {
  const main = read('src/electron/main.js');
  const renderer = read('src/renderer/renderer.js');
  const html = read('src/renderer/index.html');
  matchTolerant(main, /ipcMain\.handle\('soul:launchApplication'/);
  matchTolerant(main, /Ask Windows to open/);
  matchTolerant(main, /showMessageBox/);
  matchTolerant(renderer, /alreadyConfirmed/);
  matchTolerant(renderer, /mediaPlayback/);
  matchTolerant(renderer, /applyEditionGates/);
  matchTolerant(html, /Animated RGB lighting effects \(Premium\)/);
  matchTolerant(html, /Broad web-search key \(Premium\)/);
  assert.doesNotMatch(main, /dreambot333\.workers\.dev/);
  assert.doesNotMatch(renderer, /dreambot333\.workers\.dev/);
  matchTolerant(
    read('src/core/service.js'),
    /DEFAULT_EIDOVARA_SERVICE_BASE = 'https:\/\/api\.eidovara\.org'/
  );
  matchTolerant(read('NETWORK-USAGE.md'), /en\.wikipedia\.org/);
  matchTolerant(read('README.md'), /RGB/);
});
