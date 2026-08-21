// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import {
  WEB_IDLE_URL,
  WEB_PARTITION,
  chromeUserAgent,
  classifyGuestNavigation,
  normalizeWebBounds,
  resolveWebTarget,
  shouldDestroyWorkspaceWeb,
  webGuestPreferences,
  webNavigationMessage,
  webNavigateAllowed
} from '../core/web-navigation.js';

function guestAlive(view) {
  return Boolean(view && view.webContents && !view.webContents.isDestroyed());
}

export function attachWorkspaceWeb({
  WebContentsView,
  ipcMain,
  shell,
  requireAgeGate,
  getMainWindow,
  getAgeGateAccepted,
  getAdultLock,
  processRef = globalThis.process
} = {}) {
  let view = null;
  let attached = false;
  let lastBounds = { x: 0, y: 0, width: 0, height: 0 };

  function adultLocked() {
    try { return getAdultLock && getAdultLock() === true; } catch { return false; }
  }

  function ageBlocked() {
    try { requireAgeGate(); } catch { return true; }
    if (typeof getAgeGateAccepted === 'function' && getAgeGateAccepted() !== true) return true;
    return false;
  }

  function gated() {
    return shouldDestroyWorkspaceWeb({
      adultAllowed: adultLocked(),
      ageGateAccepted: ageBlocked() ? false : true
    });
  }

  function mainWindow() {
    const win = getMainWindow && getMainWindow();
    if (!win || win.isDestroyed()) return null;
    return win;
  }

  function emit(status) {
    const win = mainWindow();
    try { win && win.webContents.send('soul:webStatus', status); } catch {}
  }

  function publicStatus(extra) {
    const wc = guestAlive(view) ? view.webContents : null;
    const url = wc ? String(wc.getURL() || '') : WEB_IDLE_URL;
    return {
      url,
      partition: WEB_PARTITION,
      attached,
      visible: attached,
      canGoBack: Boolean(wc && wc.canGoBack && wc.canGoBack()),
      canGoForward: Boolean(wc && wc.canGoForward && wc.canGoForward()),
      title: wc && wc.getTitle ? String(wc.getTitle() || '').slice(0, 120) : '',
      ...(extra && typeof extra === 'object' ? extra : {})
    };
  }

  function detach() {
    const win = mainWindow();
    if (view && win && win.contentView && typeof win.contentView.removeChildView === 'function') {
      try { win.contentView.removeChildView(view); } catch {}
    }
    attached = false;
  }

  function destroy() {
    detach();
    const wc = view && view.webContents;
    try {
      if (wc && !wc.isDestroyed() && typeof wc.close === 'function') wc.close();
    } catch {}
    view = null;
    attached = false;
    const status = publicStatus({ destroyed: true });
    emit(status);
    return status;
  }

  function hideIfGated() {
    const plan = gated();
    if (plan.destroy) destroy();
    return plan;
  }

  function applyBounds(bounds) {
    lastBounds = normalizeWebBounds(bounds || lastBounds);
    if (!guestAlive(view) || !attached) return lastBounds;
    if (lastBounds.width < 8 || lastBounds.height < 8) return lastBounds;
    try { view.setBounds(lastBounds); } catch {}
    return lastBounds;
  }

  function attachNav(guest) {
    const wc = guest.webContents;
    wc.setWindowOpenHandler(({ url }) => {
      const allowed = webNavigateAllowed(url);
      if (allowed.ok) {
        wc.loadURL(allowed.url).catch(() => {});
        return { action: 'deny' };
      }
      return { action: 'deny' };
    });
    wc.on('will-navigate', (e, url) => {
      const allowed = webNavigateAllowed(url);
      if (!allowed.ok) e.preventDefault();
    });
    wc.on('will-redirect', (e, url) => {
      const allowed = webNavigateAllowed(url);
      if (!allowed.ok) e.preventDefault();
    });
    wc.on('will-attach-webview', e => e.preventDefault());
    wc.on('did-navigate', (_e, url) => emit(publicStatus({ url: String(url || '') })));
    wc.on('did-navigate-in-page', (_e, url) => emit(publicStatus({ url: String(url || '') })));
    wc.on('did-fail-load', (_e, code, desc, url) => {
      emit(publicStatus({ error: `${code}: ${desc}`, failedUrl: url }));
    });
    wc.session.setPermissionRequestHandler((_req, _permission, callback) => callback(false));
    wc.session.setPermissionCheckHandler(() => false);
    try { wc.setUserAgent(chromeUserAgent(processRef && processRef.versions && processRef.versions.chrome)); } catch {}
  }

  function ensureView() {
    const plan = gated();
    if (plan.destroy) throw new Error(webNavigationMessage(plan.reason));
    if (typeof WebContentsView !== 'function') throw new Error(webNavigationMessage('missing'));
    if (guestAlive(view)) return view;
    const prefs = webGuestPreferences();
    view = new WebContentsView({
      webPreferences: {
        partition: prefs.partition,
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: false
      }
    });
    attachNav(view);
    try { view.webContents.loadURL(WEB_IDLE_URL); } catch {}
    return view;
  }

  function show(bounds, visible) {
    const plan = gated();
    if (plan.destroy) {
      destroy();
      throw new Error(webNavigationMessage(plan.reason));
    }
    if (visible === false) {
      detach();
      return publicStatus();
    }
    const win = mainWindow();
    if (!win) throw new Error('The main window is not available.');
    const guest = ensureView();
    if (!attached) {
      if (!win.contentView || typeof win.contentView.addChildView !== 'function') {
        throw new Error(webNavigationMessage('missing'));
      }
      try { win.contentView.addChildView(guest); } catch (err) {
        const message = err && err.message ? String(err.message) : webNavigationMessage('missing');
        throw new Error(message);
      }
      attached = true;
    }
    applyBounds(bounds);
    return publicStatus();
  }

  async function navigate(raw) {
    const plan = gated();
    if (plan.destroy) {
      destroy();
      throw new Error(webNavigationMessage(plan.reason));
    }
    const target = resolveWebTarget(raw);
    if (!target.ok) throw new Error(webNavigationMessage(target.reason));
    const guest = ensureView();
    const win = mainWindow();
    if (win && !attached) show(lastBounds, true);
    await guest.webContents.loadURL(target.url);
    return publicStatus();
  }

  function history(dir) {
    if (!guestAlive(view)) return publicStatus();
    const wc = view.webContents;
    if (dir === 'back' && wc.canGoBack()) wc.goBack();
    else if (dir === 'forward' && wc.canGoForward()) wc.goForward();
    return publicStatus();
  }

  async function openExternal(raw) {
    const plan = gated();
    if (plan.destroy) {
      destroy();
      throw new Error(webNavigationMessage(plan.reason));
    }
    const candidate = String(raw || '').trim() || (guestAlive(view) ? view.webContents.getURL() : '');
    const allowed = classifyGuestNavigation(candidate);
    if (!allowed.ok || allowed.blank) throw new Error(webNavigationMessage(allowed.reason || 'empty'));
    if (!shell || typeof shell.openExternal !== 'function') throw new Error('System browser is unavailable.');
    await shell.openExternal(allowed.url);
    return publicStatus({ openedExternal: allowed.url });
  }

  if (ipcMain) {
    ipcMain.handle('soul:webShow', (_e, input = {}) => {
      const bounds = normalizeWebBounds(input && input.bounds ? input.bounds : input);
      return show(bounds, input && Object.prototype.hasOwnProperty.call(input, 'visible') ? input.visible !== false : true);
    });
    ipcMain.handle('soul:webHide', () => destroy());
    ipcMain.handle('soul:webLayout', (_e, bounds) => {
      applyBounds(bounds);
      return publicStatus();
    });
    ipcMain.handle('soul:webNavigate', (_e, url) => navigate(url));
    ipcMain.handle('soul:webHistory', (_e, dir) => history(dir));
    ipcMain.handle('soul:webOpenExternal', (_e, url) => openExternal(url));
    ipcMain.handle('soul:webStatus', () => publicStatus());
  }

  return {
    show,
    hide: destroy,
    destroy,
    detach,
    layout: applyBounds,
    navigate,
    history,
    openExternal,
    status: publicStatus,
    hideIfGated,
    partition: WEB_PARTITION
  };
}
