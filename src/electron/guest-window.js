// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { classifyGuestUrl, GUEST_PARTITION } from '../core/guest-web.js';

export function attachGuestWindow({
  BrowserWindow,
  ipcMain,
  session,
  requireAgeGate,
  isEnabled,
  adultLock,
  log = () => {}
}) {
  let guest = null;

  function closeGuest() {
    try { if (guest && !guest.isDestroyed()) guest.close(); } catch {}
    guest = null;
  }

  function guestPrefs() {
    return {
      partition: GUEST_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    };
  }

  function allowNavigate(url) {
    return classifyGuestUrl(url).ok === true;
  }

  function attachGuards(win) {
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (!allowNavigate(url)) return { action: 'deny' };
      win.loadURL(url).catch(err => log(String(err?.message || err)));
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
      if (!allowNavigate(url)) event.preventDefault();
    });
    win.webContents.on('will-attach-webview', event => event.preventDefault());
    win.webContents.on('will-redirect', (event, url) => {
      if (!allowNavigate(url)) event.preventDefault();
    });
  }

  async function open(url) {
    requireAgeGate();
    if (adultLock()) {
      closeGuest();
      throw new Error('Adult Mode is on, so the web guest window is closed.');
    }
    if (!isEnabled()) throw new Error('Web guest is off. Enable it in Settings to open an HTTPS page in an isolated window.');
    const classified = classifyGuestUrl(url);
    if (!classified.ok) throw new Error('Only public HTTPS pages can open in the guest window.');
    if (!guest || guest.isDestroyed()) {
      guest = new BrowserWindow({
        width: 1100,
        height: 740,
        minWidth: 640,
        minHeight: 420,
        title: 'Eidovara guest',
        show: false,
        webPreferences: guestPrefs()
      });
      guest.setMenuBarVisibility(false);
      attachGuards(guest);
      guest.on('closed', () => { guest = null; });
    }
    await guest.loadURL(classified.url);
    guest.show();
    return { opened: true, url: classified.url, partition: GUEST_PARTITION };
  }

  ipcMain.handle('soul:openGuest', (_e, url) => open(url));
  ipcMain.handle('soul:closeGuest', () => {
    requireAgeGate();
    closeGuest();
    return { opened: false };
  });

  try {
    session?.fromPartition?.(GUEST_PARTITION)?.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  } catch {}

  return {
    closeGuest,
    hideIfAdult() { if (adultLock()) closeGuest(); }
  };
}
