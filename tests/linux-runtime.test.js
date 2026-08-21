import test from 'node:test';
import assert from 'node:assert/strict';
import { linuxRuntimePlan } from '../src/electron/linux-runtime.js';

const setuidRoot = { mode: 0o104755, uid: 0 };
const unpackedHelper = { mode: 0o100755, uid: 1000 };

test('Windows packaged hosts keep Chromium sandbox and GPU', () => {
  const plan = linuxRuntimePlan({ platform: 'win32', uid: 1000, sandboxStat: unpackedHelper, driPresent: false, env: { EIDOVARA_DISABLE_SANDBOX: '1', EIDOVARA_DISABLE_GPU: '1' } });
  assert.equal(plan.disableSandbox, false);
  assert.equal(plan.disableGpu, false);
});

test('Linux keeps sandbox when chrome-sandbox is setuid root even without user namespaces', () => {
  const plan = linuxRuntimePlan({ platform: 'linux', uid: 1000, sandboxStat: setuidRoot, cloneSysctl: '0', maxUserNamespaces: '0', driPresent: true });
  assert.equal(plan.sandboxHelperOk, true);
  assert.equal(plan.usernsOk, false);
  assert.equal(plan.disableSandbox, false);
  assert.equal(plan.disableGpu, false);
});

test('Linux keeps sandbox when user namespaces work even if chrome-sandbox is not setuid', () => {
  const plan = linuxRuntimePlan({ platform: 'linux', uid: 1000, sandboxStat: unpackedHelper, cloneSysctl: '', maxUserNamespaces: '64035', driPresent: false });
  assert.equal(plan.sandboxHelperOk, false);
  assert.equal(plan.usernsOk, true);
  assert.equal(plan.disableSandbox, false);
  assert.equal(plan.disableGpu, true);
});

test('Linux disables sandbox only when the helper is unusable and user namespaces are unavailable', () => {
  const plan = linuxRuntimePlan({ platform: 'linux', uid: 1000, sandboxStat: unpackedHelper, cloneSysctl: '', maxUserNamespaces: '', driPresent: true });
  assert.equal(plan.disableSandbox, true);
  const debianLocked = linuxRuntimePlan({ platform: 'linux', uid: 1000, sandboxStat: unpackedHelper, cloneSysctl: '0', maxUserNamespaces: '64035', driPresent: true });
  assert.equal(debianLocked.disableSandbox, true);
});

test('Linux root and explicit env vars disable sandbox or GPU', () => {
  assert.equal(linuxRuntimePlan({ platform: 'linux', uid: 0, sandboxStat: setuidRoot, cloneSysctl: '1', driPresent: true }).disableSandbox, true);
  assert.equal(linuxRuntimePlan({ platform: 'linux', uid: 1000, env: { EIDOVARA_DISABLE_SANDBOX: '1' }, sandboxStat: setuidRoot, cloneSysctl: '1', driPresent: true }).disableSandbox, true);
  assert.equal(linuxRuntimePlan({ platform: 'linux', uid: 1000, env: { EIDOVARA_DISABLE_GPU: '1' }, sandboxStat: setuidRoot, cloneSysctl: '1', driPresent: true }).disableGpu, true);
});
