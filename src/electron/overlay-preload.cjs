// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('overlay', {
  close: () => ipcRenderer.invoke('overlay:close'),
  toggleTop: () => ipcRenderer.invoke('overlay:toggleTop'),
  navigate: url => ipcRenderer.invoke('overlay:navigate', url),
  openExternal: url => ipcRenderer.invoke('soul:openExternal', url),
  status: () => ipcRenderer.invoke('overlay:status'),
  onStatus: handler => {
    const listen = (_e, payload) => handler(payload);
    ipcRenderer.on('overlay:status', listen);
    return () => ipcRenderer.removeListener('overlay:status', listen);
  }
});
