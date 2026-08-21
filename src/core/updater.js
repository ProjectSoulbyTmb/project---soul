// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const SHA256_HEX = /^[A-F0-9]{64}$/;
const SHA512_HEX = /^[A-F0-9]{128}$/;
const SHA512_B64 = /^[A-Za-z0-9+/]{86,88}={0,2}$/;
const OFFICIAL_RELEASE_PREFIX = '/ProjectSoulbyTmb/project---soul/releases/download/';

function parseSemver(value) {
  const raw = String(value || '').trim().replace(/^v/i, '');
  const match = raw.match(VERSION_RE);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.').map(part => (/^\d+$/.test(part) ? Number(part) : part)) : []
  };
}

function compareIdentifiers(left, right) {
  const numericLeft = typeof left === 'number';
  const numericRight = typeof right === 'number';
  if (numericLeft && numericRight) return Math.sign(left - right);
  if (numericLeft) return -1;
  if (numericRight) return 1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** Semver compare. Positive when `a` is newer than `b`. Pre-release is older than the same release. */
export function compareVersions(a, b) {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (left && right) {
    for (const key of ['major', 'minor', 'patch']) {
      const delta = left[key] - right[key];
      if (delta) return Math.sign(delta);
    }
    if (!left.prerelease.length && !right.prerelease.length) return 0;
    if (!left.prerelease.length) return 1;
    if (!right.prerelease.length) return -1;
    const n = Math.max(left.prerelease.length, right.prerelease.length);
    for (let i = 0; i < n; i++) {
      if (left.prerelease[i] === undefined) return -1;
      if (right.prerelease[i] === undefined) return 1;
      const delta = compareIdentifiers(left.prerelease[i], right.prerelease[i]);
      if (delta) return delta;
    }
    return 0;
  }
  const parts = value => String(value || '').replace(/^v/i, '').split('.').map(x => Number.parseInt(x, 10) || 0);
  const fallbackLeft = parts(a), fallbackRight = parts(b);
  for (let i = 0; i < Math.max(fallbackLeft.length, fallbackRight.length); i++) {
    const d = (fallbackLeft[i] || 0) - (fallbackRight[i] || 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

export function isPrerelease(version) {
  const parsed = parseSemver(version);
  return Boolean(parsed && parsed.prerelease.length);
}

export function autoCheckEnabled(settings) {
  if (!settings || typeof settings !== 'object') return true;
  return settings.autoCheckUpdates !== false;
}

export function shouldOfferUpdate({ currentVersion, candidateVersion, draft = false, prerelease = false } = {}) {
  if (draft === true) return { offer: false, reason: 'draft' };
  const candidate = String(candidateVersion || '');
  const current = String(currentVersion || '');
  if (!parseSemver(candidate)) return { offer: false, reason: 'invalid-version' };
  const candidateIsPre = prerelease === true || isPrerelease(candidate);
  if (candidateIsPre && !isPrerelease(current)) return { offer: false, reason: 'prerelease' };
  if (compareVersions(candidate, current) <= 0) return { offer: false, reason: 'not-newer' };
  return { offer: true };
}

function isSha512(value) {
  const text = String(value || '').trim();
  return SHA512_HEX.test(text) || (SHA512_B64.test(text) && text.length >= 86);
}

function isSha256(value) {
  return SHA256_HEX.test(String(value || '').trim().toUpperCase());
}

export function requireUpdateIntegrity(info) {
  if (!info || typeof info !== 'object') throw new Error('Update metadata is missing. Eidovara refused to install.');
  const sha512 = String(info.sha512 || info.files?.[0]?.sha512 || '').trim();
  const sha256 = String(info.sha256 || '').trim().toUpperCase();
  if (!isSha512(sha512) && !isSha256(sha256)) {
    throw new Error('Update metadata is missing a SHA-512 or SHA-256 checksum. Eidovara refused to install.');
  }
  const locator = String(info.url || info.downloadUrl || '');
  if (/^https?:\/\//i.test(locator)) trustedReleaseUrl(locator);
  return {
    sha512: isSha512(sha512) ? sha512 : '',
    sha256: isSha256(sha256) ? sha256 : ''
  };
}

export function parseLatestYml(text) {
  const raw = String(text || '');
  if (!raw.trim()) throw new Error('Update metadata is missing.');
  const version = (raw.match(/^version:\s*['"]?([^\s'"]+)/m) || [])[1] || '';
  const filePath = (raw.match(/^path:\s*['"]?([^\s'"]+)/m) || [])[1] || '';
  const topSha = (raw.match(/^sha512:\s*['"]?([A-Za-z0-9+/=]+)/m) || [])[1] || '';
  const fileSha = (raw.match(/^\s+-?\s*sha512:\s*['"]?([A-Za-z0-9+/=]+)/m) || raw.match(/^\s+sha512:\s*['"]?([A-Za-z0-9+/=]+)/m) || [])[1] || '';
  const fileUrl = (raw.match(/^\s+-?\s*url:\s*['"]?([^\s'"]+)/m) || raw.match(/^\s+url:\s*['"]?([^\s'"]+)/m) || [])[1] || '';
  const sha512 = topSha || fileSha;
  const parsed = {
    version,
    path: filePath || fileUrl,
    sha512,
    files: fileUrl || fileSha ? [{ url: fileUrl || filePath, sha512: fileSha || topSha }] : []
  };
  requireUpdateIntegrity(parsed);
  if (!/^Eidovara-\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?-Windows-x64-Setup\.exe$/i.test(parsed.path)) {
    throw new Error('latest.yml path is not the official Windows installer.');
  }
  return parsed;
}

export function evaluateElectronUpdate(info, currentVersion) {
  const integrity = requireUpdateIntegrity(info);
  const version = String(info?.version || '');
  const decision = shouldOfferUpdate({
    currentVersion,
    candidateVersion: version,
    draft: info?.draft === true,
    prerelease: info?.prerelease === true || isPrerelease(version)
  });
  return {
    configured: true,
    available: decision.offer === true,
    reason: decision.reason || null,
    currentVersion,
    version,
    sha512: integrity.sha512,
    sha256: integrity.sha256,
    path: String(info?.path || info?.files?.[0]?.url || ''),
    notes: String(info?.releaseNotes || info?.releaseName || '').slice(0, 4000)
  };
}

export function honestUpdateError(err) {
  const raw = String(err?.message || err || 'Unknown update error').slice(0, 500);
  if (/ENOTFOUND|ECONN|ETIMEDOUT|ENETUNREACH|offline|network|fetch failed|getaddrinfo/i.test(raw)) {
    return 'Eidovara could not reach GitHub Releases. Nothing was installed. Check the network and try again.';
  }
  if (/sha512|sha-512|sha256|checksum|integrity|digest|hash|metadata is missing/i.test(raw)) {
    return 'Update metadata or checksum was missing or did not match. Eidovara refused to install that file. Builds are Authenticode-unsigned; checksum verification is required.';
  }
  if (/smartscreen|authenticode|publisher|certificate|code.?sign/i.test(raw)) {
    return `This build is Authenticode-unsigned. Windows SmartScreen may warn; that is not a signed update. ${raw}`;
  }
  return raw;
}

function secureUrl(value) {
  const url = new URL(String(value || ''));
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Update URLs must use HTTPS.');
  return url;
}

function trustedReleaseUrl(value) {
  const url = secureUrl(value);
  if (url.hostname !== 'github.com' || !url.pathname.startsWith(OFFICIAL_RELEASE_PREFIX)) {
    throw new Error('Update packages must come from the official GitHub release channel.');
  }
  return url;
}

async function response(url, options = {}) {
  const res = await fetch(secureUrl(url), { redirect: 'follow', ...options });
  if (!res.ok) throw new Error(`Update server returned ${res.status}.`);
  if (res.url) secureUrl(res.url);
  return res;
}

export async function checkForUpdate({ manifestUrl, currentVersion }) {
  if (!manifestUrl) return { configured: false, available: false, currentVersion };
  const res = await response(manifestUrl, { headers: { Accept: 'application/json', 'User-Agent': `Eidovara/${currentVersion}` } });
  const manifest = await boundedJson(res, 1024 * 1024, 'Update manifest');
  const version = String(manifest?.version || '');
  const downloadUrl = trustedReleaseUrl(manifest?.url).toString();
  const sha256 = String(manifest?.sha256 || '').toUpperCase();
  if (!/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) throw new Error('Update manifest has an invalid version.');
  if (!SHA256_HEX.test(sha256)) throw new Error('Update manifest must contain a SHA-256 hash.');
  const extension = path.extname(new URL(downloadUrl).pathname).toLowerCase();
  if (!['.exe', '.zip'].includes(extension)) throw new Error('Update package type is not allowed.');
  const decision = shouldOfferUpdate({
    currentVersion,
    candidateVersion: version,
    draft: manifest?.draft === true,
    prerelease: manifest?.prerelease === true || isPrerelease(version)
  });
  return {
    configured: true,
    available: decision.offer === true,
    reason: decision.reason || null,
    currentVersion,
    version,
    downloadUrl,
    sha256,
    packageType: extension === '.zip' ? 'ready-folder-zip' : 'installer',
    notes: String(manifest.notes || '').slice(0, 4000)
  };
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
  requireUpdateIntegrity(update);
  const res = await response(update.downloadUrl, { headers: { Accept: 'application/octet-stream' } });
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('Update download is too large.');
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error('Update download is too large.');
  const actual = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  if (actual !== update.sha256) throw new Error('Update integrity verification failed.');
  const extension = path.extname(trustedReleaseUrl(update.downloadUrl).pathname).toLowerCase();
  if (!['.exe', '.zip'].includes(extension)) throw new Error('Update package type is not allowed.');
  fs.mkdirSync(directory, { recursive: true });
  const target = path.join(directory, `Eidovara-Update-${update.version}${extension}`);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, bytes, { mode: 0o600 });
  fs.renameSync(tmp, target);
  let internetZoneMarked = false;
  if (process.platform === 'win32') {
    try {
      fs.writeFileSync(`${target}:Zone.Identifier`, '[ZoneTransfer]\r\nZoneId=3\r\nReferrerUrl=https://github.com/ProjectSoulbyTmb/project---soul/\r\n', 'utf8');
      internetZoneMarked = true;
    } catch {}
  }
  return { path: target, bytes: bytes.length, sha256: actual, version: update.version, internetZoneMarked };
}
