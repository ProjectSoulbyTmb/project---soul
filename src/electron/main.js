import { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SoulEngine } from '../core/engine.js';
import { JsonStore } from '../core/store.js';
import { OfflineProvider } from '../providers/offline.js';
import { callCompatibleProvider, callLocalProvider } from '../providers/http.js';
import { checkForUpdate, downloadUpdate } from '../core/updater.js';
import { RELEASE_MANIFEST_URL } from '../config/release-channel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow, engine, logPath, configPath;
let config = { provider: 'offline', endpoint: '', model: '', encryptedApiKey: '', encryptedSearchApiKey: '' };
let pendingUpdate = null;

function log(message, error) { try { if (!logPath) logPath = path.join(app.getPath('userData'), 'project-soul.log'); fs.mkdirSync(path.dirname(logPath), { recursive: true }); fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}${error ? `\n${error?.stack || error}` : ''}\n`); } catch {} }
function fatal(title, error) { log(title, error); try { dialog.showErrorBox(title, `${error?.stack || error}\n\nLog: ${logPath}`); } catch {} }
function loadConfig() {
  configPath = path.join(app.getPath('userData'), 'settings.json');
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }; } catch {}
}
function saveConfig() { fs.mkdirSync(path.dirname(configPath), { recursive: true }); const tmp = `${configPath}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(config, null, 2), { mode: 0o600 }); fs.renameSync(tmp, configPath); }
function getApiKey() { if (!config.encryptedApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedApiKey, 'base64')) : ''; } catch { return ''; } }
function getSearchApiKey() { if (!config.encryptedSearchApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedSearchApiKey, 'base64')) : ''; } catch { return ''; } }
function publicConfig() { return { provider: config.provider, endpoint: config.endpoint || '', model: config.model || '', updateChannelConfigured: Boolean(RELEASE_MANIFEST_URL), hasApiKey: Boolean(config.encryptedApiKey), hasSearchApiKey: Boolean(config.encryptedSearchApiKey), encryptionAvailable: safeStorage.isEncryptionAvailable() }; }
function makeProvider() {
  if (config.provider === 'local') return { reply: ({ messages }) => callLocalProvider({ endpoint: config.endpoint || 'http://127.0.0.1:11434', model: config.model, messages }) };
  if (config.provider === 'compatible') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };
  return new OfflineProvider();
}
function createWindow() {
  try {
    loadConfig();
    const dataDir = path.join(app.getPath('userData'), 'profiles');
    engine = new SoulEngine({ store: new JsonStore({ dataDir, profileId: 'default' }), provider: makeProvider(), internetOptions: { searchApiKey: getSearchApiKey() } });
    mainWindow = new BrowserWindow({ width: 1280, height: 840, minWidth: 780, minHeight: 600, title: 'Project Soul Alpha v.0.15', backgroundColor: '#0b1020', show: false,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.webContents.on('will-navigate', e => e.preventDefault());
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => fatal('Project Soul failed to load', new Error(`${code}: ${desc} (${url})`)));
    mainWindow.webContents.on('render-process-gone', (_e, details) => fatal('Project Soul renderer stopped', new Error(JSON.stringify(details))));
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch(err => fatal('Project Soul interface error', err));
  } catch (err) { fatal('Project Soul startup error', err); }
}

process.on('uncaughtException', err => fatal('Project Soul startup error', err));
process.on('unhandledRejection', err => fatal('Project Soul promise error', err));
app.whenReady().then(createWindow).catch(err => fatal('Project Soul initialization error', err));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('soul:send', (_e, m) => engine.respond(m));
ipcMain.handle('soul:snapshot', () => engine.snapshot());
ipcMain.handle('soul:reset', () => engine.reset());
ipcMain.handle('soul:remember', (_e, c) => engine.remember(String(c || '').slice(0, 1000)));
ipcMain.handle('soul:forget', (_e, x) => engine.forget(String(x || '').slice(0, 1000)));
ipcMain.handle('soul:newConversation', () => engine.newConversation());
ipcMain.handle('soul:selectConversation', (_e, id) => engine.selectConversation(String(id)));
ipcMain.handle('soul:deleteConversation', (_e, id) => engine.deleteConversation(String(id)));
ipcMain.handle('soul:getSettings', () => publicConfig());
ipcMain.handle('soul:saveSettings', (_e, incoming) => {
  const provider = ['offline','local','compatible'].includes(incoming?.provider) ? incoming.provider : 'offline';
  config.provider = provider;
  config.endpoint = String(incoming?.endpoint || '').slice(0, 500);
  config.model = String(incoming?.model || '').slice(0, 200);
  if (typeof incoming?.apiKey === 'string' && incoming.apiKey) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable on this system.');
    config.encryptedApiKey = safeStorage.encryptString(incoming.apiKey).toString('base64');
  }
  if (incoming?.clearApiKey) config.encryptedApiKey = '';
  if (typeof incoming?.searchApiKey === 'string' && incoming.searchApiKey) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable on this system.');
    config.encryptedSearchApiKey = safeStorage.encryptString(incoming.searchApiKey).toString('base64');
  }
  if (incoming?.clearSearchApiKey) config.encryptedSearchApiKey = '';
  saveConfig(); engine.setProvider(makeProvider()); engine.setInternetOptions({ searchApiKey: getSearchApiKey() }); return publicConfig();
});
ipcMain.handle('soul:diagnostics', () => ({ version: app.getVersion(), electron: process.versions.electron, node: process.versions.node, platform: process.platform, arch: process.arch, userData: app.getPath('userData'), logPath, settings: publicConfig(), localSafetyReportCount: engine.snapshot().policy.localSafetyReports?.length || 0 }));
ipcMain.handle('soul:openDataFolder', () => shell.openPath(app.getPath('userData')));
ipcMain.handle('soul:createBackup', () => engine.createBackup());
ipcMain.handle('soul:listBackups', () => engine.listBackups());
ipcMain.handle('soul:restoreBackup', (_e, name) => engine.restoreBackup(String(name || '')));
ipcMain.handle('soul:openExternal', (_e, value) => { const url = new URL(String(value || '')); if (url.protocol !== 'https:') throw new Error('Only secure web links can be opened.'); return shell.openExternal(url.toString()); });
ipcMain.handle('soul:checkForUpdates', async () => { pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() }); return pendingUpdate; });
ipcMain.handle('soul:installUpdate', async () => {
  if (!pendingUpdate?.available) pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() });
  if (!pendingUpdate.available) throw new Error('No update is available.');
  const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['Download and launch', 'Cancel'], defaultId: 0, cancelId: 1, title: 'Install Project Soul update', message: `Install Project Soul ${pendingUpdate.version}?`, detail: 'The installer will be downloaded over HTTPS and verified with the release SHA-256 hash before it is opened.' });
  if (answer.response !== 0) return { cancelled: true };
  const downloaded = await downloadUpdate(pendingUpdate, path.join(app.getPath('userData'), 'updates'));
  const error = await shell.openPath(downloaded.path); if (error) throw new Error(error); return { ...downloaded, launched: true };
});
