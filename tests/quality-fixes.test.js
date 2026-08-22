import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchTolerant } from './helpers/match-tolerant.js';

const read = file => fs.readFileSync(file, 'utf8');

test('Free edition can still clear a leftover Brave key', () => {
  const renderer = read('src/renderer/renderer.js');
  matchTolerant(renderer, /clearSearch\.disabled=false/);
  assert.doesNotMatch(renderer, /clearSearch\.disabled=!premium/);
  matchTolerant(
    read('src/electron/main.js'),
    /if \(incoming\?\.clearSearchApiKey\) config\.encryptedSearchApiKey = ''/
  );
});

test('Ctrl+A does not steal select-all from text fields', () => {
  const renderer = read('src/renderer/renderer.js');
  assert.match(renderer, /input, textarea, select, \[contenteditable="true"\]/);
  assert.match(renderer, /age-gated/);
});

test('age gate inert-blocks the app and refreshes backups after accept', () => {
  const renderer = read('src/renderer/renderer.js');
  matchTolerant(renderer, /toggleAttribute\('inert'/);
  matchTolerant(renderer, /function setAgeGated/);
  matchTolerant(
    renderer,
    /acceptAgeGate\(true\);state=await window\.soul\.snapshot\(\);setAgeGated\(false\);await refreshAdminSession\(\)\.catch\(\(\)=>\{\}\);await refreshBackups/
  );
});

test('settings save normalizes local and Premium endpoints', () => {
  const main = read('src/electron/main.js');
  matchTolerant(
    main,
    /normalizeProviderEndpoint\(config\.endpoint,/
  );
  matchTolerant(main, /localOnly: provider === 'local'/);
  matchTolerant(main, /remember[\s\S]*opts\?\.kind/);
});

test('memory panel can record preference kind through preload', () => {
  matchTolerant(
    read('src/electron/preload.cjs'),
    /remember: \(c, opts\) => ipcRenderer\.invoke\('soul:remember', c, opts\)/
  );
  matchTolerant(read('src/renderer/renderer.js'), /remember\(v,\{kind:'preference'\}\)/);
});

test('Escape closes legal, admin, palette, cheatsheet, and cancelable setup overlays', () => {
  const renderer = read('src/renderer/renderer.js');
  matchTolerant(renderer, /e\.key==='Escape'/);
  matchTolerant(renderer, /#legalOverlay/);
  matchTolerant(renderer, /#adminOverlay/);
  matchTolerant(renderer, /#commandPalette/);
  matchTolerant(renderer, /#shortcutSheet/);
  matchTolerant(renderer, /#cheatsheetOverlay/);
});

test('desktop chrome and installer EULA match package.json version', () => {
  const version = JSON.parse(read('package.json')).version;
  const dotted = version.replace(/\./g, '\\.');
  assert.match(read('src/renderer/index.html'), new RegExp(`<title>Eidovara v${dotted}</title>`));
  assert.match(read('src/electron/main.js'), /title: `Eidovara v\$\{app\.getVersion\(\)\}`/);
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
  assert.doesNotMatch(
    main,
    /loadConfig\(\);\s*const dataDir = path\.join\(app\.getPath\('userData'\), 'profiles'\)/
  );
});

test('desktop log redacts bearer tokens and obvious secrets', async () => {
  const { redactSecretsForLog } = await import('../src/core/log-redact.js');
  assert.match(redactSecretsForLog('Authorization: Bearer sk-live-abc123'), /Bearer \[redacted\]/);
  assert.doesNotMatch(
    redactSecretsForLog('Authorization: Bearer sk-live-abc123'),
    /sk-live-abc123/
  );
  assert.match(redactSecretsForLog('api_key=supersecret'), /api_key=\[redacted\]/i);
  const main = read('src/electron/main.js');
  assert.match(main, /redactSecretsForLog/);
  assert.match(main, /function log\(message, error\)/);
});

test('desktop main process requests a single instance lock', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /requestSingleInstanceLock/);
  assert.match(main, /second-instance/);
});
