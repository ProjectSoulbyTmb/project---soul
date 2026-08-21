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

test('Windows Setup overwrites an existing Eidovara program install', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.build.appId, 'com.soulconsciousnessstudios.eidovara');
  assert.equal(pkg.build.nsis.include, 'build/installer.nsh');
  assert.equal(pkg.build.nsis.deleteAppDataOnUninstall, false);
  assert.equal(pkg.build.nsis.oneClick, false);
  assert.match(pkg.build.nsis.artifactName, /Eidovara-\$\{version\}-Windows-\$\{arch\}-Setup/);
  assert.match(read('README.md'), /overwrites an existing Eidovara program install/);
  const nsh = read('build/installer.nsh');
  assert.match(nsh, /SetOverwrite on/);
  assert.match(nsh, /!macro customInit/);
  assert.match(nsh, /!macro customCheckAppRunning/);
  assert.match(nsh, /!macro customUnInstallCheck/);
  assert.match(nsh, /\$\{APP_EXECUTABLE_FILENAME\}/);
  assert.match(nsh, /nsProcess::FindProcess/);
  assert.match(nsh, /nsProcess::CloseProcess/);
  assert.match(nsh, /nsProcess::KillProcess/);
  assert.doesNotMatch(nsh, /delete-app-data/i);
  assert.doesNotMatch(nsh, /RMDir \/r "\$APPDATA/);
});
