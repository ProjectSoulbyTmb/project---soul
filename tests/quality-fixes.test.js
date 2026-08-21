import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

test('Free edition can still clear a leftover Brave key', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /clearSearch\.disabled=false/);
  assert.doesNotMatch(renderer, /clearSearch\.disabled=!premium/);
  assert.match(read('src/electron/main.js'), /if \(incoming\?\.clearSearchApiKey\) config\.encryptedSearchApiKey = ''/);
});

test('Ctrl+A does not steal select-all from text fields', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(renderer, /age-gated/);
});

test('age gate inert-blocks the app and refreshes backups after accept', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /toggleAttribute\('inert'/);
  assert.match(renderer, /function setAgeGated/);
  assert.match(renderer, /acceptAgeGate\(true\);state=await window\.soul\.snapshot\(\);setAgeGated\(false\);await refreshAdminSession\(\)\.catch\(\(\)=>\{\}\);await refreshBackups/);
});

test('settings save normalizes local and Premium endpoints', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /normalizeProviderEndpoint\(config\.endpoint, \{ localOnly: provider === 'local' \}\)/);
  assert.match(main, /remember[\s\S]*opts\?\.kind/);
});

test('memory panel can record preference kind through preload', () => {
  assert.match(read('src/electron/preload.cjs'), /remember: \(c, opts\) => ipcRenderer\.invoke\('soul:remember', c, opts\)/);
  assert.match(read('src/renderer/renderer.js'), /remember\(v,\{kind:'preference'\}\)/);
});

test('Escape closes legal, admin, palette, cheatsheet, and cancelable setup overlays', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /e\.key==='Escape'/);
  assert.match(renderer, /#legalOverlay/);
  assert.match(renderer, /#adminOverlay/);
  assert.match(renderer, /#commandPalette/);
  assert.match(renderer, /#shortcutSheet/);
  assert.match(renderer, /#cheatsheetOverlay/);
});

test('desktop chrome and installer EULA match package.json version', () => {
  const version = JSON.parse(read('package.json')).version;
  const dotted = version.replace(/\./g, '\\.');
  assert.match(read('src/renderer/index.html'), new RegExp(`<title>Eidovara v${dotted}</title>`));
  assert.match(read('src/electron/main.js'), new RegExp(`title: 'Eidovara v${dotted}'`));
  assert.match(read('installer/EULA.txt'), new RegExp(`Version ${dotted} Stable Alpha`));
  assert.match(read('docs/knowledge.js'), new RegExp(`export const ASSIST_VERSION = '${dotted}'`));
});

test('desktop store and openExternal reject credentialed HTTPS URLs', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /The store link must use HTTPS without credentials/);
  assert.match(main, /soul:openExternal[\s\S]*requireAgeGate[\s\S]*httpsOnlyUrl/);
  assert.match(read('src/core/updater.js'), /url\.username \|\| url\.password/);
});

test('desktop does not create a Soul profile until 18+ is accepted', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /function ensureEngine/);
  assert.match(main, /if \(config\.ageGateAccepted === true\) ensureEngine\(\)/);
  assert.match(main, /soul:snapshot[\s\S]*defaultProfile/);
  assert.match(main, /acceptAgeGate[\s\S]*ensureEngine\(\)/);
  assert.doesNotMatch(main, /loadConfig\(\);\s*const dataDir = path\.join\(app\.getPath\('userData'\), 'profiles'\)/);
});
