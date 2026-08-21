import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function compareVersions(a, b) {
  const parts = value => String(value || '').replace(/^v/i, '').split('.').map(x => Number.parseInt(x, 10) || 0);
  const left = parts(a), right = parts(b);
  for (let i = 0; i < Math.max(left.length, right.length); i++) { const d = (left[i] || 0) - (right[i] || 0); if (d) return Math.sign(d); }
  return 0;
}
function secureUrl(value) { const url = new URL(String(value || '')); if (url.protocol !== 'https:') throw new Error('Update URLs must use HTTPS.'); return url; }
function trustedReleaseUrl(value) {
  const url = secureUrl(value);
  if (url.hostname !== 'github.com' || !url.pathname.startsWith('/ProjectSoulbyTmb/project---soul/releases/download/')) throw new Error('Update packages must come from the official GitHub release channel.');
  return url;
}
async function response(url, options = {}) { const res = await fetch(secureUrl(url), { redirect: 'follow', ...options }); if (!res.ok) throw new Error(`Update server returned ${res.status}.`); if (res.url) secureUrl(res.url); return res; }

export async function checkForUpdate({ manifestUrl, currentVersion }) {
  if (!manifestUrl) return { configured: false, available: false, currentVersion };
  const res = await response(manifestUrl, { headers: { Accept: 'application/json', 'User-Agent': `Eidovara/${currentVersion}` } });
  const manifest = await boundedJson(res, 1024 * 1024, 'Update manifest');
  const version = String(manifest?.version || ''); const downloadUrl = trustedReleaseUrl(manifest?.url).toString(); const sha256 = String(manifest?.sha256 || '').toUpperCase();
  if (!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) throw new Error('Update manifest has an invalid version.');
  if (!/^[A-F0-9]{64}$/.test(sha256)) throw new Error('Update manifest must contain a SHA-256 hash.');
  const extension = path.extname(new URL(downloadUrl).pathname).toLowerCase(); if (!['.exe', '.zip'].includes(extension)) throw new Error('Update package type is not allowed.');
  return { configured: true, available: compareVersions(version, currentVersion) > 0, currentVersion, version, downloadUrl, sha256, packageType: extension === '.zip' ? 'ready-folder-zip' : 'installer', notes: String(manifest.notes || '').slice(0, 4000) };
}

async function boundedJson(res, maxBytes, label) {
  const declared = Number(res.headers?.get?.('content-length') || 0);
  if (declared > maxBytes) throw new Error(`${label} is too large.`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error(`${label} is too large.`);
  try { return JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error(`${label} is not valid JSON.`); }
}

export async function downloadUpdate(update, directory, maxBytes = 400 * 1024 * 1024) {
  if (!update?.available) throw new Error('No update is available.');
  const res = await response(update.downloadUrl, { headers: { Accept: 'application/octet-stream' } });
  const declared = Number(res.headers.get('content-length') || 0); if (declared > maxBytes) throw new Error('Update download is too large.');
  const bytes = Buffer.from(await res.arrayBuffer()); if (bytes.length > maxBytes) throw new Error('Update download is too large.');
  const actual = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(); if (actual !== update.sha256) throw new Error('Update integrity verification failed.');
  const extension = path.extname(trustedReleaseUrl(update.downloadUrl).pathname).toLowerCase(); if (!['.exe', '.zip'].includes(extension)) throw new Error('Update package type is not allowed.');
  fs.mkdirSync(directory, { recursive: true }); const target = path.join(directory, `Project-Soul-Update-${update.version}${extension}`); const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, bytes, { mode: 0o600 }); fs.renameSync(tmp, target);
  let internetZoneMarked = false;
  if (process.platform === 'win32') {
    try { fs.writeFileSync(`${target}:Zone.Identifier`, '[ZoneTransfer]\r\nZoneId=3\r\nReferrerUrl=https://github.com/ProjectSoulbyTmb/project---soul/\r\n', 'utf8'); internetZoneMarked = true; } catch {}
  }
  return { path: target, bytes: bytes.length, sha256: actual, version: update.version, internetZoneMarked };
}
