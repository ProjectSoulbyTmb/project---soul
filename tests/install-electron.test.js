import test from 'node:test';
import assert from 'node:assert/strict';
import { electronInstallStatus, nodeMeetsElectronInstall } from '../scripts/install-electron.js';

test('Electron 43 binary install is skipped on Node older than 22.12', () => {
  assert.equal(nodeMeetsElectronInstall('v20.11.1'), false);
  assert.equal(nodeMeetsElectronInstall('v22.11.0'), false);
  assert.equal(nodeMeetsElectronInstall('v22.12.0'), true);
  assert.equal(electronInstallStatus('v20.19.0', '/tmp/missing-electron-install.js').action, 'skip');
});
