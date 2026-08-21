// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
function trimSlash(s) { return String(s || '').replace(/\/+$/, ''); }

function isLoopbackHost(hostname) {
  const host = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export const SERVICE_HEALTH_PATH = '/health';
export const SERVICE_HEALTH_V1_PATH = '/v1/health';
export const SERVICE_CONFIG_PATH = '/v1/config';
export const SERVICE_STATUS_PATH = '/v1/status';
export const SERVICE_ASSIST_PATH = '/v1/assist';
/** Official first-party custom hostname for Worker eidovara-api. HTTPS origin only; callers append paths. */
export const DEFAULT_EIDOVARA_SERVICE_BASE = 'https://api.eidovara.org';
const STRIP_SUFFIXES = [SERVICE_HEALTH_V1_PATH, SERVICE_HEALTH_PATH, SERVICE_CONFIG_PATH, SERVICE_STATUS_PATH, SERVICE_ASSIST_PATH];

export function normalizeServiceUrl(value) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) raw = `https://${raw}`;
  let url;
  try { url = new URL(raw); } catch { throw new Error('Service URL must be an http(s) URL.'); }
  if (url.username || url.password) throw new Error('Service URL must not include credentials.');
  const loopback = isLoopbackHost(url.hostname);
  if (!['http:', 'https:'].includes(url.protocol) || (url.protocol !== 'https:' && !loopback)) {
    throw new Error('Service URL must use HTTPS, except for loopback addresses.');
  }
  let path = trimSlash(url.pathname || '');
  for (const suffix of STRIP_SUFFIXES) {
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    path = trimSlash(path.replace(new RegExp(`${escaped}$`, 'i'), ''));
  }
  return trimSlash(`${url.origin}${path}`);
}

export function resolveServiceBase(value) {
  const raw = String(value || '').trim();
  return normalizeServiceUrl(raw || DEFAULT_EIDOVARA_SERVICE_BASE);
}

export function serviceRequestUrl(base, suffix) {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${normalizeServiceUrl(base)}${path}`;
}

export function httpsOnlyUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return url.toString();
  } catch { return ''; }
}

export function checkoutEnabledFromRemoteConfig(_body) {
  return false;
}

export function sanitizeRemoteConfig(body) {
  const raw = body && typeof body === 'object' ? body : {};
  return {
    version: String(raw.version || '').slice(0, 40),
    website: httpsOnlyUrl(raw.website),
    paymentsEnabled: false,
    checkoutEnabled: false,
    ageRestricted: raw.ageRestricted === true,
    minimumAge: 18,
    authenticodeSigned: false,
    officialPlatforms: Array.isArray(raw.officialPlatforms) ? raw.officialPlatforms.map(item => String(item).slice(0, 80)).slice(0, 8) : [],
    localFirst: true,
    conversationsStored: false
  };
}

async function boundedJson(res, maxBytes = 32_768) {
  const declared = Number(res.headers.get?.('content-length') || 0);
  if (declared > maxBytes) throw new Error('Service response is too large.');
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error('Service response is too large.');
  try { return JSON.parse(bytes.toString('utf8')); } catch { throw new Error('Service response was not JSON.'); }
}

async function getJson(fetchImpl, url, signal) {
  const res = await fetchImpl(url, { method: 'GET', signal, redirect: 'error', headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Service returned HTTP ${res.status}.`);
  return boundedJson(res);
}

const offlineOk = extra => ({
  configured: false,
  online: false,
  paymentsEnabled: false,
  checkoutEnabled: false,
  website: '',
  service: '',
  version: '',
  localFirst: true,
  conversationsStored: false,
  lastCheckedAt: new Date().toISOString(),
  ...extra
});

export async function fetchServiceSnapshot({ base, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const raw = String(base || '').trim();
  if (!raw) return offlineOk();
  let normalized;
  try { normalized = normalizeServiceUrl(raw); } catch (err) {
    return offlineOk({ error: String(err?.message || err) });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [healthV1Result, healthResult, configResult, statusResult] = await Promise.allSettled([
      getJson(fetchImpl, serviceRequestUrl(normalized, SERVICE_HEALTH_V1_PATH), controller.signal),
      getJson(fetchImpl, serviceRequestUrl(normalized, SERVICE_HEALTH_PATH), controller.signal),
      getJson(fetchImpl, serviceRequestUrl(normalized, SERVICE_CONFIG_PATH), controller.signal),
      getJson(fetchImpl, serviceRequestUrl(normalized, SERVICE_STATUS_PATH), controller.signal)
    ]);
    const health = (healthV1Result.status === 'fulfilled' ? healthV1Result.value : null)
      || (healthResult.status === 'fulfilled' ? healthResult.value : null);
    const config = sanitizeRemoteConfig(configResult.status === 'fulfilled' ? configResult.value : null);
    const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
    const healthOk = Boolean(health && (health.status === 'ok' || healthV1Result.status === 'fulfilled' || healthResult.status === 'fulfilled'));
    const online = Boolean(healthOk && configResult.status === 'fulfilled' && statusResult.status === 'fulfilled' && (health?.status === 'ok' || status?.status === 'ok'));
    const failure = [healthV1Result, healthResult, configResult, statusResult].find(item => item.status === 'rejected');
    const error = online ? '' : String(failure?.reason?.message || 'Eidovara service is unreachable. Offline Soul continues locally.');
    return {
      configured: true,
      online,
      paymentsEnabled: false,
      checkoutEnabled: checkoutEnabledFromRemoteConfig(configResult.status === 'fulfilled' ? configResult.value : null),
      service: String(health?.service || status?.service || 'Eidovara').slice(0, 100),
      version: String(health?.version || config.version || status?.version || '').slice(0, 40),
      website: config.website,
      ageRestricted: config.ageRestricted,
      minimumAge: config.minimumAge,
      localFirst: true,
      conversationsStored: false,
      lastCheckedAt: new Date().toISOString(),
      error: error.slice(0, 300)
    };
  } catch (err) {
    return offlineOk({
      configured: true,
      error: String(err?.name === 'AbortError' ? 'Eidovara service timed out. Offline Soul continues locally.' : (err?.message || err)).slice(0, 300)
    });
  } finally {
    clearTimeout(timer);
  }
}
