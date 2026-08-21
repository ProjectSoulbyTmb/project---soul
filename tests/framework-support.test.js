import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { electronInstallStatus, nodeMeetsElectronInstall } from '../scripts/install-electron.js';

const read = file => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));

test('package engines stay honest about Node 20 app use and Electron 43 install', () => {
  assert.match(pkg.engines.node, />=20/);
  assert.match(pkg.engines.pnpm, />=10/);
  assert.match(pkg.packageManager, /^pnpm@10\./);
  assert.equal(pkg.scripts.postinstall, 'node scripts/install-electron.js');
  assert.equal(pkg.scripts['server:test'], 'node --test tests/server.test.js');
  assert.equal(pkg.devDependencies.electron, '43.4.1');
  assert.equal(pkg.devDependencies['electron-builder'], '26.15.3');
  assert.equal(pkg.devDependencies['@electron/packager'], '20.3.0');
  assert.equal(pkg.devDependencies.rcedit, '5.0.2');
  assert.ok(!pkg.dependencies?.wrangler && !pkg.devDependencies?.wrangler);
  const readme = read('README.md');
  assert.match(readme, /Node\.js 20\+/);
  assert.match(readme, /Node\.js >=22\.12/);
  assert.match(readme, /pnpm 10/);
  assert.match(readme, /server:test/);
  assert.doesNotMatch(readme, /official Linux|official macOS/i);
});

test('Electron binary download is skipped on Node 20 and runs on Node 22.12+', () => {
  assert.equal(nodeMeetsElectronInstall('v20.19.0'), false);
  assert.equal(nodeMeetsElectronInstall('v22.11.0'), false);
  assert.equal(nodeMeetsElectronInstall('v22.12.0'), true);
  assert.equal(electronInstallStatus('v20.0.0', '/missing/install.js').action, 'skip');
  assert.equal(electronInstallStatus('v20.0.0', 'scripts/install-electron.js').reason, 'node-too-old');
  assert.equal(electronInstallStatus('v22.14.0', 'scripts/install-electron.js').action, 'install');
});

test('optional integrations stay gated and do not invent a plugin host', () => {
  const html = read('src/renderer/index.html');
  const renderer = read('src/renderer/renderer.js');
  const main = read('src/electron/main.js');
  const serverReadme = read('server/README.md');
  assert.match(html, /Ollama-style/);
  assert.match(html, /\/api\/chat/);
  assert.match(html, /\/chat\/completions/);
  assert.match(html, /Premium OpenAI-style/);
  assert.match(html, /Wikipedia and Wikimedia Commons/);
  assert.match(html, /Brave Search API key/);
  assert.match(html, /OBS control will require its WebSocket authentication in a future integration/);
  assert.match(html, /Neural voice packs are not bundled/);
  assert.match(html, />System default</);
  assert.doesNotMatch(html, /Windows default/);
  assert.match(renderer, /System default/);
  assert.match(renderer, /speechSynthesis/);
  assert.match(renderer, /SpeechRecognition/);
  assert.doesNotMatch(renderer, /Installed Windows voices are available for playback/);
  assert.match(renderer, /open\.spotify\.com\/search/);
  assert.match(renderer, /youtube\.com\/results\?search_query/);
  assert.match(main, /preload\.cjs/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /normalizeProviderEndpoint/);
  assert.match(read('src/electron/preload.cjs'), /contextBridge/);
  assert.match(read('scripts/after-pack.cjs'), /rcedit/);
  assert.match(serverReadme, /npx wrangler deploy/);
  assert.match(serverReadme, /does not deploy the Worker/);
  assert.doesNotMatch(read('src/electron/main.js') + html + renderer, /plugin marketplace|third-party plugin host/i);
});
