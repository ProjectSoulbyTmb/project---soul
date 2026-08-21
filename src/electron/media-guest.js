// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  GUEST_PARTITION,
  GUEST_HONEST_COPY,
  GUEST_UA_CAVEAT,
  adultLockClosesGuest,
  ageGateClosesGuest,
  chromeUserAgent,
  classifyGuestNavigation,
  guestCaption,
  guestChromeWebPreferences,
  guestPermissionAllowed,
  guestWebPreferences,
  guestWindowOptions,
  normalizeGuestAddress,
  rememberGuestRecent
} from '../core/guest-navigation.js';
import { lookupPublicAddresses } from '../core/online-media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_HEIGHT = 56;
const HOME_CHROME_HEIGHT = 280;

export function attachMediaGuest({
  BrowserWindow,
  WebContentsView,
  session,
  ipcMain,
  shell,
  dialog,
  getMainWindow,
  requireAgeGate,
  getEngine,
  getConfig,
  userDataPath,
  versions = {},
  selectLocalMedia,
  log = () => {}
}) {
  let win = null;
  let guestView = null;
  let alwaysOnTop = false;
  let mode = 'home';
  let recents = loadRecents(userDataPath);
  let guestSessionHooked = false;

  function adultLocked() {
    try {
      const engine = getEngine?.();
      if (engine) return adultLockClosesGuest(engine.snapshot());
    } catch {}
    return false;
  }

  function blockedByGate() {
    return ageGateClosesGuest(getConfig?.() || {}) || adultLocked();
  }

  function destroyGuestPartitionWindows() {
    const ses = session.fromPartition(GUEST_PARTITION);
    for (const child of BrowserWindow.getAllWindows()) {
      if (child === getMainWindow?.()) continue;
      if (child === win) continue;
      try {
        if (child.webContents?.session === ses) child.destroy();
      } catch {}
    }
  }

  function destroyGuest() {
    try { if (guestView?.webContents && !guestView.webContents.isDestroyed()) guestView.webContents.stop(); } catch {}
    destroyGuestPartitionWindows();
    try { if (win && !win.isDestroyed()) win.destroy(); } catch {}
    win = null;
    guestView = null;
    mode = 'home';
    try { getMainWindow()?.webContents.send('soul:guestClosed'); } catch {}
  }

  function layout() {
    if (!win || win.isDestroyed() || !guestView) return;
    const [width, height] = win.getContentSize();
    const chromeH = mode === 'home' ? Math.min(HOME_CHROME_HEIGHT, height) : CHROME_HEIGHT;
    try {
      guestView.setBounds({
        x: 8,
        y: chromeH,
        width: Math.max(1, width - 16),
        height: Math.max(1, height - chromeH - 8)
      });
    } catch {}
  }

  function sendChrome(channel, payload) {
    try { if (win && !win.isDestroyed()) win.webContents.send(channel, payload); } catch {}
  }

  function guestSession() {
    const ses = session.fromPartition(GUEST_PARTITION);
    if (guestSessionHooked) return ses;
    guestSessionHooked = true;
    try { ses.setUserAgent(chromeUserAgent(versions.chrome || versions.CHROME)); } catch {}
    ses.setPermissionRequestHandler((_wc, permission, callback, details) => {
      callback(guestPermissionAllowed(permission, details));
    });
    ses.setPermissionCheckHandler((_wc, permission, _origin, details) => guestPermissionAllowed(permission, details));
    ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      const topLevel = details.resourceType === 'mainFrame';
      const decision = classifyGuestNavigation(details.url, { topLevel });
      callback({ cancel: !decision.allow });
    });
    return ses;
  }

  async function navigateGuest(raw, { record = true, searchFallback = true } = {}) {
    if (blockedByGate()) {
      destroyGuest();
      return { opened: false, closed: true, reason: 'adult-lock' };
    }
    const url = searchFallback ? (normalizeGuestAddress(raw) || classifyGuestNavigation(raw).url) : classifyGuestNavigation(raw).url;
    const decision = classifyGuestNavigation(url || raw, { topLevel: true });
    if (!decision.allow) return { opened: false, reason: decision.reason, copy: GUEST_HONEST_COPY };
    if (decision.url !== 'about:blank') {
      try {
        const host = new URL(decision.url).hostname;
        await lookupPublicAddresses(host);
      } catch {
        return { opened: false, reason: 'blocked-host' };
      }
    }
    ensureWindow();
    mode = decision.url === 'about:blank' ? 'home' : 'browse';
    layout();
    try { guestView.webContents.loadURL(decision.url); } catch (err) { log(String(err?.message || err)); }
    if (record && decision.url !== 'about:blank') {
      recents = rememberGuestRecent(recents, { url: decision.url });
      saveRecents(userDataPath, recents);
    }
    sendChrome('guest:navigated', { url: decision.url, recents, mode, copy: GUEST_HONEST_COPY, caveat: GUEST_UA_CAVEAT });
    return { opened: true, url: decision.url, partition: GUEST_PARTITION };
  }

  function attachGuestHandlers(contents) {
    contents.setWindowOpenHandler(({ url }) => {
      const decision = classifyGuestNavigation(url, { topLevel: true });
      if (!decision.allow) return { action: 'deny' };
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: win && !win.isDestroyed() ? win : undefined,
          width: 720,
          height: 540,
          autoHideMenuBar: true,
          webPreferences: { ...guestWebPreferences() }
        }
      };
    });
    contents.on('did-create-window', child => {
      try {
        child.setMenuBarVisibility(false);
        attachGuestHandlers(child.webContents);
      } catch {}
    });
    contents.on('will-attach-webview', event => event.preventDefault());
    contents.on('will-navigate', (event, url) => {
      const decision = classifyGuestNavigation(url, { topLevel: true });
      if (!decision.allow) {
        event.preventDefault();
        sendChrome('guest:blocked', { url, reason: decision.reason });
      }
    });
    contents.on('will-redirect', (event, url) => {
      const decision = classifyGuestNavigation(url, { topLevel: true });
      if (!decision.allow) event.preventDefault();
    });
    contents.on('page-title-updated', (_e, title) => {
      const url = contents.getURL();
      sendChrome('guest:caption', { title, url, caption: guestCaption(url, title) });
      if (classifyGuestNavigation(url).allow && url !== 'about:blank') {
        recents = rememberGuestRecent(recents, { url, title });
        saveRecents(userDataPath, recents);
      }
    });
    contents.on('did-navigate', (_e, url) => {
      mode = url === 'about:blank' ? 'home' : 'browse';
      layout();
      sendChrome('guest:navigated', { url, recents, mode, copy: GUEST_HONEST_COPY, caveat: GUEST_UA_CAVEAT });
    });
    contents.on('did-navigate-in-page', (_e, url) => {
      sendChrome('guest:navigated', { url, recents, mode: 'browse', copy: GUEST_HONEST_COPY, caveat: GUEST_UA_CAVEAT });
    });
  }

  function ensureWindow({ reducedMotion = false } = {}) {
    if (win && !win.isDestroyed()) return win;
    requireAgeGate();
    if (blockedByGate()) return null;
    const options = guestWindowOptions({ reducedMotion });
    win = new BrowserWindow({
      ...options,
      webPreferences: {
        ...guestChromeWebPreferences(),
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(__dirname, 'media-guest-preload.cjs')
      }
    });
    win.setMenuBarVisibility(false);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', e => e.preventDefault());
    win.webContents.on('will-attach-webview', e => e.preventDefault());
    win.on('closed', () => { win = null; guestView = null; try { getMainWindow()?.webContents.send('soul:guestClosed'); } catch {} });
    win.on('resize', () => layout());
    const ses = guestSession();
    const viewOptions = { webPreferences: { ...guestWebPreferences(), session: ses, sandbox: true, nodeIntegration: false } };
    if (typeof WebContentsView === 'function') {
      guestView = new WebContentsView(viewOptions);
      try { win.contentView.addChildView(guestView); } catch (err) { log(String(err?.message || err)); }
    } else {
      guestView = { webContents: win.webContents, setBounds() {} };
    }
    attachGuestHandlers(guestView.webContents);
    win.loadFile(path.join(__dirname, '../renderer/media-guest.html')).catch(err => log(String(err?.message || err)));
    const show = () => {
      layout();
      if (reducedMotion) {
        win.setOpacity(1);
        win.show();
        return;
      }
      const [width, height] = win.getSize();
      win.setOpacity(0);
      try { win.setSize(Math.max(420, Math.round(width * 0.96)), Math.max(220, Math.round(height * 0.96))); } catch {}
      win.show();
      let opacity = 0;
      const tick = () => {
        if (!win || win.isDestroyed()) return;
        opacity = Math.min(1, opacity + 0.12);
        win.setOpacity(opacity);
        if (opacity >= 1) {
          try { win.setSize(width, height); } catch {}
          return;
        }
        setTimeout(tick, 16);
      };
      tick();
    };
    if (win.webContents.isLoading()) win.webContents.once('did-finish-load', show);
    else show();
    return win;
  }

  function openGuest(payload = {}) {
    requireAgeGate();
    if (blockedByGate()) {
      destroyGuest();
      return { opened: false, closed: true, reason: 'adult-lock', copy: GUEST_HONEST_COPY };
    }
    ensureWindow({ reducedMotion: payload.reducedMotion === true });
    if (payload.alwaysOnTop === true || payload.alwaysOnTop === false) {
      alwaysOnTop = payload.alwaysOnTop === true;
      try { win?.setAlwaysOnTop(alwaysOnTop); } catch {}
    }
    if (payload.skipTaskbar === true || payload.skipTaskbar === false) {
      try { win?.setSkipTaskbar(payload.skipTaskbar === true); } catch {}
    }
    const url = String(payload.url || '').trim();
    if (!url) return navigateGuest('about:blank', { record: false, searchFallback: false });
    return navigateGuest(url, { record: true });
  }

  function hideIfAdult(state) {
    if (adultLockClosesGuest(state) || blockedByGate()) destroyGuest();
  }

  ipcMain.handle('soul:openMediaGuest', async (_e, payload = {}) => openGuest(payload));
  ipcMain.handle('soul:dockMediaGuest', async () => { destroyGuest(); return { opened: false }; });
  ipcMain.handle('guest:dock', async () => { destroyGuest(); return { opened: false }; });
  ipcMain.handle('guest:close', async () => { destroyGuest(); return { opened: false }; });
  ipcMain.handle('guest:openUrl', async (_e, value) => {
    requireAgeGate();
    return navigateGuest(value, { record: true });
  });
  ipcMain.handle('guest:back', async () => {
    requireAgeGate();
    try { if (guestView?.webContents.canGoBack()) guestView.webContents.goBack(); } catch {}
    return { ok: true };
  });
  ipcMain.handle('guest:home', async () => navigateGuest('about:blank', { record: false, searchFallback: false }));
  ipcMain.handle('guest:toggleAlwaysOnTop', async () => {
    requireAgeGate();
    alwaysOnTop = !alwaysOnTop;
    try { win?.setAlwaysOnTop(alwaysOnTop); } catch {}
    return { alwaysOnTop };
  });
  ipcMain.handle('guest:recents', async () => {
    requireAgeGate();
    return recents;
  });
  ipcMain.handle('guest:playLocal', async () => {
    requireAgeGate();
    if (typeof selectLocalMedia === 'function') {
      const item = await selectLocalMedia(win && !win.isDestroyed() ? win : getMainWindow());
      if (item) try { getMainWindow()?.webContents.send('soul:playLocalFromGuest', item); } catch {}
      return item;
    }
    const chosen = await dialog.showOpenDialog(win || getMainWindow(), {
      title: 'Open local media in Eidovara',
      properties: ['openFile'],
      filters: [{ name: 'Audio and video', extensions: ['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'opus', 'mp4', 'm4v', 'webm', 'mov', 'mkv'] }]
    });
    return chosen;
  });

  return {
    openGuest,
    destroyGuest,
    hideIfAdult,
    isOpen: () => Boolean(win && !win.isDestroyed())
  };
}

function recentsPath(userDataPath) {
  return path.join(String(userDataPath || ''), 'media-guest-recents.json');
}

function loadRecents(userDataPath) {
  try {
    const raw = JSON.parse(fs.readFileSync(recentsPath(userDataPath), 'utf8'));
    return Array.isArray(raw) ? raw.filter(item => classifyGuestNavigation(item?.url).allow).slice(0, 24) : [];
  } catch {
    return [];
  }
}

function saveRecents(userDataPath, list) {
  try {
    fs.mkdirSync(path.dirname(recentsPath(userDataPath)), { recursive: true });
    fs.writeFileSync(recentsPath(userDataPath), JSON.stringify(list.slice(0, 24), null, 2), { mode: 0o600 });
  } catch {}
}
