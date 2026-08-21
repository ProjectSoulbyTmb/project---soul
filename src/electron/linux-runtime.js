import fs from 'node:fs';
import path from 'node:path';

const SUID_BIT = 0o4000;

function readTrim(file) {
  try { return fs.readFileSync(file, 'utf8').trim(); } catch { return ''; }
}

export function linuxRuntimePlan({
  platform,
  uid,
  env = {},
  sandboxStat = null,
  cloneSysctl = '',
  maxUserNamespaces = '',
  driPresent = true
} = {}) {
  if (platform !== 'linux') {
    return { disableSandbox: false, disableGpu: false, sandboxHelperOk: false, usernsOk: false };
  }
  const sandboxHelperOk = Boolean(sandboxStat)
    && (Number(sandboxStat.mode) & SUID_BIT) !== 0
    && Number(sandboxStat.uid) === 0;
  let usernsOk = false;
  if (cloneSysctl === '0' || maxUserNamespaces === '0') usernsOk = false;
  else if (cloneSysctl) usernsOk = true;
  else if (maxUserNamespaces && Number(maxUserNamespaces) > 0) usernsOk = true;
  const disableSandbox = uid === 0 || env.EIDOVARA_DISABLE_SANDBOX === '1' || (!sandboxHelperOk && !usernsOk);
  const disableGpu = env.EIDOVARA_DISABLE_GPU === '1' || driPresent === false;
  return { disableSandbox, disableGpu, sandboxHelperOk, usernsOk };
}

export function inspectLinuxHost({ platform, uid, env, execPath }) {
  let sandboxStat = null;
  try { sandboxStat = fs.statSync(path.join(path.dirname(execPath), 'chrome-sandbox')); } catch {}
  return linuxRuntimePlan({
    platform,
    uid,
    env,
    sandboxStat,
    cloneSysctl: readTrim('/proc/sys/kernel/unprivileged_userns_clone'),
    maxUserNamespaces: readTrim('/proc/sys/user/max_user_namespaces'),
    driPresent: fs.existsSync('/dev/dri')
  });
}
