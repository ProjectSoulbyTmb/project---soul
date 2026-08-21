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
  const readme = read('README.md');
  assert.match(readme, /Stable Alpha/);
  assert.match(readme, /Authenticode-unsigned/);
  assert.match(readme, /Windows 10\/11 x64/);
  assert.match(readme, /Linux and macOS packaging scripts are development targets/);
  assert.doesNotMatch(readme, /official Linux|official macOS|signed official releases for Linux/i);
  assert.match(read('LEGAL_NOTICES.md'), /age 18 or older/);
});

test('local media uses a gated custom protocol instead of raw file URLs', () => {
  const main = read('src/electron/main.js');
  const html = read('src/renderer/index.html');
  assert.match(main, /LOCAL_MEDIA_SCHEME = 'eidovara-media'/);
  assert.match(main, /allowedLocalMedia/);
  assert.match(main, /protocol\.registerSchemesAsPrivileged/);
  assert.match(main, /url: `\$\{LOCAL_MEDIA_SCHEME\}:\/\/\$\{id\}\/`/);
  assert.match(html, /media-src https: eidovara-media:/);
  assert.doesNotMatch(html, /media-src [^"]*'self'/);
});

test('documented Windows launchers invoke the cli script and current version', () => {
  assert.match(read('run-cli.bat'), /npm run cli/);
  assert.match(read('run-gui.bat'), /Eidovara v0\.18\.0/);
  assert.match(read('package.json'), /"cli": "node src\/cli\.js"/);
  assert.match(read('src/electron/main.js'), /process\.platform !== 'linux'\) return/);
  assert.match(read('src/electron/main.js'), /disableHardwareAcceleration/);
  assert.match(read('src/electron/linux-runtime.js'), /chrome-sandbox/);
  const workspace = read('pnpm-workspace.yaml');
  assert.match(workspace, /electron: true/);
  assert.match(workspace, /electron-winstaller: true/);
});
