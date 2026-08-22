// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
function trimSlash(s) { return String(s || '').replace(/\/+$/, ''); }

export const LOCAL_PROVIDER_DEFAULT_ENDPOINT = 'http://127.0.0.1:11434';
export const LOCAL_PROVIDER_CHAT_PATH = '/api/chat';
export const COMPATIBLE_PROVIDER_CHAT_PATH = '/chat/completions';

function isLoopbackHost(hostname) {
  const host = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function normalizeProviderEndpoint(endpoint, { localOnly = false, loopbackOnly = false } = {}) {
  let raw = String(endpoint || '').trim();
  if (!raw) throw new Error('Endpoint is required.');
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) raw = `http://${raw}`;
  let url;
  try { url = new URL(raw); } catch { throw new Error('Endpoint must be an http(s) URL.'); }
  if (url.username || url.password) throw new Error('Provider endpoint must not include credentials.');
  const loopback = isLoopbackHost(url.hostname);
  if (!['http:', 'https:'].includes(url.protocol) || (url.protocol !== 'https:' && !loopback)) {
    throw new Error('Endpoints must use HTTPS, except for loopback addresses.');
  }
  if ((localOnly || loopbackOnly) && !loopback) throw new Error('The local provider must use a loopback address.');
  let path = trimSlash(url.pathname || '');
  if (localOnly || loopbackOnly) path = path.replace(/\/api\/chat$/i, '');
  else path = path.replace(/\/chat\/completions$/i, '');
  path = trimSlash(path);
  return trimSlash(`${url.origin}${path}`);
}

export function providerRequestUrl(endpoint, suffix) {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  const localOnly = path === LOCAL_PROVIDER_CHAT_PATH;
  return `${normalizeProviderEndpoint(endpoint, { localOnly })}${path}`;
}

export function validatedEndpoint(endpoint, { localOnly = false, loopbackOnly = false } = {}) {
  return normalizeProviderEndpoint(endpoint, { localOnly: localOnly || loopbackOnly, loopbackOnly });
}

export async function callCompatibleProvider({ endpoint, apiKey, model, messages, timeoutMs = 90000 }) {
  if (!endpoint || !model) throw new Error('Endpoint and model are required.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${normalizeProviderEndpoint(endpoint)}${COMPATIBLE_PROVIDER_CHAT_PATH}`, {
      method: 'POST', signal: controller.signal,
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, messages, temperature: 0.75 })
    });
    const body = await boundedJson(res);
    if (!res.ok) throw new Error(body?.error?.message || `Model request failed (${res.status}).`);
    const text = body?.choices?.[0]?.message?.content;
    if (!text) throw new Error('The model returned no message content.');
    return String(text).trim();
  } finally { clearTimeout(timer); }
}

export async function callLocalProvider({ endpoint = LOCAL_PROVIDER_DEFAULT_ENDPOINT, model, messages, timeoutMs = 120000 }) {
  if (!model) throw new Error('A local model name is required.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${normalizeProviderEndpoint(endpoint, { localOnly: true })}${LOCAL_PROVIDER_CHAT_PATH}`, {
      method: 'POST', signal: controller.signal,
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });
    const body = await boundedJson(res);
    if (!res.ok) throw new Error(body?.error || `Local model request failed (${res.status}).`);
    const text = body?.message?.content;
    if (!text) throw new Error('The local model returned no message content.');
    return String(text).trim();
  } finally { clearTimeout(timer); }
}

async function boundedJson(res, maxBytes = 5 * 1024 * 1024) {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('Provider response is too large.');
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error('Provider response is too large.');
  try { return JSON.parse(bytes.toString('utf8')); } catch { return {}; }
}

