// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  autoCheckEnabled,
  checkForUpdate,
  downloadUpdate,
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
  shell,
  log = () => {}
}) {
  const autoUpdater = loadAutoUpdater();
  let lastStatus = snapshot({ phase: 'idle', available: false, currentVersion: app.getVersion() });
  let pendingNsis = null;
  let pendingManifest = null;
  let checking = false;
  let installConfirmed = false;
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
    autoUpdater.on('update-downloaded', async (info) => {
      try {
        const evaluated = evaluateElectronUpdate(info, app.getVersion());
        if (!evaluated.available) {
          pendingNsis = null;
          emit({ phase: 'current', available: false, version: evaluated.version, reason: evaluated.reason });
          return;
        }
        requireUpdateIntegrity(info);
        const filePath = String(info?.downloadedFile || '');
        if (filePath && typeof scanUpdateForMalware === 'function') {
          const malwareScan = await scanUpdateForMalware(filePath);
          if (malwareScan?.threatDetected) throw new Error('Microsoft Defender reported that this update requires security action. The installer was not opened.');
        }
        pendingNsis = { info, evaluated, filePath };
        emit({
          phase: 'ready',
          available: true,
          version: evaluated.version,
          notes: evaluated.notes,
          provider: 'electron-updater',
          error: ''
        });
        if (installConfirmed) return;
        const window = getMainWindow();
        if (!window) return;
        const answer = await dialog.showMessageBox(window, {
          type: 'info',
          buttons: ['Restart and install', 'Later'],
          defaultId: 0,
          cancelId: 1,
          title: 'Eidovara update ready',
          message: `Eidovara ${evaluated.version} is ready to install.`,
          detail: 'The Windows installer was downloaded from GitHub Releases and checksum-verified. Builds are Authenticode-unsigned; Windows SmartScreen may warn. Eidovara will quit to run the installer. Conversations on this PC are already saved.'
        });
        if (answer.response === 0) {
          installConfirmed = true;
          autoUpdater.autoInstallOnAppQuit = false;
          autoUpdater.quitAndInstall(true, true);
        }
      } catch (err) {
        pendingNsis = null;
        installConfirmed = false;
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
    pendingNsis = { info, evaluated, filePath: '' };
    return snapshot({
      phase: 'available',
      available: true,
      currentVersion,
      version: evaluated.version,
      notes: evaluated.notes,
      configured: true,
      provider: 'electron-updater',
      error: ''
    });
  }

  async function checkManifest(currentVersion) {
    const update = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion });
    pendingManifest = update?.available ? update : null;
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
      pendingManifest = null;
      return emit({ phase: 'error', available: false, error: honestUpdateError(err), currentVersion, configured: Boolean(RELEASE_MANIFEST_URL) });
    } finally {
      checking = false;
    }
  }

  async function install() {
    requireAgeGate();
    const window = getMainWindow();
    if (pendingNsis?.evaluated?.available && autoUpdater) {
      const version = pendingNsis.evaluated.version;
      const answer = await dialog.showMessageBox(window, {
        type: 'question',
        buttons: ['Restart and install', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        title: 'Install Eidovara update',
        message: `Install Eidovara ${version}?`,
        detail: 'The Windows installer is downloaded from GitHub Releases only after this prompt and is checksum-verified (SHA-512 in latest.yml). Builds are Authenticode-unsigned; Windows SmartScreen may warn. Eidovara will quit to run the installer. Conversations on this PC are already saved. Unsaved work in other apps is not closed by this prompt until you confirm.'
      });
      if (answer.response !== 0) return { cancelled: true };
      installConfirmed = true;
      if (!pendingNsis.filePath) {
        emit({ phase: 'downloading', available: true, version, provider: 'electron-updater', percent: 0, error: '' });
        await autoUpdater.downloadUpdate();
      }
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.quitAndInstall(true, true);
      return { restarting: true, provider: 'electron-updater', version, unsigned: true };
    }
    if (!pendingManifest?.available) pendingManifest = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() });
    if (!pendingManifest?.available) throw new Error('No update is available.');
    requireUpdateIntegrity(pendingManifest);
    const answer = await dialog.showMessageBox(window, {
      type: 'question',
      buttons: ['Download and open', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      title: 'Install Eidovara update',
      message: `Install Eidovara ${pendingManifest.version}?`,
      detail: pendingManifest.packageType === 'ready-folder-zip'
        ? 'The ready-to-run folder will be downloaded over HTTPS, verified with SHA-256, and opened for extraction. Builds are Authenticode-unsigned.'
        : 'The installer will be downloaded over HTTPS from GitHub Releases, verified with SHA-256, and opened. Builds are Authenticode-unsigned; Windows SmartScreen may warn.'
    });
    if (answer.response !== 0) return { cancelled: true };
    const downloaded = await downloadUpdate(pendingManifest, path.join(app.getPath('userData'), 'updates'));
    const malwareScan = await scanUpdateForMalware(downloaded.path);
    if (malwareScan?.threatDetected) throw new Error('Microsoft Defender reported that this update requires security action. The installer was not opened.');
    const error = await shell.openPath(downloaded.path);
    if (error) throw new Error(error);
    return { ...downloaded, malwareScan, launched: true, provider: 'github-manifest', unsigned: true };
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
    config.autoCheckUpdates = enabled === true;
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
