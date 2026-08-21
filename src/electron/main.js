import { app, BrowserWindow, ipcMain, dialog, safeStorage, shell, protocol, net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SoulEngine } from '../core/engine.js';
import { JsonStore } from '../core/store.js';
import { defaultProfile } from '../core/schema.js';
import { OfflineProvider } from '../providers/offline.js';
import { callCompatibleProvider, callLocalProvider, LOCAL_PROVIDER_DEFAULT_ENDPOINT, normalizeProviderEndpoint } from '../providers/http.js';
import { fetchServiceSnapshot, normalizeServiceUrl, resolveServiceBase, httpsOnlyUrl } from '../core/service.js';
import { checkForUpdate, downloadUpdate } from '../core/updater.js';
import { RELEASE_MANIFEST_URL } from '../config/release-channel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_MEDIA_SCHEME = 'eidovara-media';
const allowedLocalMedia = new Map();
protocol.registerSchemesAsPrivileged([
  { scheme: LOCAL_MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);
let mainWindow, engine, logPath, configPath, heartbeatTimer = 0, heartbeatTicks = 0;
const COMPANION_MEDIA_ID = crypto.createHash('sha256').update('eidovara-companion-look-v1').digest('hex').slice(0, 32);
const COMPANION_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
let config = { provider: 'offline', endpoint: '', model: '', language: 'en', encryptedApiKey: '', encryptedSearchApiKey: '', apps: [], theme: { background: '#000000', panel: '#1C1C1E', accent: '#0A84FF', transparency: 96, rgbEffects: false, gamingMode: false }, companion: { avatarMode: '3d', motion: 'gentle', voiceEnabled: false, voiceName: '', voiceURI: '', rate: 1, pitch: 1, mute: true, lookId: 'orb', adultPresentation: false, bodyHeight: 50, bodyBuild: 50, bodyCurves: 50 }, assistOptIn: false };
let pendingUpdate = null;
const ADMIN_SESSION_MS = 15 * 60 * 1000;
let adminSessionUntil = 0, failedAdminAttempts = 0, adminLockedUntil = 0;

function log(message, error) { try { if (!logPath) logPath = path.join(app.getPath('userData'), 'project-soul.log'); fs.mkdirSync(path.dirname(logPath), { recursive: true }); fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}${error ? `\n${error?.stack || error}` : ''}\n`); } catch {} }
function fatal(title, error) { log(title, error); try { dialog.showErrorBox(title, `${error?.stack || error}\n\nLog: ${logPath}`); } catch {} }
function loadConfig() {
  configPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const codec = protectedStorageCodec();
    const raw = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(codec.decode(raw)) };
    if (codec.encrypted && !raw.startsWith('eidovara-safe-storage-v1:')) saveConfig();
  } catch {}
}
function atomicReplace(target, content) { fs.mkdirSync(path.dirname(target), { recursive: true }); const tmp = `${target}.${process.pid}.tmp`; const previous = `${target}.previous`; fs.writeFileSync(tmp, content, { mode: 0o600 }); try { if (fs.existsSync(target)) fs.copyFileSync(target, previous); fs.renameSync(tmp, target); } catch (err) { try { fs.rmSync(target, { force: true }); fs.renameSync(tmp, target); } catch (inner) { if (fs.existsSync(previous)) fs.copyFileSync(previous, target); throw inner; } } }
function saveConfig() { atomicReplace(configPath, protectedStorageCodec().encode(JSON.stringify(config, null, 2))); }
function getApiKey() { if (!config.encryptedApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedApiKey, 'base64')) : ''; } catch { return ''; } }
function getSearchApiKey() { if (!config.encryptedSearchApiKey) return ''; try { return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(config.encryptedSearchApiKey, 'base64')) : ''; } catch { return ''; } }
function protectedStorageCodec() {
  const prefix = 'eidovara-safe-storage-v1:';
  if (!safeStorage.isEncryptionAvailable()) return { encode: value => value, decode: value => value, encrypted: false };
  return {
    encrypted: true,
    encode: value => `${prefix}${safeStorage.encryptString(String(value)).toString('base64')}`,
    decode: value => {
      const raw = String(value || '');
      if (!raw.startsWith(prefix)) return raw;
      return safeStorage.decryptString(Buffer.from(raw.slice(prefix.length), 'base64'));
    }
  };
}
function defenderExecutable() {
  if (process.platform !== 'win32') return '';
  const candidates = [process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Windows Defender', 'MpCmdRun.exe')].filter(Boolean);
  const root = process.env.ProgramData && path.join(process.env.ProgramData, 'Microsoft', 'Windows Defender', 'Platform');
  try { candidates.unshift(...fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => path.join(root, entry.name, 'MpCmdRun.exe')).sort().reverse()); } catch {}
  return candidates.find(candidate => fs.existsSync(candidate)) || '';
}
function scanUpdateForMalware(filePath) {
  const scanner = defenderExecutable();
  if (!scanner) return Promise.resolve({ available: false, completed: false });
  return new Promise(resolve => execFile(scanner, ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation'], { windowsHide: true, timeout: 120_000 }, error => {
    const code = Number(error?.code ?? 0);
    resolve({ available: true, completed: !error, threatDetected: code === 2 });
  }));
}
function entitlement() { return config.edition === 'premium' ? 'premium' : 'free'; }
function adminConfigured() { return Boolean(config.admin?.salt && config.admin?.hash); }
function deriveAdminHash(password, salt) { return crypto.scryptSync(String(password), Buffer.from(salt, 'base64'), 32).toString('hex'); }
function validateNewAdminPassword(password) {
  const value = String(password || '');
  if (value.length < 12 || value.length > 200) throw new Error('Use an administrator password between 12 and 200 characters.');
  return value;
}
function companionLookPath() {
  try {
    const dir = path.join(app.getPath('userData'), 'companion');
    fs.mkdirSync(dir, { recursive: true });
    const found = fs.readdirSync(dir).find(name => COMPANION_IMAGE_EXTS.has(path.extname(name).toLowerCase()));
    return found ? path.join(dir, found) : '';
  } catch { return ''; }
}
function registerCompanionImage() {
  const filePath = companionLookPath();
  if (filePath && fs.existsSync(filePath)) allowedLocalMedia.set(COMPANION_MEDIA_ID, filePath);
  else allowedLocalMedia.delete(COMPANION_MEDIA_ID);
  return filePath;
}
function companionPresenceUrl() {
  return registerCompanionImage() ? `${LOCAL_MEDIA_SCHEME}://${COMPANION_MEDIA_ID}/` : '';
}
const sessionLocalLibrary = [];
const LOCAL_LIBRARY_LIMIT = 32;
function retainCompanionMedia() {
  const companionPath = allowedLocalMedia.get(COMPANION_MEDIA_ID);
  allowedLocalMedia.clear();
  if (companionPath) allowedLocalMedia.set(COMPANION_MEDIA_ID, companionPath);
  for (const item of sessionLocalLibrary) {
    if (item?.id && item.path && fs.existsSync(item.path)) allowedLocalMedia.set(item.id, item.path);
  }
}
function publicLocalLibrary() {
  return sessionLocalLibrary.map(({ type, title, url }) => ({ type, title, url, local: true, sourceUrl: '' }));
}
function applyInternetOptions() {
  ensureEngine().setInternetOptions({
    searchApiKey: entitlement() === 'premium' ? getSearchApiKey() : '',
    localLibrary: publicLocalLibrary()
  });
}
function registerSessionMedia(filePath, { type, title }) {
  const id = crypto.randomBytes(16).toString('hex');
  allowedLocalMedia.set(id, filePath);
  const item = { id, type, title: String(title).slice(0, 200), url: `${LOCAL_MEDIA_SCHEME}://${id}/`, local: true, path: filePath };
  sessionLocalLibrary.unshift(item);
  while (sessionLocalLibrary.length > LOCAL_LIBRARY_LIMIT) {
    const old = sessionLocalLibrary.pop();
    if (old?.id && old.id !== COMPANION_MEDIA_ID) allowedLocalMedia.delete(old.id);
  }
  return { type: item.type, title: item.title, url: item.url, sourceUrl: '', local: true };
}
function startKernelHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTicks = 0;
  heartbeatTimer = setInterval(() => {
    if (!engine || config.ageGateAccepted !== true) return;
    heartbeatTicks += 1;
    try { engine.heartbeat({ persist: heartbeatTicks % 12 === 0 }); } catch {}
  }, 5000);
}
function publicServiceUrl() { try { return resolveServiceBase(config.serviceUrl); } catch { return ''; } }
function publicServiceStatus() {
  const stored = config.serviceStatus && typeof config.serviceStatus === 'object' ? config.serviceStatus : {};
  return {
    configured: Boolean(publicServiceUrl()),
    online: stored.online === true,
    paymentsEnabled: false,
    checkoutEnabled: false,
    service: String(stored.service || '').slice(0, 100),
    version: String(stored.version || '').slice(0, 40),
    website: httpsOnlyUrl(stored.website),
    error: String(stored.error || '').slice(0, 300),
    lastCheckedAt: String(stored.lastCheckedAt || ''),
    localFirst: true
  };
}
function publicConfig() {
  const companion = { ...(config.companion || {}) };
  if (!companion.voiceURI && companion.voiceName) companion.voiceURI = companion.voiceName;
  if (companion.mute === undefined) companion.mute = companion.voiceEnabled === false;
  companion.presenceUrl = companionPresenceUrl();
  companion.hasLocalImage = Boolean(companion.presenceUrl);
  return {
    provider: config.provider, endpoint: config.endpoint || '', model: config.model || '',
    language: ['en','es','fr','de'].includes(config.language) ? config.language : 'en',
    ageGateAccepted: config.ageGateAccepted === true,
    apps: Array.isArray(config.apps) ? config.apps : [],
    theme: config.theme || {},
    companion,
    assistOptIn: config.assistOptIn === true,
    edition: entitlement(),
    storeUrl: httpsOnlyUrl(config.storeUrl),
    serviceUrl: publicServiceUrl(),
    serviceStatus: publicServiceStatus(),
    updateChannelConfigured: Boolean(RELEASE_MANIFEST_URL),
    hasApiKey: Boolean(config.encryptedApiKey),
    hasSearchApiKey: Boolean(config.encryptedSearchApiKey),
    encryptionAvailable: safeStorage.isEncryptionAvailable()
  };
}
function requireAgeGate() { if (config.ageGateAccepted !== true) throw new Error('Eidovara is restricted to users age 18 or older. Confirm age and accept the terms to continue.'); }
async function checkEidovaraService() {
  const snapshot = await fetchServiceSnapshot({ base: publicServiceUrl() });
  config.serviceStatus = {
    configured: snapshot.configured === true,
    online: snapshot.online === true,
    paymentsEnabled: false,
    checkoutEnabled: false,
    service: String(snapshot.service || '').slice(0, 100),
    version: String(snapshot.version || '').slice(0, 40),
    website: snapshot.website || '',
    error: String(snapshot.error || '').slice(0, 300),
    lastCheckedAt: snapshot.lastCheckedAt || new Date().toISOString(),
    localFirst: true
  };
  saveConfig();
  return { ...snapshot, paymentsEnabled: false, checkoutEnabled: false, serviceUrl: publicServiceUrl(), serviceStatus: publicServiceStatus() };
}
function adminAuthorized() { return Date.now() < adminSessionUntil; }
function requireAdmin() { if (!adminAuthorized()) throw new Error('Administrator authentication is required.'); }
function makeProvider() {
  if (config.provider === 'local') return { reply: ({ messages }) => callLocalProvider({ endpoint: config.endpoint || LOCAL_PROVIDER_DEFAULT_ENDPOINT, model: config.model, messages }) };
  if (config.provider === 'compatible' && entitlement() === 'premium') return { reply: ({ messages }) => callCompatibleProvider({ endpoint: config.endpoint, apiKey: getApiKey(), model: config.model, messages }) };
  return new OfflineProvider();
}
function ensureEngine() {
  requireAgeGate();
  if (!engine) {
    engine = new SoulEngine({
      store: new JsonStore({ dataDir: path.join(app.getPath('userData'), 'profiles'), profileId: 'default', codec: protectedStorageCodec() }),
      provider: makeProvider(),
      internetOptions: { searchApiKey: entitlement() === 'premium' ? getSearchApiKey() : '', localLibrary: publicLocalLibrary() }
    });
    engine.configureKernel({
      voice: {
        voiceURI: config.companion?.voiceURI || config.companion?.voiceName || '',
        rate: config.companion?.rate,
        pitch: config.companion?.pitch,
        mute: config.companion?.mute === undefined ? !config.companion?.voiceEnabled : config.companion.mute
      },
      presence: { lookId: config.companion?.lookId, hasLocalImage: Boolean(companionLookPath()) },
      assistOptIn: config.assistOptIn === true
    });
    startKernelHeartbeat();
  }
  return engine;
}
function createWindow() {
  try {
    loadConfig();
    registerCompanionImage();
    if (config.ageGateAccepted === true) ensureEngine();
    mainWindow = new BrowserWindow({ width: 1280, height: 840, minWidth: 780, minHeight: 600, title: 'Eidovara v0.18.3', icon: path.join(__dirname, '../../assets/branding/eidovara-512.png'), backgroundColor: '#000000', show: false,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, spellcheck: false } });
    mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback, details) => callback(permission === 'media' && Array.isArray(details?.mediaTypes) && details.mediaTypes.length === 1 && details.mediaTypes[0] === 'audio'));
    mainWindow.webContents.session.setPermissionCheckHandler((_wc, permission, _origin, details) => permission === 'media' && Array.isArray(details?.mediaTypes) && details.mediaTypes.length === 1 && details.mediaTypes[0] === 'audio');
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('closed', () => { allowedLocalMedia.clear(); mainWindow = null; });
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    mainWindow.webContents.on('will-navigate', e => e.preventDefault());
    mainWindow.webContents.on('will-attach-webview', e => e.preventDefault());
    mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => fatal('Eidovara failed to load', new Error(`${code}: ${desc} (${url})`)));
    mainWindow.webContents.on('render-process-gone', (_e, details) => fatal('Eidovara renderer stopped', new Error(JSON.stringify(details))));
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch(err => fatal('Eidovara interface error', err));
  } catch (err) { fatal('Eidovara startup error', err); }
}

function registerLocalMediaProtocol() {
  protocol.handle(LOCAL_MEDIA_SCHEME, async request => {
    let id = '';
    try { id = new URL(request.url).hostname; } catch { return new Response('Bad request', { status: 400 }); }
    if (!/^[a-f0-9]{32}$/.test(id)) return new Response('Not found', { status: 404 });
    const filePath = allowedLocalMedia.get(id);
    if (!filePath || !fs.existsSync(filePath)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
process.on('uncaughtException', err => fatal('Eidovara startup error', err));
process.on('unhandledRejection', err => fatal('Eidovara promise error', err));
app.whenReady().then(() => { registerLocalMediaProtocol(); createWindow(); }).catch(err => fatal('Eidovara initialization error', err));
app.on('window-all-closed', () => { allowedLocalMedia.clear(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('soul:send', async (_e, m) => {
  requireAgeGate();
  applyInternetOptions();
  const result = await ensureEngine().respond(m);
  if (!result.adultAllowed && config.companion?.adultPresentation) { config.companion.adultPresentation = false; saveConfig(); }
  return result;
});
ipcMain.handle('soul:snapshot', () => (config.ageGateAccepted === true ? ensureEngine().snapshot() : defaultProfile('default')));
ipcMain.handle('soul:recordMedia', (_e, input) => { requireAgeGate(); return ensureEngine().recordMedia(input); });
ipcMain.handle('soul:entertainment', () => { requireAgeGate(); return ensureEngine().entertainment(); });
ipcMain.handle('soul:reset', () => { requireAgeGate(); return ensureEngine().reset(); });
ipcMain.handle('soul:remember', (_e, c, opts) => {
  requireAgeGate();
  const kind = ['preference', 'observation', 'criticism', 'fact'].includes(opts?.kind) ? opts.kind : 'preference';
  return ensureEngine().remember(String(c || '').slice(0, 1000), { kind });
});
ipcMain.handle('soul:forget', (_e, x) => { requireAgeGate(); return ensureEngine().forget(String(x || '').slice(0, 1000)); });
ipcMain.handle('soul:newConversation', () => { requireAgeGate(); return ensureEngine().newConversation(); });
ipcMain.handle('soul:selectConversation', (_e, id) => { requireAgeGate(); return ensureEngine().selectConversation(String(id)); });
ipcMain.handle('soul:deleteConversation', (_e, id) => { requireAgeGate(); return ensureEngine().deleteConversation(String(id)); });
ipcMain.handle('soul:getSettings', () => publicConfig());
ipcMain.handle('soul:acceptAgeGate', (_e, confirmed) => { if (confirmed !== true) throw new Error('Confirm that you are 18 or older and accept the terms to continue.'); config.ageGateAccepted = true; saveConfig(); ensureEngine(); return publicConfig(); });
ipcMain.handle('soul:declineAgeGate', () => { setImmediate(() => app.quit()); return true; });
ipcMain.handle('soul:adminLogin', (_e, password) => {
  requireAgeGate();
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
  requireAgeGate();
  if (adminConfigured()) throw new Error('The administrator password is already configured. Sign in to administer this installation.');
  const value = validateNewAdminPassword(password);
  const salt = crypto.randomBytes(16).toString('base64');
  config.admin = { salt, hash: deriveAdminHash(value, salt), algorithm: 'scrypt-v1' };
  saveConfig(); adminSessionUntil = Date.now() + ADMIN_SESSION_MS;
  log('Local administrator password configured.');
  return { configured: true, authorized: true, expiresAt: new Date(adminSessionUntil).toISOString(), edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl };
});
ipcMain.handle('soul:adminStatus', () => { requireAgeGate(); return ({ configured: adminConfigured(), authorized: adminAuthorized(), expiresAt: adminAuthorized() ? new Date(adminSessionUntil).toISOString() : null, edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl }); });
ipcMain.handle('soul:adminSave', (_e, incoming) => {
  requireAgeGate(); requireAdmin(); config.edition = incoming?.edition === 'premium' ? 'premium' : 'free';
  if (config.edition === 'free') { if (config.provider === 'compatible') config.provider = 'offline'; config.theme = { ...(config.theme || {}), rgbEffects: false }; }
  const storeUrl = String(incoming?.storeUrl || '').trim().slice(0, 1000);
  if (storeUrl) {
    const safeStore = httpsOnlyUrl(storeUrl);
    if (!safeStore) throw new Error('The store link must use HTTPS without credentials.');
    config.storeUrl = safeStore;
  } else {
    config.storeUrl = '';
  }
  config.serviceUrl = normalizeServiceUrl(incoming?.serviceUrl); saveConfig(); ensureEngine().setProvider(makeProvider()); applyInternetOptions(); log(`Administrator changed local edition to ${config.edition}.`);
  return { authorized: true, expiresAt: new Date(adminSessionUntil).toISOString(), edition: entitlement(), storeUrl: publicConfig().storeUrl, serviceUrl: publicConfig().serviceUrl };
});
ipcMain.handle('soul:adminLogout', () => { adminSessionUntil = 0; return true; });
ipcMain.handle('soul:checkService', async () => { requireAgeGate(); return checkEidovaraService(); });
ipcMain.handle('soul:connectService', async (_e, incoming) => {
  requireAgeGate();
  if (incoming && Object.prototype.hasOwnProperty.call(incoming, 'serviceUrl')) {
    config.serviceUrl = normalizeServiceUrl(incoming.serviceUrl);
    saveConfig();
  }
  return checkEidovaraService();
});
ipcMain.handle('soul:saveSettings', (_e, incoming) => {
  requireAgeGate();
  const provider = ['offline','local','compatible'].includes(incoming?.provider) ? incoming.provider : 'offline';
  if (entitlement() === 'free' && provider === 'compatible') throw new Error('Remote model endpoints are a Premium feature. Eidovara Free supports offline and local models.');
  config.provider = provider;
  config.language = ['en','es','fr','de'].includes(incoming?.language) ? incoming.language : (config.language || 'en');
  config.endpoint = String(incoming?.endpoint || '').slice(0, 500);
  if (config.endpoint && (provider === 'local' || provider === 'compatible')) {
    config.endpoint = normalizeProviderEndpoint(config.endpoint, { localOnly: provider === 'local' });
  }
  config.model = String(incoming?.model || '').slice(0, 200);
  if (incoming?.theme && typeof incoming.theme === 'object') { const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback; config.theme = { background: color(incoming.theme.background, '#000000'), panel: color(incoming.theme.panel, '#1C1C1E'), accent: color(incoming.theme.accent, '#0A84FF'), transparency: Math.max(65, Math.min(100, Number(incoming.theme.transparency) || 96)), rgbEffects: entitlement() === 'premium' && Boolean(incoming.theme.rgbEffects), gamingMode: Boolean(incoming.theme.gamingMode) }; }
  if (incoming?.companion && typeof incoming.companion === 'object') {
    const policy = ensureEngine().snapshot().policy || {};
    const adultGatesActive = policy.adultStatusConfirmed === true && policy.adultSoulEnabled === true && policy.currentConsent === true && policy.mode === 'adult';
    const boundedShape = value => Math.max(0, Math.min(100, Number(value) || 50));
    config.companion = {
      avatarMode: ['hidden','2d','3d'].includes(incoming.companion.avatarMode) ? incoming.companion.avatarMode : '3d',
      motion: ['full','gentle','reduced'].includes(incoming.companion.motion) ? incoming.companion.motion : 'gentle',
      voiceEnabled: incoming.companion.mute === undefined ? Boolean(incoming.companion.voiceEnabled) : !Boolean(incoming.companion.mute),
      voiceName: String(incoming.companion.voiceURI || incoming.companion.voiceName || '').slice(0, 300),
      voiceURI: String(incoming.companion.voiceURI || incoming.companion.voiceName || '').slice(0, 300),
      rate: Math.max(0.5, Math.min(2, Number(incoming.companion.rate) || 1)),
      pitch: Math.max(0.5, Math.min(2, Number(incoming.companion.pitch) || 1)),
      mute: incoming.companion.mute === undefined ? !Boolean(incoming.companion.voiceEnabled) : Boolean(incoming.companion.mute),
      lookId: ['orb','hologram','ambient','pulse','silhouette','local-image'].includes(incoming.companion.lookId) ? incoming.companion.lookId : (config.companion?.lookId || 'orb'),
      adultPresentation: adultGatesActive && Boolean(incoming.companion.adultPresentation),
      bodyHeight: boundedShape(incoming.companion.bodyHeight),
      bodyBuild: boundedShape(incoming.companion.bodyBuild),
      bodyCurves: boundedShape(incoming.companion.bodyCurves)
    };
    ensureEngine().configureKernel({
      voice: { voiceURI: config.companion.voiceURI, rate: config.companion.rate, pitch: config.companion.pitch, mute: config.companion.mute },
      presence: { lookId: config.companion.lookId, hasLocalImage: Boolean(companionLookPath()) }
    });
  }
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
  if (incoming && Object.prototype.hasOwnProperty.call(incoming, 'assistOptIn')) {
    config.assistOptIn = incoming.assistOptIn === true;
    ensureEngine().configureKernel({ assistOptIn: config.assistOptIn });
  }
  saveConfig(); ensureEngine().setProvider(makeProvider()); applyInternetOptions(); return publicConfig();
});
ipcMain.handle('soul:diagnostics', async () => { requireAgeGate(); return ({ version: app.getVersion(), electron: process.versions.electron, chromium: process.versions.chrome, node: process.versions.node, platform: process.platform, arch: process.arch, hardwareAcceleration: !app.commandLine.hasSwitch('disable-gpu'), gpuFeatureStatus: app.getGPUFeatureStatus(), gpu: await app.getGPUInfo('complete').catch(() => ({ unavailable: true })), mediaFeatures: { htmlAudio: true, htmlVideo: true, webAudio: true, hardwareAcceleratedChromium: true }, userData: app.getPath('userData'), logPath, settings: publicConfig(), localSafetyReportCount: ensureEngine().snapshot().policy.localSafetyReports?.length || 0 }); });
ipcMain.handle('soul:openDataFolder', () => { requireAgeGate(); return shell.openPath(app.getPath('userData')); });
ipcMain.handle('soul:selectLocalMedia', async () => {
  requireAgeGate();
  const chosen = await dialog.showOpenDialog(mainWindow, { title: 'Open local media in Eidovara', properties: ['openFile'], filters: [{ name: 'Audio and video', extensions: ['mp3','m4a','aac','wav','flac','ogg','opus','mp4','m4v','webm','mov','mkv'] }] });
  if (chosen.canceled || !chosen.filePaths[0]) return null;
  const filePath = path.resolve(chosen.filePaths[0]);
  const extension = path.extname(filePath).toLowerCase();
  const video = new Set(['.mp4','.m4v','.webm','.mov','.mkv']).has(extension);
  if (!fs.existsSync(filePath)) throw new Error('The selected media file is unavailable.');
  const item = registerSessionMedia(filePath, { type: video ? 'video' : 'audio', title: path.basename(filePath).slice(0, 200) });
  applyInternetOptions();
  return item;
});
ipcMain.handle('soul:listLocalMedia', () => { requireAgeGate(); return publicLocalLibrary(); });
ipcMain.handle('soul:createBackup', () => { requireAgeGate(); return ensureEngine().createBackup(); });
ipcMain.handle('soul:listBackups', () => { requireAgeGate(); return ensureEngine().listBackups(); });
ipcMain.handle('soul:restoreBackup', (_e, name) => { requireAgeGate(); return ensureEngine().restoreBackup(String(name || '')); });
ipcMain.handle('soul:configureSetup', (_e, input) => { requireAgeGate(); return ensureEngine().configureSetup(input); });
ipcMain.handle('soul:configureAssistant', (_e, input) => { requireAgeGate(); return ensureEngine().configureAssistant(input); });
ipcMain.handle('soul:configureKernel', (_e, input) => {
  requireAgeGate();
  if (input && Object.prototype.hasOwnProperty.call(input, 'assistOptIn')) config.assistOptIn = input.assistOptIn === true;
  if (input?.voice || input?.presence) {
    config.companion = {
      ...(config.companion || {}),
      voiceURI: input.voice?.voiceURI !== undefined ? String(input.voice.voiceURI).slice(0, 300) : (config.companion?.voiceURI || ''),
      voiceName: input.voice?.voiceURI !== undefined ? String(input.voice.voiceURI).slice(0, 300) : (config.companion?.voiceName || ''),
      rate: input.voice?.rate !== undefined ? Math.max(0.5, Math.min(2, Number(input.voice.rate) || 1)) : (config.companion?.rate || 1),
      pitch: input.voice?.pitch !== undefined ? Math.max(0.5, Math.min(2, Number(input.voice.pitch) || 1)) : (config.companion?.pitch || 1),
      mute: input.voice?.mute !== undefined ? Boolean(input.voice.mute) : (config.companion?.mute !== false),
      voiceEnabled: input.voice?.mute !== undefined ? !Boolean(input.voice.mute) : config.companion?.voiceEnabled,
      lookId: input.presence?.lookId || config.companion?.lookId || 'orb'
    };
    saveConfig();
  } else if (Object.prototype.hasOwnProperty.call(input || {}, 'assistOptIn')) saveConfig();
  return { state: ensureEngine().configureKernel({ ...input, assistOptIn: config.assistOptIn }), settings: publicConfig(), kernel: ensureEngine().kernelStatus() };
});
ipcMain.handle('soul:kernelStatus', () => { requireAgeGate(); return ensureEngine().kernelStatus(); });
ipcMain.handle('soul:assistQuery', async (_e, query) => {
  requireAgeGate();
  if (config.assistOptIn !== true) return { ok: false, skipped: true, reason: 'opt-in-off', assist: true, soul: false, conversationsSent: false };
  return ensureEngine().assistQuery(query, { base: publicServiceUrl() });
});
ipcMain.handle('soul:selectCompanionImage', async () => {
  requireAgeGate();
  const chosen = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose a local companion image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  });
  if (chosen.canceled || !chosen.filePaths[0]) return publicConfig();
  const filePath = path.resolve(chosen.filePaths[0]);
  const extension = path.extname(filePath).toLowerCase();
  if (!COMPANION_IMAGE_EXTS.has(extension) || !fs.existsSync(filePath)) throw new Error('Choose an existing PNG, JPEG, WebP, or GIF image.');
  const dir = path.join(app.getPath('userData'), 'companion');
  fs.mkdirSync(dir, { recursive: true });
  for (const stale of fs.readdirSync(dir)) fs.rmSync(path.join(dir, stale), { force: true });
  const target = path.join(dir, `look${extension}`);
  fs.copyFileSync(filePath, target);
  registerCompanionImage();
  config.companion = { ...(config.companion || {}), lookId: 'local-image' };
  saveConfig();
  ensureEngine().configureKernel({ presence: { lookId: 'local-image', hasLocalImage: true } });
  return publicConfig();
});
ipcMain.handle('soul:openExternal', (_e, value) => { requireAgeGate(); const url = httpsOnlyUrl(value); if (!url) throw new Error('Only secure web links can be opened.'); return shell.openExternal(url); });
ipcMain.handle('soul:checkForUpdates', async () => { requireAgeGate(); pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() }); return pendingUpdate; });
ipcMain.handle('soul:installUpdate', async () => {
  requireAgeGate();
  if (!pendingUpdate?.available) pendingUpdate = await checkForUpdate({ manifestUrl: RELEASE_MANIFEST_URL, currentVersion: app.getVersion() });
  if (!pendingUpdate.available) throw new Error('No update is available.');
  const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: ['Download and open', 'Cancel'], defaultId: 0, cancelId: 1, title: 'Install Eidovara update', message: `Install Eidovara ${pendingUpdate.version}?`, detail: pendingUpdate.packageType === 'ready-folder-zip' ? 'The ready-to-run folder will be downloaded over HTTPS, verified with SHA-256, and opened for extraction.' : 'The installer will be downloaded over HTTPS, verified with SHA-256, and opened.' });
  if (answer.response !== 0) return { cancelled: true };
  const downloaded = await downloadUpdate(pendingUpdate, path.join(app.getPath('userData'), 'updates'));
  const malwareScan = await scanUpdateForMalware(downloaded.path);
  if (malwareScan.threatDetected) throw new Error('Microsoft Defender reported that this update requires security action. The installer was not opened.');
  const error = await shell.openPath(downloaded.path); if (error) throw new Error(error); return { ...downloaded, malwareScan, launched: true };
});
ipcMain.handle('soul:addApplication', async () => { requireAgeGate(); if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.'); const chosen = await dialog.showOpenDialog(mainWindow, { title: 'Add an application to Eidovara', properties: ['openFile'], filters: [{ name: 'Windows applications', extensions: ['exe', 'lnk'] }] }); if (chosen.canceled || !chosen.filePaths[0]) return publicConfig(); const filePath = path.resolve(chosen.filePaths[0]); if (!['.exe','.lnk'].includes(path.extname(filePath).toLowerCase()) || !fs.existsSync(filePath)) throw new Error('Choose an existing Windows executable or shortcut.'); config.apps = Array.isArray(config.apps) ? config.apps : []; if (!config.apps.some(x => x.path.toLowerCase() === filePath.toLowerCase())) config.apps.push({ id: cryptoId(filePath), name: path.basename(filePath, path.extname(filePath)).slice(0, 100), path: filePath }); saveConfig(); return publicConfig(); });
ipcMain.handle('soul:discoverApplications', () => { requireAgeGate(); return discoverStartMenuApplications().map(({ id, name }) => ({ id, name })); });
ipcMain.handle('soul:addDiscoveredApplication', (_e, id) => {
  requireAgeGate();
  if (entitlement() === 'free' && (config.apps || []).length >= 3) throw new Error('Eidovara Free supports up to three linked applications. Premium removes this limit.');
  const entry = discoverStartMenuApplications().find(item => item.id === String(id));
  if (!entry || !fs.existsSync(entry.path)) throw new Error('That discovered application is no longer available.');
  config.apps = Array.isArray(config.apps) ? config.apps : [];
  if (!config.apps.some(item => item.path.toLowerCase() === entry.path.toLowerCase())) config.apps.push(entry);
  saveConfig(); return publicConfig();
});
ipcMain.handle('soul:launchApplication', async (_e, id) => {
  requireAgeGate();
  const entry = (config.apps || []).find(x => x.id === String(id));
  if (!entry || !fs.existsSync(entry.path)) throw new Error('Application is unavailable or has moved.');
  const answer = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Launch', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    title: 'Launch with Windows',
    message: `Ask Windows to open ${entry.name}?`,
    detail: 'Eidovara does not inject into that process, overlay it, or bypass anti-cheat. Windows will open the selected shortcut or executable.'
  });
  if (answer.response !== 0) return { cancelled: true };
  const error = await shell.openPath(entry.path);
  if (error) throw new Error(error);
  return { launched: true };
});
ipcMain.handle('soul:removeApplication', (_e, id) => { requireAgeGate(); config.apps = (config.apps || []).filter(x => x.id !== String(id)); saveConfig(); return publicConfig(); });

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
