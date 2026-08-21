// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { createRequire } from 'node:module';
import {
  autoCheckEnabled,
  checkForUpdate,
  evaluateElectronUpdate,
  honestUpdateError,
  isPrerelease,
  requireUpdateIntegrity
} from '../core/updater.js';
import { RELEASE_MANIFEST_URL, GITHUB_PUBLISH } from '../config/release-channel.js';

const STARTUP_DELAY_MS = 12_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function loadAutoUpdater() {
  try {
    const require = createRequire(import.meta.url);
    return require('electron-updater').autoUpdater;
  } catch {
    return null;
  }
}

function snapshot(extra = {}) {
  return {
    configured: Boolean(RELEASE_MANIFEST_URL) || Boolean(GITHUB_PUBLISH?.repo),
    unsigned: true,
    authenticodeSigned: false,
    ...extra
  };
}

export function attachDesktopUpdater({
  app,
  dialog,
  ipcMain,
  getMainWindow,
  getConfig,
  saveConfig,
  requireAgeGate,
  publicConfig,
  scanUpdateForMalware,
  log = () => {}
}) {
  const autoUpdater = loadAutoUpdater();
  let lastStatus = snapshot({ phase: 'idle', available: false, currentVersion: app.getVersion() });
  let pendingNsis = null;
  let pendingEval = null;
  let checking = false;
  let timers = [];

  function emit(status) {
    lastStatus = snapshot({ currentVersion: app.getVersion(), ...lastStatus, ...status });
    const window = getMainWindow();
    try { window?.webContents?.send('soul:updateStatus', lastStatus); } catch {}
    return lastStatus;
  }

  function configureUpdater() {
    if (!autoUpdater) return false;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = isPrerelease(app.getVersion());
    autoUpdater.disableWebInstaller = true;
    if (typeof autoUpdater.setFeedURL === 'function' && GITHUB_PUBLISH?.owner && GITHUB_PUBLISH?.repo) {
      try { autoUpdater.setFeedURL({ ...GITHUB_PUBLISH }); } catch {}
    }
    autoUpdater.verifyUpdateCodeSignature = async () => null;
    return true;
  }

  if (autoUpdater) {
    autoUpdater.logger = { info: message => log(String(message)), warn: message => log(String(message)), error: message => log(String(message)), debug: () => {} };
    autoUpdater.on('error', err => {
      log('Updater error', err);
      emit({ phase: 'error', available: false, error: honestUpdateError(err) });
    });
    autoUpdater.on('download-progress', progress => {
      const percent = Math.max(0, Math.min(100, Math.round(Number(progress?.percent) || 0)));
      emit({ phase: 'downloading', available: true, percent, error: '' });
    });
    autoUpdater.on('update-downloaded', info => {
      try {
        const evaluated = evaluateElectronUpdate(info, app.getVersion());
        if (!evaluated.available) {
          pendingNsis = null;
          pendingEval = null;
          emit({ phase: 'current', available: false, version: evaluated.version, reason: evaluated.reason });
          return;
        }
        requireUpdateIntegrity(info);
        pendingEval = evaluated;
        pendingNsis = { info, evaluated, filePath: String(info?.downloadedFile || '') };
        emit({
          phase: 'ready',
          available: true,
          version: evaluated.version,
          notes: evaluated.notes,
          provider: 'electron-updater',
          error: ''
        });
      } catch (err) {
        pendingNsis = null;
        emit({ phase: 'error', available: false, error: honestUpdateError(err) });
      }
    });
  }

  async function checkElectron(currentVersion) {
    if (!autoUpdater || !app.isPackaged || process.platform !== 'win32') return null;
    configureUpdater();
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo;
    if (!info) return snapshot({ phase: 'current', available: false, currentVersion, configured: true, provider: 'electron-updater' });
    const evaluated = evaluateElectronUpdate(info, currentVersion);
    if (!evaluated.available) {
      pendingNsis = null;
      pendingEval = null;
      return snapshot({
        phase: 'current',
        available: false,
        currentVersion,
        version: evaluated.version,
        reason: evaluated.reason,
        configured: true,
        provider: 'electron-updater'
      });
    }
    pendingEval = evaluated;
    return snapshot({
      phase: pendingNsis?.filePath ? 'ready' : 'available',
      available: true,
      currentVersion,
      version: evaluated.version,
      notes: evaluated.notes,
      configured: true,
      provider: 'electron-updater'
    });
  }

  async function checkManifest(currentVersion) {
    const update = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion });
    return snapshot({
      ...update,
      phase: update.available ? 'available' : 'current',
      provider: 'github-manifest',
      error: ''
    });
  }

  async function check({ force = false } = {}) {
    requireAgeGate();
    const currentVersion = app.getVersion();
    if (!force && !autoCheckEnabled(getConfig())) {
      return emit({ phase: 'idle', available: lastStatus.available === true, skipped: true, reason: 'auto-check-disabled', currentVersion });
    }
    if (checking) return lastStatus;
    checking = true;
    emit({ phase: 'checking', error: '', currentVersion });
    try {
      try {
        const electronResult = await checkElectron(currentVersion);
        if (electronResult) return emit(electronResult);
      } catch (err) {
        log('electron-updater check failed; trying GitHub update.json', err);
        const message = honestUpdateError(err);
        if (/checksum|metadata is missing|refused to install/i.test(message)) return emit({ phase: 'error', available: false, error: message, currentVersion });
      }
      return emit(await checkManifest(currentVersion));
    } catch (err) {
      return emit({ phase: 'error', available: false, error: honestUpdateError(err), currentVersion, configured: Boolean(RELEASE_MANIFEST_URL) });
    } finally {
      checking = false;
    }
  }

  async function install() {
    requireAgeGate();
    const window = getMainWindow();
    if (!app.isPackaged || process.platform !== 'win32' || !autoUpdater) {
      throw new Error('Packaged Windows builds install updates from GitHub Releases via electron-updater (latest.yml hash). Development builds have no installer channel. Eidovara does not download an arbitrary .exe and run it.');
    }
    if (!pendingEval?.available) await check({ force: true });
    if (!pendingEval?.available) throw new Error('No update is available from GitHub Releases latest.yml.');
    configureUpdater();
    if (!pendingNsis?.filePath) {
      const first = await dialog.showMessageBox(window, {
        type: 'question',
        buttons: ['Download update', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        title: 'Download Eidovara update',
        message: `Download Eidovara ${pendingEval.version}?`,
        detail: 'Download the Authenticode-unsigned installer from the official GitHub Release. electron-updater verifies the latest.yml hash. This build is not Microsoft-signed. Windows SmartScreen may warn. Eidovara will ask again before installing and restarting. There is no custom download-any-exe path.'
      });
      if (first.response !== 0) return { cancelled: true };
      emit({ phase: 'downloading', available: true, version: pendingEval.version, provider: 'electron-updater', percent: 0, error: '' });
      await autoUpdater.downloadUpdate();
    }
    const filePath = pendingNsis?.filePath || '';
    if (filePath && typeof scanUpdateForMalware === 'function') {
      const malwareScan = await scanUpdateForMalware(filePath);
      if (malwareScan?.threatDetected) throw new Error('Microsoft Defender reported that this update requires security action. The installer was not launched.');
    }
    const second = await dialog.showMessageBox(window, {
      type: 'question',
      buttons: ['Restart and install', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Install Eidovara update',
      message: `Restart Eidovara to install ${pendingEval.version}?`,
      detail: 'The Windows installer was downloaded from GitHub Releases and checksum-verified (SHA-512 in latest.yml). Setup overwrites the existing Eidovara program install. App data is kept. Builds are Authenticode-unsigned; Windows SmartScreen may warn. Eidovara will quit to run the installer.'
    });
    if (second.response !== 0) return { cancelled: true, downloaded: true };
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.quitAndInstall(false, true);
    return { restarting: true, launched: true, provider: 'electron-updater', version: pendingEval.version, unsigned: true };
  }

  function stop() {
    for (const timer of timers) clearTimeout(timer), clearInterval(timer);
    timers = [];
  }

  function schedule() {
    stop();
    if (!autoCheckEnabled(getConfig())) return;
    const startup = setTimeout(() => {
      if (getConfig()?.ageGateAccepted === true && autoCheckEnabled(getConfig())) check({ force: false }).catch(err => log('Scheduled update check failed', err));
    }, STARTUP_DELAY_MS);
    const interval = setInterval(() => {
      if (getConfig()?.ageGateAccepted === true && autoCheckEnabled(getConfig())) check({ force: false }).catch(err => log('Interval update check failed', err));
    }, CHECK_INTERVAL_MS);
    if (typeof interval.unref === 'function') interval.unref();
    if (typeof startup.unref === 'function') startup.unref();
    timers = [startup, interval];
  }

  ipcMain.handle('soul:checkForUpdates', async () => {
    try { return await check({ force: true }); }
    catch (err) { return emit({ phase: 'error', available: false, error: honestUpdateError(err) }); }
  });
  ipcMain.handle('soul:installUpdate', async () => install());
  ipcMain.handle('soul:setAutoCheckUpdates', (_e, enabled) => {
    requireAgeGate();
    const config = getConfig();
    config.autoCheckUpdates = enabled !== false;
    saveConfig();
    schedule();
    return publicConfig();
  });

  return {
    schedule,
    stop,
    check,
    getStatus: () => lastStatus
  };
}
