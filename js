// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chromeUserAgent,
  guestNavigateAllowed,
  overlayWindowOptions,
  rememberOverlayRecent,
  resolveOverlayTarget
} from '../core/guest-overlay.js';
import {
  chromeHeightFor,
  formatEidovaraProcessMetrics,
  normalizeOverlayBounds,
  normalizeOverlayLayout,
  shouldDestroyGuestOverlays
} from '../core/overlays.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function iconPath() {
  return path.join(__dirname, '../../assets/branding/eidovara-512.png');
}

function isView(guest) {
  return guest && typeof guest.setBounds === 'function' && guest.webContents && typeof guest.isDestroyed !== 'function';
}

function guestAlive(guest) {
  if (!guest) return false;
  if (typeof guest.isDestroyed === 'function') return !guest.isDestroyed();
  return !guest.webContents?.isDestroyed?.();
}

function guestContents(guest) {
  return guest?.webContents || guest;
}

export function createGuestOverlayManager({
  BrowserWindow,
  WebContentsView,
  dialog,
  shell,
  requireAgeGate,
  getMainWindow,
  persistRecents,
  loadRecents,
  getOverlayLayout,
  setOverlayLayout,
  getAgeGateAccepted,
  getAdultLock,
  processRef = globalThis.process
} = {}) {
  const overlays = new Map();
  const persistTimers = new Map();

  function adultLocked() {
    try { return getAdultLock?.() === true; } catch { return false; }
  }

  function ageBlocked() {
    try { requireAgeGate(); } catch { return true; }
    if (typeof getAgeGateAccepted === 'function' && getAgeGateAccepted() !== true) return true;
    return false;
  }

  function destroyPlan() {
    return shouldDestroyGuestOverlays({
      adultAllowed: adultLocked(),
      ageGateAccepted: ageBlocked() ? false : true
    });
  }

  function senderKind(event) {
    const wc = event?.sender;
    for (const [kind, entry] of overlays) {
      if (entry.chrome?.webContents === wc || guestContents(entry.guest) === wc || entry.chat?.webContents === wc) return kind;
    }
    return '';
  }

  function entryOf(kind) {
    return overlays.get(kind) || null;
  }

  function closeKind(kind) {
    const entry = overlays.get(kind);
    if (!entry) return;
    overlays.delete(kind);
    try {
      if (entry.chrome && !entry.chrome.isDestroyed() && entry.guest && isView(entry.guest)) {
        entry.chrome.contentView?.removeChildView?.(entry.guest);
      }
    } catch {}
    try { if (entry.guest && typeof entry.guest.webContents?.close === 'function') entry.guest.webContents.close(); } catch {}
    try { if (entry.guest && typeof entry.guest.destroy === 'function') entry.guest.destroy(); } catch {}
    try { entry.chrome?.destroy(); } catch {}
    try { entry.chat?.destroy(); } catch {}
  }

  function closeGuests() {
    closeKind('browse');
    closeKind('discord');
  }

  function closeAll() {
    for (const kind of [...overlays.keys()]) closeKind(kind);
  }

  function hideIfGated() {
    const plan = destroyPlan();
    if (plan.closeAll) closeAll();
    else if (plan.closeGuests) closeGuests();
    return plan;
  }

  function layoutOf(kind) {
    const all = normalizeOverlayLayout(getOverlayLayout?.() || {});
    return all[kind] || normalizeOverlayBounds(kind);
  }

  function persistLayout(kind, win) {
    if (!win || win.isDestroyed() || typeof setOverlayLayout !== 'function') return;
    clearTimeout(persistTimers.get(kind));
    persistTimers.set(kind, setTimeout(() => {
      const [x, y] = win.getPosition();
      const [width, height] = win.getSize();
      const current = normalizeOverlayLayout(getOverlayLayout?.() || {});
      current[kind] = normalizeOverlayBounds(kind, {
        x, y, width, height,
        alwaysOnTop: win.isAlwaysOnTop()
      }, current[kind]);
      setOverlayLayout(current);
    }, 280));
  }

  function layoutGuest(chrome, guest, kind) {
    if (!chrome || chrome.isDestroyed() || !guestAlive(guest) || !isView(guest)) return;
    const [w, h] = chrome.getContentSize();
    const y = chromeHeightFor(kind);
    try { guest.setBounds({ x: 0, y, width: Math.max(320, w), height: Math.max(160, h - y) }); } catch {}
  }

  function placeGuest(chrome, guest, kind) {
    if (!chrome || chrome.isDestroyed() || !guestAlive(guest) || isView(guest)) return;
    const [x, y] = chrome.getPosition();
    const [w] = chrome.getSize();
    const gh = Math.max(280, guest.getSize?.()[1] || 560);
    try { guest.setBounds({ x, y: y + chromeHeightFor(kind), width: w, height: gh }); } catch {}
  }

  function attachGuestNav(kind, guest) {
    const wc = guestContents(guest);
    wc.setWindowOpenHandler(({ url }) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (allowed.ok) {
        wc.loadURL(allowed.url).catch(() => {});
        return { action: 'deny' };
      }
      return { action: 'deny' };
    });
    wc.on('will-navigate', (e, url) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (!allowed.ok) e.preventDefault();
    });
    wc.on('will-redirect', (e, url) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (!allowed.ok) e.preventDefault();
    });
    wc.on('did-navigate', (_e, url) => {
      const chrome = entryOf(kind)?.chrome;
      chrome?.webContents.send('overlay:status', publicStatus(kind));
      if (String(url || '').startsWith('https://')) {
        try {
          const recents = rememberOverlayRecent(loadRecents?.() || [], { url, kind, title: wc.getTitle?.() || '' });
          persistRecents?.(recents);
        } catch {}
      }
    });
    wc.on('did-fail-load', (_e, code, desc, url) => {
      const chrome = entryOf(kind)?.chrome;
      chrome?.webContents.send('overlay:status', {
        ...publicStatus(kind),
        error: `${code}: ${desc}`,
        failedUrl: url,
        electronBlocked: kind === 'discord'
      });
    });
  }

  function publicStatus(kind) {
    const entry = entryOf(kind);
    const wc = guestAlive(entry?.guest) ? guestContents(entry.guest) : null;
    const url = wc && !wc.isDestroyed?.() ? wc.getURL() : (entry?.targetUrl || '');
    const win = entry?.chrome || entry?.chat;
    return {
      kind,
      url,
      alwaysOnTop: win && !win.isDestroyed() ? win.isAlwaysOnTop() : true,
      affiliated: false,
      injectsGames: false,
      localChat: kind === 'chat',
      partition: overlayWindowOptions(kind).partition || '',
      canGoBack: Boolean(wc?.canGoBack?.()),
      canGoForward: Boolean(wc?.canGoForward?.())
    };
  }

  function createChrome(kind, title) {
    const opts = overlayWindowOptions(kind);
    const layout = layoutOf(kind);
    const parent = getMainWindow?.();
    const chrome = new BrowserWindow({
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      minWidth: 360,
      minHeight: 280,
      frame: false,
      transparent: true,
      alwaysOnTop: layout.alwaysOnTop !== false,
      skipTaskbar: false,
      resizable: true,
      show: false,
      backgroundColor: opts.backgroundColor,
      icon: iconPath(),
      title,
      parent: parent && !parent.isDestroyed() ? parent : undefined,
      webPreferences: {
        preload: path.join(__dirname, 'overlay-preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: false
      }
    });
    chrome.setMenuBarVisibility(false);
    chrome.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    chrome.webContents.on('will-navigate', e => e.preventDefault());
    chrome.webContents.on('will-attach-webview', e => e.preventDefault());
    chrome.loadFile(path.join(__dirname, '../renderer/guest-chrome.html'), { query: { kind } }).catch(() => {});
    chrome.once('ready-to-show', () => chrome.show());
    chrome.on('move', () => persistLayout(kind, chrome));
    chrome.on('resize', () => persistLayout(kind, chrome));
    return chrome;
  }

  function createGuest(kind, chrome) {
    const opts = overlayWindowOptions(kind);
    if (typeof WebContentsView === 'function') {
      const guest = new WebContentsView({
        webPreferences: {
          partition: opts.partition,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          spellcheck: kind === 'discord'
        }
      });
      attachGuestNav(kind, guest);
      try { chrome.contentView.addChildView(guest); } catch {}
      layoutGuest(chrome, guest, kind);
      if (kind === 'browse') {
        try { guest.webContents.setUserAgent(chromeUserAgent(processRef?.versions?.chrome)); } catch {}
      }
      guest.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
        callback(kind === 'discord' && ['media', 'microphone', 'audioCapture', 'videoCapture', 'fullscreen'].includes(permission));
      });
      return guest;
    }
    const layout = layoutOf(kind);
    const [x, y] = chrome.getPosition();
    const [w] = chrome.getSize();
    const guest = new BrowserWindow({
      x,
      y: y + chromeHeightFor(kind),
      width: w,
      height: Math.max(240, layout.height - chromeHeightFor(kind)),
      minWidth: 320,
      minHeight: 240,
      frame: false,
      transparent: false,
      backgroundColor: '#111111',
      alwaysOnTop: opts.alwaysOnTop,
      skipTaskbar: true,
      show: false,
      icon: iconPath(),
      parent: chrome,
      webPreferences: {
        partition: opts.partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        spellcheck: true
      }
    });
    guest.setMenuBarVisibility(false);
    attachGuestNav(kind, guest);
    if (kind === 'browse') {
      try { guest.webContents.setUserAgent(chromeUserAgent(processRef?.versions?.chrome)); } catch {}
    }
    guest.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(kind === 'discord' && ['media', 'microphone', 'audioCapture', 'videoCapture', 'fullscreen'].includes(permission));
    });
    guest.once('ready-to-show', () => guest.show());
    return guest;
  }

  function wirePair(kind, chrome, guest) {
    const follow = () => {
      if (isView(guest)) layoutGuest(chrome, guest, kind);
      else placeGuest(chrome, guest, kind);
    };
    chrome.on('move', follow);
    chrome.on('resize', follow);
    chrome.once('ready-to-show', follow);
    chrome.on('closed', () => closeKind(kind));
    chrome.on('always-on-top-changed', (_e, on) => {
      try { if (guestAlive(guest) && typeof guest.setAlwaysOnTop === 'function') guest.setAlwaysOnTop(on); } catch {}
    });
  }

  async function open(kind, requestedUrl) {
    if (ageBlocked()) throw new Error('Confirm age 18+ before opening overlays.');
    const target = resolveOverlayTarget(kind, requestedUrl);
    if (!target.ok) {
      const why = {
        http: 'Overlays only load HTTPS.',
        'private-host': 'Private, loopback, and link-local hosts are blocked.',
        'not-discord': 'The Discord overlay only opens discord.com or discord.gg.',
        file: 'file: URLs are blocked.',
        credentials: 'URLs with credentials are blocked.',
        empty: 'Need an HTTPS address.',
        invalid: 'That is not a usable URL.',
        kind: 'Unknown overlay.'
      }[target.reason] || 'That overlay target is not allowed.';
      throw new Error(why);
    }
    if (adultLocked() && target.kind !== 'chat') {
      throw new Error('Adult Mode is on, so guest overlays stay closed.');
    }
    closeKind(target.kind);
    if (target.mode === 'local') {
      const opts = overlayWindowOptions('chat');
      const layout = layoutOf('chat');
      const parent = getMainWindow?.();
      const chat = new BrowserWindow({
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        minWidth: 300,
        minHeight: 360,
        frame: false,
        transparent: true,
        alwaysOnTop: layout.alwaysOnTop !== false,
        skipTaskbar: opts.skipTaskbar,
        backgroundColor: opts.backgroundColor,
        show: false,
        icon: iconPath(),
        title: 'Eidovara chat overlay',
        parent: parent && !parent.isDestroyed() ? parent : undefined,
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          spellcheck: false
        }
      });
      chat.setMenuBarVisibility(false);
      chat.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      chat.webContents.on('will-navigate', e => e.preventDefault());
      chat.webContents.on('will-attach-webview', e => e.preventDefault());
      chat.loadFile(path.join(__dirname, '../renderer/chat-overlay.html')).catch(() => {});
      chat.once('ready-to-show', () => chat.show());
      chat.on('closed', () => overlays.delete('chat'));
      chat.on('move', () => persistLayout('chat', chat));
      chat.on('resize', () => persistLayout('chat', chat));
      overlays.set('chat', { kind: 'chat', chat, targetUrl: '' });
      return publicStatus('chat');
    }
    const chrome = createChrome(target.kind, target.kind === 'discord' ? 'Eidovara · Discord guest' : 'Eidovara · Browse overlay');
    const guest = createGuest(target.kind, chrome);
    overlays.set(target.kind, { kind: target.kind, chrome, guest, targetUrl: target.url || '' });
    wirePair(target.kind, chrome, guest);
    const wc = guestContents(guest);
    if (target.blank) wc.loadURL('about:blank').catch(() => {});
    else wc.loadURL(target.url).catch(() => {});
    return publicStatus(target.kind);
  }

  function navigate(event, raw) {
    if (ageBlocked()) throw new Error('Confirm age 18+ before opening overlays.');
    if (adultLocked()) throw new Error('Adult Mode is on, so guest overlays stay closed.');
    const kind = senderKind(event);
    const entry = entryOf(kind);
    if (!guestAlive(entry?.guest)) throw new Error('That overlay is not open.');
    const allowed = guestNavigateAllowed(kind, raw);
    if (!allowed.ok) throw new Error('That address is not allowed in this overlay.');
    return guestContents(entry.guest).loadURL(allowed.url).then(() => publicStatus(kind));
  }

  function history(event, dir) {
    const kind = senderKind(event);
    const wc = guestAlive(entryOf(kind)?.guest) ? guestContents(entryOf(kind).guest) : null;
    if (!wc) return publicStatus(kind);
    if (dir === 'back' && wc.canGoBack?.()) wc.goBack();
    if (dir === 'forward' && wc.canGoForward?.()) wc.goForward();
    if (dir === 'reload') wc.reload();
    return publicStatus(kind);
  }

  function toggleTop(event, kindHint) {
    const kind = kindHint || senderKind(event) || [...overlays.keys()][0];
    const entry = entryOf(kind);
    const win = entry?.chrome || entry?.chat;
    if (!win || win.isDestroyed()) return { alwaysOnTop: false };
    const next = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(next);
    try { if (guestAlive(entry.guest) && typeof entry.guest.setAlwaysOnTop === 'function') entry.guest.setAlwaysOnTop(next); } catch {}
    persistLayout(kind, win);
    return { ...publicStatus(kind), alwaysOnTop: next };
  }

  function closeFrom(event) {
    const kind = senderKind(event);
    if (kind) closeKind(kind);
    return { closed: true, kind };
  }

  function status(event) {
    const kind = senderKind(event);
    if (kind) return publicStatus(kind);
    return { kinds: [...overlays.keys()], recents: loadRecents?.() || [] };
  }

  async function openExternal(event, raw) {
    if (ageBlocked()) throw new Error('Confirm age 18+ before opening overlays.');
    const allowed = guestNavigateAllowed(senderKind(event) || 'browse', raw);
    const href = allowed.ok ? allowed.url : '';
    if (!href || !href.startsWith('https://')) throw new Error('Only HTTPS links can open in the system browser.');
    const parent = BrowserWindow.fromWebContents?.(event.sender) || getMainWindow?.();
    if (dialog?.showMessageBox) {
      const answer = await dialog.showMessageBox(parent && !parent.isDestroyed() ? parent : undefined, {
        type: 'question',
        buttons: ['Open in browser', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        title: 'Open outside Eidovara',
        message: 'Open this HTTPS page in your system browser?',
        detail: 'Eidovara is not affiliated with that site. This is not an official overlay and does not inject into other apps. No tokens are copied.'
      });
      if (answer.response !== 0) return { cancelled: true };
    }
    if (shell?.openExternal) await shell.openExternal(href);
    return { opened: true, url: href };
  }

  return {
    open,
    navigate,
    history,
    toggleTop,
    closeFrom,
    closeAll,
    closeKind,
    closeGuests,
    hideIfGated,
    status,
    publicStatus,
    openExternal,
    processMetrics: () => formatEidovaraProcessMetrics(processRef),
    overlayState: () => ({ kinds: [...overlays.keys()], recents: loadRecents?.() || [] }),
    list: () => [...overlays.keys()]
  };
}

