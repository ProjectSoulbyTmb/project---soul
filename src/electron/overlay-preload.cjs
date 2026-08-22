// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('overlay', {
  close: () => ipcRenderer.invoke('overlay:close'),
  toggleTop: () => ipcRenderer.invoke('overlay:toggleTop'),
  navigate: url => ipcRenderer.invoke('overlay:navigate', url),
  history: dir => ipcRenderer.invoke('overlay:history', dir),
  openExternal: url => ipcRenderer.invoke('soul:overlayOpenExternal', url),
  status: () => ipcRenderer.invoke('overlay:status'),
  onStatus: handler => {
    const listen = (_e, payload) => handler(payload);
    ipcRenderer.on('overlay:status', listen);
    return () => ipcRenderer.removeListener('overlay:status', listen);
  },
});
