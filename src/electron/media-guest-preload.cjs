// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eidovaraGuest', {
  dock: () => ipcRenderer.invoke('guest:dock'),
  close: () => ipcRenderer.invoke('guest:close'),
  openUrl: url => ipcRenderer.invoke('guest:openUrl', url),
  playLocal: () => ipcRenderer.invoke('guest:playLocal'),
  back: () => ipcRenderer.invoke('guest:back'),
  home: () => ipcRenderer.invoke('guest:home'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('guest:toggleAlwaysOnTop'),
  recents: () => ipcRenderer.invoke('guest:recents'),
  onNavigated: cb => ipcRenderer.on('guest:navigated', (_e, payload) => cb(payload)),
  onCaption: cb => ipcRenderer.on('guest:caption', (_e, payload) => cb(payload)),
  onBlocked: cb => ipcRenderer.on('guest:blocked', (_e, payload) => cb(payload))
});
