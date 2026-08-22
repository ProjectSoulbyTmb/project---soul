// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function attachPlayerWindows({
  BrowserWindow,
  ipcMain,
  getMainWindow,
  requireAgeGate,
  log = () => {}
}) {
  let popout = null;

  function closePopout() {
    try { if (popout && !popout.isDestroyed()) popout.close(); } catch {}
    popout = null;
  }

  function adultHides(payload = {}) {
    return payload.ageGated === true || payload.adultMode === true;
  }

  function glassPrefs() {
    return {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    };
  }

  ipcMain.handle('soul:popOutPlayer', async (_e, payload = {}) => {
    requireAgeGate();
    if (adultHides(payload)) {
      closePopout();
      return { poppedOut: false, hidden: true };
    }
    const video = payload.kind === 'video';
    if (!popout || popout.isDestroyed()) {
      popout = new BrowserWindow({
        width: video ? 640 : 380,
        height: video ? 420 : 156,
        minWidth: 280,
        minHeight: 120,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        skipTaskbar: false,
        title: 'Eidovara',
        show: false,
        webPreferences: glassPrefs()
      });
      popout.setMenuBarVisibility(false);
      popout.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      popout.webContents.on('will-navigate', e => e.preventDefault());
      popout.on('closed', () => { popout = null; try { getMainWindow()?.webContents.send('soul:playerDocked'); } catch {} });
      await popout.loadFile(path.join(__dirname, '../renderer/player-popout.html'));
    }
    try { popout.webContents.send('soul:playerPopout', payload); } catch (err) { log(String(err?.message || err)); }
    popout.show();
    return { poppedOut: true, hidden: false };
  });

  ipcMain.handle('soul:dockPlayer', async () => {
    requireAgeGate();
    closePopout();
    return { poppedOut: false };
  });

  ipcMain.handle('soul:listAudioOutputs', async () => {
    requireAgeGate();
    return {
      available: false,
      devices: [],
      reason: 'Output picker uses Chromium setSinkId in the player when the OS exposes devices.'
    };
  });

  return {
    closePopout,
    hideIfAdult(payload) { if (adultHides(payload)) closePopout(); }
  };
}

