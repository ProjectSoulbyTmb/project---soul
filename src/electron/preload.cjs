const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('soul', {
  send: m => ipcRenderer.invoke('soul:send', m), snapshot: () => ipcRenderer.invoke('soul:snapshot'), reset: () => ipcRenderer.invoke('soul:reset'),
  remember: c => ipcRenderer.invoke('soul:remember', c), forget: x => ipcRenderer.invoke('soul:forget', x),
  newConversation: () => ipcRenderer.invoke('soul:newConversation'), selectConversation: id => ipcRenderer.invoke('soul:selectConversation', id), deleteConversation: id => ipcRenderer.invoke('soul:deleteConversation', id),
  getSettings: () => ipcRenderer.invoke('soul:getSettings'), saveSettings: s => ipcRenderer.invoke('soul:saveSettings', s), diagnostics: () => ipcRenderer.invoke('soul:diagnostics'), openDataFolder: () => ipcRenderer.invoke('soul:openDataFolder'),
  createBackup: () => ipcRenderer.invoke('soul:createBackup'), listBackups: () => ipcRenderer.invoke('soul:listBackups'), restoreBackup: name => ipcRenderer.invoke('soul:restoreBackup', name), configureSetup: input => ipcRenderer.invoke('soul:configureSetup', input), openExternal: url => ipcRenderer.invoke('soul:openExternal', url), checkForUpdates: () => ipcRenderer.invoke('soul:checkForUpdates'), installUpdate: () => ipcRenderer.invoke('soul:installUpdate')
});
