// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ELECTRON_INSTALL_NODE = { major: 22, minor: 12 };
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronInstall = path.join(root, 'node_modules', 'electron', 'install.js');

export function nodeMeetsElectronInstall(version = process.version) {
  const match = String(version).match(/^v?(\d+)\.(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > ELECTRON_INSTALL_NODE.major || (major === ELECTRON_INSTALL_NODE.major && minor >= ELECTRON_INSTALL_NODE.minor);
}

export function electronInstallStatus(version = process.version, installPath = electronInstall) {
  if (!fs.existsSync(installPath)) return { action: 'skip', reason: 'missing-package' };
  if (!nodeMeetsElectronInstall(version)) return { action: 'skip', reason: 'node-too-old' };
  return { action: 'install', reason: 'ok' };
}

function run() {
  const status = electronInstallStatus();
  if (status.action === 'skip' && status.reason === 'missing-package') {
    console.log('Skipping Electron binary download; the electron package is not installed.');
    return 0;
  }
  if (status.action === 'skip') {
    console.log(`Skipping Electron binary download: Electron 43 requires Node >=${ELECTRON_INSTALL_NODE.major}.${ELECTRON_INSTALL_NODE.minor}.0 (current ${process.version}). CLI, tests, and checks still run on Node >=20.`);
    return 0;
  }
  const result = spawnSync(process.execPath, [electronInstall], { stdio: 'inherit' });
  return result.status === null ? 1 : result.status;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exit(run());

