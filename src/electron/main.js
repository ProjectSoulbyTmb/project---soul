import { app, BrowserWindow, ipcMain, dialog, safeStorage, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SoulEngine } from '../core/engine.js';
import { JsonStore } from '../core/store.js';
import { OfflineProvider } from '../providers/offline.js';
import { callCompatibleProvider, callLocalProvider } from '../providers/http.js';
import { checkForUpdate, downloadUpdate } from '../core/updater.js';
import { RELEASE_MANIFEST_URL } from '../config/release-channel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow, engine, logPath, configPath;
let config = { provider: 'offline', endpoint: '', model: '', encryptedApiKey: '', encryptedSearchApiKey: '', apps: [], theme: { background: '#080c16', panel: '#101828', accent: '#8f7cff', transparency: 96, rgbEffects: false, gamingMode: false }, companion: { avatarMode: '3d', motion: 'gentle', voiceEnabled: false, voiceName: '', rate: 1, pitch: 1 } };
let pendingUpdate = null;
const ADMIN_SESSION_MS = 15 * 60 * 1000;
let adminSessionUntil = 0, failedAdminAttempts = 0, adminLockedUntil = 0;

function log(message, error) { try { if (!logPath) logPath = path.join(app.getPath('userData'), 'project-soul.log'); fs.mkdirSync(path.dirname(logPath), { recursive: true }); fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}${error ? `\n${error?.stack || error}` : ''}\n`); } catch {} }
function fatal(title, error) { log(title, error); try { dialog.showErrorBox(title, `${error?.stack || error}\n\nLog: ${logPath}`); } catch {} }
function loadConfig() {
  configPath = path.join(app.getPath('userData'), 'settings.json');
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) }; } catch {}
}
function atomicReplace(target, content) { fs.mkdirSync(path.dirname(target), { recursive: true }); const tmp = `${target}.${process.pid}.tmp`; const previous = `${target}.previous`; fs.writeFileSync(tmp, content, { mode: 0o600 }); try { if (fs.existsSync(target)) fs.copyFileSync(target, previous); fs.renameSync(tmp, target); } catch (err) { try { fs.rmSync(target, { force: true }); fs.renameSync(tmp, target); } catch (inner) { if (fs.existsSync(previous)) fs.copyFileSync(previous, target); throw inner; } } }
function saveConfig() { atomicReplace(configPath, JSON.stringify(config, null, 2)); }
function getApiKey() { if (!config.encryptedApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedApiKey, 'base64')) : ''; } catch { return ''; } }
function getSearchApiKey() { if (!config.encryptedSearchApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedSearchApiKey, 'base64')) : ''; } catch { return ''; } }
function entitlement() { return config.edition === 'premium' ? 'premium' : 'free'; }
function adminConfigured() { return Boolean(config.admin?.salt && config.admin?.hash); }
function deriveAdminHash(password, salt) { return crypto.scryptSync(String(password), Buffer.from(salt, 'base64'), 32).toString('hex'); }
function validateNewAdminPassword(password) {
  const value = String(password || '');
  if (value.length < 12 || value.length > 200) throw new Error('Use an administrator password between 12 and 200 characters.');
  return value;
}
function publicConfig() { return { provider: config.provider, endpoint: config.endpoint || '', model: config.model || '', apps: Array.isArray(config.apps) ? config.apps : [], theme: config.theme || {}, companion: config.companion || {}, edition: entitlement(), storeUrl: /^https:\/\//i.test(String(config.storeUrl || '')) ? config.storeUrl : '', serviceUrl: /^https:\/\//i.test(String(config.serviceUrl || '')) ? config.serviceUrl : '', updateChannelConfigured: Boolean(RELEASE_MANIFEST_URL), hasApiKey: Boolean(config.encryptedApiKey), hasSearchApiKey: Boolean(config.encryptedSearchApiKey), encryptionAvailable: safeStorage.isEncryptionAvailable() }; }
function adminAuthorized() { return Date.now() < adminSessionUntil; }
function requireAdmin() { if (!adminAuthorized()) throw new Error('Administrator authentication is required.'); }
function makeProvider() {
  if (config.provider === 'local') return { reply: ({ messages }) => callLocalProvider({ endpoint: config.endpoint || 'http://127.0.0.1:11434', model: config.model, messages }) };
  if (config.provider === 'compatible' && entitlement() === 'premium') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };
  return new OfflineProvider();
}
function createWindow() {
  try {
    loadConfig();
    const dataDir = path.join(app.getPath('userData'), 'profiles');
    engine = new SoulEngine({ store: new JsonStore({ dataDir, profileId: 'default' }), provider: makeProvider(), internetOptions: { searchApiKey: getSearchApiKey() } });
    mainWindow = new BrowserWindow({ width: 1280, height: 840, minWidth: 780, minHeight: 600, title: 'Eidovara v0.17.9', backgroundColor: '#0b1020', show: false,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, spellcheck: false } });
    mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback, details) => callback(permission === 'media' && Array.isArray(details?.mediaTypes) && details.mediaTypes.length === 1 && details.mediaTypes[0] === 'audio'));
    mainWindow.webContents.session.setPermissionCheckHandler((_wc, permission, _origin, details) => permission === 'media' && Array.isArray(details?.mediaTypes) && details.mediaTypes.length === 1 && details.mediaTypes[0] === 'audio');
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.webContents.on('will-navigate', e => e.preventDefault());
    mainWindow.webContents.on('will-attach-webview', e => e.preventDefault());
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => fatal('Eidovara failed to load', new Error(`${code}: ${desc} (${url})`)));
    mainWindow.webContents.on('render-process-gone', (_e, details) => fatal('Eidovara renderer stopped', new Error(JSON.stringify(details))));
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch(err => fatal('Eidovara interface error', err));
  } catch (err) { fatal('Eidovara startup error', err); }
}

process.on('uncaughtException', err => fatal('Eidovara startup error', err));
process.on('unhandledRejection', err => fatal('Eidovara promise error', err));
app.whenReady().then(createWindow).catch(err => fatal('Eidovara initialization error', err));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('soul:send', (_e, m) => engine.respond(m));
ipcMain.handle('soul:snapshot', () => engine.snapshot());
ipcMain.handle('soul:recordMedia', (_e, input) => engine.recordMedia(input));
ipcMain.handle('soul:entertainment', () => engine.entertainment());
ipcMain.handle('soul:reset', () => engine.reset());
ipcMain.handle('soul:remember', (_e, c) => engine.remember(String(c || '').slice(0, 1000)));
ipcMain.handle('soul:forget', (_e, x) => engine.forget(String(x || '').slice(0, 1000)));
ipcMain.handle('soul:newConversation', () => engine.newConversation());
ipcMain.handle('soul:selectConversation', (_e, id) => engine.selectConversation(String(id)));
ipcMain.handle('soul:deleteConversation', (_e, id) => engine.deleteConversation(String(id)));
ipcMain.handle('soul:getSettings', () => publicConfig());
ipcMain.handle('soul:adminLogin', (_e, password) => {
  if (!adminConfigured()) throw new Error('Create an administrator password for this installation first.');
  const now = Date.now();
  if (now < adminLockedUntil) throw new Error(`Too many attempts. Try again in ${Math.ceil((adminLockedUntil - now) / 1000)} seconds.`);
  const actual = Buffer.from(deriveAdminHash(password, config.admin.salt), 'hex');
  const expected = Buffer.from(config.admin.hash, 'hex');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    failedAdminAttempts += 1;
    if (failedAdminAttempts >= 5) { adminLockedUntil = now + 60_000; failedAdminAttempts = 0; }
    log('Rejected local administrator authentication attempt.');
    throw new Error('Incorrect administrator password.');
  }
  failedAdminAttempts = 0; adminLockedUntil = 0; adminSessionUntil = now + ADMIN_SESSION_MS;
  log('Local administrator session opened.');
  return { authorized: true, expiresAt: new Date(adminSessionUntil).toISOString(), edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl };
});
ipcMain.handle('soul:adminConfigure', (_e, password) => {
  if (adminConfigured()) throw new Error('The administrator password is already configured. Sign in to administer this installation.');
  const value = validateNewAdminPassword(password);
  const salt = crypto.randomBytes(16).toString('base64');
  config.admin = { salt, hash: deriveAdminHash(value, salt), algorithm: 'scrypt-v1' };
  saveConfig(); adminSessionUntil = Date.now() + ADMIN_SESSION_MS;
  log('Local administrator password configured.');
  return { configured: true, authorized: true, expiresAt: new Date(adminSessionUntil).toISOString(), edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl };
});
ipcMain.handle('soul:adminStatus', () => ({ configured: adminConfigured(), authorized: adminAuthorized(), expiresAt: adminAuthorized() ? new Date(adminSessionUntil).toISOString() : null, edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl }));
ipcMain.handle('soul:adminSave', (_e, incoming) => {
  requireAdmin(); config.edition = incoming?.edition === 'premium' ? 'premium' : 'free';
  if (config.edition === 'free') { if (config.provider === 'compatible') config.provider = 'offline'; config.theme = { ...(config.theme || {}), rgbEffects: false }; }
  const storeUrl = String(incoming?.storeUrl || '').trim().slice(0, 1000);
  if (storeUrl && new URL(storeUrl).protocol !== 'https:') throw new Error('The store link must use HTTPS.');
  const serviceUrl = String(incoming?.serviceUrl || '').trim().replace(/\/+$/, '').slice(0, 1000);
  if (serviceUrl && new URL(serviceUrl).protocol !== 'https:') throw new Error('The service URL must use HTTPS.');
  config.storeUrl = storeUrl; config.serviceUrl = serviceUrl; saveConfig(); engine.setProvider(makeProvider()); engine.setInternetOptions({ searchApiKey: config.edition === 'premium' ? getSearchApiKey() : '' }); log(`Administrator changed local edition to ${config.edition}.`);
  return { authorized: true, expiresAt: new Date(adminSessionUntil).toISOString(), edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl };
});
ipcMain.handle('soul:adminLogout', () => { adminSessionUntil = 0; return true; });
ipcMain.handle('soul:checkService', async () => { const base = publicConfig().serviceUrl; if (!base) return { configured: false }; const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5000); try { const res = await fetch(`${base}/health`, { signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } }); if (!res.ok) throw new Error(`Service returned HTTP ${res.status}.`); const raw = await res.text(); if (Buffer.byteLength(raw) > 32_768) throw new Error('Service response is too large.'); const body = JSON.parse(raw); return { configured: true, online: body?.status === 'ok', service: String(body?.service || '').slice(0, 100), version: String(body?.version || '').slice(0, 40) }; } finally { clearTimeout(timer); } });
ipcMain.handle('soul:saveSettings', (_e, incoming) => {
  const provider = ['offline','local','compatible'].includes(incoming?.provider) ? incoming.provider : 'offline';
  if (entitlement() === 'free' && provider === 'compatible') throw new Error('Remote model endpoints are a Premium feature. Eidovara Free supports offline and local models.');
  config.provider = provider;
  config.endpoint = String(incoming?.endpoint || '').slice(0, 500);
  config.model = String(incoming?.model || '').slice(0, 200);
  if (incoming?.theme && typeof incoming.theme === 'object') { const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback; config.theme = { background: color(incoming.theme.background, '#080c16'), panel: color(incoming.theme.panel, '#101828'), accent: color(incoming.theme.accent, '#8f7cff'), transparency: Math.max(65, Math.min(100, Number(incoming.theme.transparency) || 96)), rgbEffects: entitlement() === 'premium' && Boolean(incoming.theme.rgbEffects), gamingMode: Boolean(incoming.theme.gamingMode) }; }
  if (incoming?.companion && typeof incoming.companion === 'object') config.companion = { avatarMode: ['hidden','2d','3d'].includes(incoming.companion.avatarMode) ? incoming.companion.avatarMode : '3d', motion: ['full','gentle','reduced'].includes(incoming.companion.motion) ? incoming.companion.motion : 'gentle', voiceEnabled: Boolean(incoming.companion.voiceEnabled), voiceName: String(incoming.companion.voiceName || '').slice(0, 200), rate: Math.max(0.5, Math.min(2, Number(incoming.companion.rate) || 1)), pitch: Math.max(0.5, Math.min(2, Number(incoming.companion.pitch) || 1)) };
  if (typeof incoming?.apiKey === 'string' && incoming.apiKey) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable on this system.');
    config.encryptedApiKey = safeStorage.encryptString(incoming.apiKey).toString('base64');
  }
  if (incoming?.clearApiKey) config.encryptedApiKey = '';
  if (typeof incoming?.searchApiKey === 'string' && incoming.searchApiKey) {
    if (entitlement() === 'free') throw new Error('Broad keyed web search is a Premium feature. Built-in public sources remain available.');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable on this system.');
    config.encryptedSearchApiKey = safeStorage.encryptString(incoming.searchApiKey).toString('base64');
  }
  if (incoming?.clearSearchApiKey) config.encryptedSearchApiKey = '';
  saveConfig(); engine.setProvider(makeProvider()); engine.setInternetOptions({ searchApiKey: getSearchApiKey() }); return publicConfig();
});
ipcMain.handle('soul:diagnostics', async () => ({ version: app.getVersion(), electron: process.versions.electron, chromium: process.versions.chrome, node: process.versions.node, platform: process.platform, arch: process.arch, hardwareAcceleration: !app.commandLine.hasSwitch('disable-gpu'), gpuFeatureStatus: app.getGPUFeatureStatus(), gpu: await app.getGPUInfo('complete').catch(() => ({ unavailable: true })), mediaFeatures: { htmlAudio: true, htmlVideo: true, webAudio: true, hardwareAcceleratedChromium: true }, userData: app.getPath('userData'), logPath, settings: publicConfig(), localSafetyReportCount: engine.snapshot().policy.localSafetyReports?.length || 0 }));
ipcMain.handle('soul:openDataFolder', () => shell.openPath(app.getPath('userData')));
ipcMain.handle('soul:selectLocalMedia', async () => {
  const chosen = await dialog.showOpenDialog(mainWindow, { title: 'Open local media in Eidovara', properties: ['openFile'], filters: [{ name: 'Audio and video', extensions: ['mp3','m4a','aac','wav','flac','ogg','opus','mp4','m4v','webm','mov','mkv'] }] });
  if (chosen.canceled || !chosen.filePaths[0]) return null;
  const filePath = path.resolve(chosen.filePaths[0]);
  const extension = path.extname(filePath).toLowerCase();
  const video = new Set(['.mp4','.m4v','.webm','.mov','.mkv']).has(extension);
  if (!fs.existsSync(filePath)) throw new Error('The selected media file is unavailable.');
  return { type: video ? 'video' : 'audio', title: path.basename(filePath).slice(0, 200), url: pathToFileURL(filePath).toString(), sourceUrl: '', local: true };
});
ipcMain.handle('soul:createBackup', () => engine.createBackup());
ipcMain.handle('soul:listBackups', () => engine.listBackups());
ipcMain.handle('soul:restoreBackup', (_e, name) => engine.restoreBackup(String(name || '')));
ipcMain.handle('soul:configureSetup', (_e, input) => engine.configureSetup(input));
ipcMain.handle('soul:configureAssistant', (_e, input) => engine.configureAssistant(input));
ipcMain.handle('soul:openExternal', (_e, value) => { const url = new URL(String(value || '')); if (url.protocol !== 'https:') throw new Error('Only secure web links can be opened.'); return shell.openExternal(url.toString()); });
ipcMain.handle('soul:checkForUpdates', async () => { pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() }); return pendingUpdate; });
ipcMain.handle('soul:installUpdate', async () => {
  if (!pendingUpdate?.available) pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() });
  if (!pendingUpdate.available) throw new Error('No update is available.');
  const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['Download and open', 'Cancel'], defaultId: 0, cancelId: 1, title: 'Install Eidovara update', message: `Install Eidovara ${pendingUpdate.version}?`, detail: pendingUpdate.packageType === 'ready-folder-zip' ? 'The ready-to-run folder will be downloaded over HTTPS, verified with SHA-256, and opened for extraction.' : 'The installer will be downloaded over HTTPS, verified with SHA-256, and opened.' });
  if (answer.response !== 0) return { cancelled: true };
  const downloaded = await downloadUpdate(pendingUpdate, path.join(app.getPath('userData'), 'updates'));
  const error = await shell.openPath(downloaded.path); if (error) throw new Error(error); return { ...downloaded, launched: true };
});
ipcMain.handle('soul:addApplication', async () => { if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.'); const chosen = await dialog.showOpenDialog(mainWindow, { title: 'Add an application to Eidovara', properties: ['openFile'], filters: [{ name: 'Windows applications', extensions: ['exe', 'lnk'] }] }); if (chosen.canceled || !chosen.filePaths[0]) return publicConfig(); const filePath = path.resolve(chosen.filePaths[0]); if (!['.exe','.lnk'].includes(path.extname(filePath).toLowerCase()) || !fs.existsSync(filePath)) throw new Error('Choose an existing Windows executable or shortcut.'); config.apps = Array.isArray(config.apps) ? config.apps : []; if (!config.apps.some(x => x.path.toLowerCase() === filePath.toLowerCase())) config.apps.push({ id: cryptoId(filePath), name: path.basename(filePath, path.extname(filePath)).slice(0, 100), path: filePath }); saveConfig(); return publicConfig(); });
ipcMain.handle('soul:discoverApplications', () => discoverStartMenuApplications().map(({ id, name }) => ({ id, name })));
ipcMain.handle('soul:addDiscoveredApplication', (_e, id) => {
  if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.');
  const entry = discoverStartMenuApplications().find(item => item.id === String(id));
  if (!entry || !fs.existsSync(entry.path)) throw new Error('That discovered application is no longer available.');
  config.apps = Array.isArray(config.apps) ? config.apps : [];
  if (!config.apps.some(item => item.path.toLowerCase() === entry.path.toLowerCase())) config.apps.push(entry);
  saveConfig(); return publicConfig();
});
ipcMain.handle('soul:launchApplication', async (_e, id) => { const entry = (config.apps || []).find(x => x.id === String(id)); if (!entry || !fs.existsSync(entry.path)) throw new Error('Application is unavailable or has moved.'); const error = await shell.openPath(entry.path); if (error) throw new Error(error); return true; });
ipcMain.handle('soul:removeApplication', (_e, id) => { config.apps = (config.apps || []).filter(x => x.id !== String(id)); saveConfig(); return publicConfig(); });

function cryptoId(value) { return crypto.createHash('sha256').update(String(value).toLowerCase()).digest('base64url'); }

function discoverStartMenuApplications(limit = 500) {
  if (process.platform !== 'win32') return [];
  const roots = [
    process.env.APPDATA && path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    process.env.ProgramData && path.join(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs')
  ].filter(Boolean);
  const found = [];
  const visit = (directory, depth = 0) => {
    if (depth > 8 || found.length >= limit) return;
    let entries = [];
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (found.length >= limit) break;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target, depth + 1);
      else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.lnk') found.push({ id: cryptoId(target), name: path.basename(entry.name, '.lnk').slice(0, 100), path: target });
    }
  };
  for (const root of roots) visit(root);
  return [...new Map(found.map(item => [item.path.toLowerCase(), item])).values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
}
