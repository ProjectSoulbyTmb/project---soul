// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { createGuestOverlayManager } from './guest-overlays.js';

let ipcBound = false;

export function attachOverlayWindows(opts = {}) {
  const {
    ipcMain,
    registerIpc = true,
    requireAgeGate
  } = opts;
  const manager = (opts.createGuestOverlayManager || createGuestOverlayManager)(opts);

  if (registerIpc && ipcMain && !ipcBound) {
    ipcBound = true;
    ipcMain.handle('soul:openOverlay', (_e, input) => {
      requireAgeGate?.();
      const payload = input && typeof input === 'object' ? input : { kind: input };
      return manager.open(payload.kind, payload.url);
    });
    ipcMain.handle('soul:closeOverlay', (e, input) => {
      const kind = input?.kind || '';
      if (kind) manager.closeKind(kind);
      else manager.closeFrom(e);
      return { closed: true, kind };
    });
    ipcMain.handle('soul:overlayNavigate', (e, url) => manager.navigate(e, url));
    ipcMain.handle('soul:overlayChrome', (e, input) => {
      const op = String(input?.op || '').toLowerCase();
      if (op === 'toggle-top') return manager.toggleTop(e, input?.kind);
      if (op === 'back' || op === 'forward' || op === 'reload') return manager.history(e, op);
      return manager.status(e);
    });
    ipcMain.handle('soul:overlayState', () => {
      requireAgeGate?.();
      return manager.overlayState();
    });
    ipcMain.handle('soul:overlayOpenExternal', (e, url) => manager.openExternal(e, url));
    ipcMain.handle('soul:processMetrics', () => {
      requireAgeGate?.();
      return manager.processMetrics();
    });
    ipcMain.handle('overlay:navigate', (e, url) => manager.navigate(e, url));
    ipcMain.handle('overlay:toggleTop', e => manager.toggleTop(e));
    ipcMain.handle('overlay:close', e => manager.closeFrom(e));
    ipcMain.handle('overlay:status', e => manager.status(e));
    ipcMain.handle('overlay:history', (e, dir) => manager.history(e, dir));
  }

  return manager;
}

