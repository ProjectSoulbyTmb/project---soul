// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  guestNavigateAllowed,
  overlayWindowOptions,
  rememberOverlayRecent,
  resolveOverlayTarget
} from '../core/guest-overlay.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_H = 88;

function iconPath() {
  return path.join(__dirname, '../../assets/branding/eidovara-512.png');
}

export function createGuestOverlayManager({ BrowserWindow, requireAgeGate, getMainWindow, persistRecents, loadRecents }) {
  const overlays = new Map();

  function adultLocked() {
    try { requireAgeGate(); return false; } catch { return true; }
  }

  function senderKind(event) {
    const wc = event?.sender;
    for (const [kind, entry] of overlays) {
      if (entry.chrome?.webContents === wc || entry.guest?.webContents === wc || entry.chat?.webContents === wc) return kind;
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
    try { entry.guest?.destroy(); } catch {}
    try { entry.chrome?.destroy(); } catch {}
    try { entry.chat?.destroy(); } catch {}
  }

  function closeAll() {
    for (const kind of [...overlays.keys()]) closeKind(kind);
  }

  function closeGuests() {
    closeKind('browse');
    closeKind('discord');
  }

  function placeGuest(chrome, guest) {
    if (!chrome || chrome.isDestroyed() || !guest || guest.isDestroyed()) return;
    const [x, y] = chrome.getPosition();
    const [w] = chrome.getSize();
    const gh = Math.max(280, guest.getSize()[1] || 560);
    guest.setBounds({ x, y: y + CHROME_H, width: w, height: gh });
  }

  function attachGuestNav(kind, guest) {
    guest.webContents.setWindowOpenHandler(({ url }) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (allowed.ok) {
        guest.loadURL(allowed.url).catch(() => {});
        return { action: 'deny' };
      }
      return { action: 'deny' };
    });
    guest.webContents.on('will-navigate', (e, url) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (!allowed.ok) e.preventDefault();
    });
    guest.webContents.on('will-redirect', (e, url) => {
      const allowed = guestNavigateAllowed(kind, url);
      if (!allowed.ok) e.preventDefault();
    });
    guest.webContents.on('did-navigate', (_e, url) => {
      const chrome = entryOf(kind)?.chrome;
      chrome?.webContents.send('overlay:status', publicStatus(kind));
      try {
        const recents = rememberOverlayRecent(loadRecents?.() || [], { url, kind, title: guest.getTitle() });
        persistRecents?.(recents);
      } catch {}
    });
    guest.webContents.on('did-fail-load', (_e, code, desc, url) => {
      const chrome = entryOf(kind)?.chrome;
      chrome?.webContents.send('overlay:status', { ...publicStatus(kind), error: `${code}: ${desc}`, failedUrl: url });
    });
  }

  function publicStatus(kind) {
    const entry = entryOf(kind);
    const url = entry?.guest && !entry.guest.isDestroyed() ? entry.guest.webContents.getURL() : (entry?.targetUrl || '');
    return {
      kind,
      url,
      alwaysOnTop: entry?.chrome && !entry.chrome.isDestroyed() ? entry.chrome.isAlwaysOnTop() : true,
      affiliated: false,
      injectsGames: false,
      localChat: kind === 'chat'
    };
  }

  function createChrome(kind, title) {
    const opts = overlayWindowOptions(kind);
    const parent = getMainWindow?.();
    const chrome = new BrowserWindow({
      width: 440,
      height: CHROME_H,
      minWidth: 320,
      minHeight: CHROME_H,
      maxHeight: CHROME_H,
      frame: false,
      transparent: true,
      alwaysOnTop: opts.alwaysOnTop,
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
        spellcheck: false
      }
    });
    chrome.setMenuBarVisibility(false);
    chrome.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    chrome.webContents.on('will-navigate', e => e.preventDefault());
    chrome.webContents.on('will-attach-webview', e => e.preventDefault());
    chrome.loadFile(path.join(__dirname, '../renderer/guest-chrome.html'), { query: { kind } }).catch(() => {});
    chrome.once('ready-to-show', () => chrome.show());
    return chrome;
  }

  function createGuest(kind, chrome) {
    const opts = overlayWindowOptions(kind);
    const [x, y] = chrome.getPosition();
    const [w] = chrome.getSize();
    const guest = new BrowserWindow({
      x,
      y: y + CHROME_H,
      width: w,
      height: 560,
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
    guest.webContents.on('will-attach-webview', e => e.preventDefault());
    if (kind === 'browse') {
      try {
        const chromeVer = String(process.versions.chrome || '120.0.0.0').replace(/[^\d.]/g, '') || '120.0.0.0';
        guest.webContents.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`);
      } catch {}
    }
    attachGuestNav(kind, guest);
    const session = guest.webContents.session;
    session.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(kind === 'discord' && (permission === 'media' || permission === 'microphone' || permission === 'audioCapture' || permission === 'videoCapture'));
    });
    guest.once('ready-to-show', () => guest.show());
    return guest;
  }

  function wirePair(kind, chrome, guest) {
    const follow = () => placeGuest(chrome, guest);
    chrome.on('move', follow);
    chrome.on('resize', follow);
    chrome.on('closed', () => closeKind(kind));
    guest.on('closed', () => {
      const entry = entryOf(kind);
      if (entry) entry.guest = null;
    });
    chrome.on('always-on-top-changed', (_e, on) => {
      try { if (guest && !guest.isDestroyed()) guest.setAlwaysOnTop(on); } catch {}
    });
  }

  async function open(kind, requestedUrl) {
    if (adultLocked()) throw new Error('Confirm age 18+ before opening overlays.');
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
    closeKind(target.kind);
    if (target.mode === 'local') {
      const opts = overlayWindowOptions('chat');
      const parent = getMainWindow?.();
      const chat = new BrowserWindow({
        width: 380,
        height: 520,
        minWidth: 300,
        minHeight: 360,
        frame: false,
        transparent: true,
        alwaysOnTop: opts.alwaysOnTop,
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
      overlays.set('chat', { kind: 'chat', chat, targetUrl: '' });
      return publicStatus('chat');
    }
    const chrome = createChrome(target.kind, target.kind === 'discord' ? 'Eidovara · Discord guest' : 'Eidovara · Browse overlay');
    const guest = createGuest(target.kind, chrome);
    overlays.set(target.kind, { kind: target.kind, chrome, guest, targetUrl: target.url || '' });
    wirePair(target.kind, chrome, guest);
    if (target.blank) {
      guest.loadURL('about:blank').catch(() => {});
    } else {
      guest.loadURL(target.url).catch(() => {});
    }
    return publicStatus(target.kind);
  }

  function navigate(event, raw) {
    if (adultLocked()) throw new Error('Confirm age 18+ before opening overlays.');
    const kind = senderKind(event);
    const entry = entryOf(kind);
    if (!entry?.guest || entry.guest.isDestroyed()) throw new Error('That overlay is not open.');
    const allowed = guestNavigateAllowed(kind, raw);
    if (!allowed.ok) throw new Error('That address is not allowed in this overlay.');
    return entry.guest.loadURL(allowed.url).then(() => publicStatus(kind));
  }

  function toggleTop(event) {
    const kind = senderKind(event) || [...overlays.keys()][0];
    const entry = entryOf(kind);
    const win = entry?.chrome || entry?.chat;
    if (!win || win.isDestroyed()) return { alwaysOnTop: false };
    const next = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(next);
    try { entry.guest && !entry.guest.isDestroyed() && entry.guest.setAlwaysOnTop(next); } catch {}
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

  return { open, navigate, toggleTop, closeFrom, closeAll, closeGuests, closeKind, status, publicStatus, list: () => [...overlays.keys()] };
}
