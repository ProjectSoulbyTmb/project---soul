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
  assert.match(renderer, /acceptAgeGate\(true\);setAgeGated\(false\);await refreshBackups/);
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

test('Escape closes legal, admin, and cancelable setup overlays', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /e\.key==='Escape'/);
  assert.match(renderer, /#legalOverlay/);
  assert.match(renderer, /#adminOverlay/);
});
