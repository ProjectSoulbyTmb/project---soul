// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { normalizeServiceUrl, serviceRequestUrl, SERVICE_ASSIST_PATH } from './service.js';

export const ASSIST_MAX_BYTES = 32768;
export const ASSIST_MAX_QUERY = 800;

export function defaultSoulOnline() {
  return { assistOptIn: false };
}

export function normalizeSoulOnline(input = {}, prev = defaultSoulOnline()) {
  const prior = { ...defaultSoulOnline(), ...(prev && typeof prev === 'object' ? prev : {}) };
  return {
    assistOptIn:
      input.assistOptIn === undefined ? prior.assistOptIn === true : Boolean(input.assistOptIn),
  };
}

export function canCallAssist({ optIn, serviceUrl } = {}) {
  if (optIn !== true) return { ok: false, reason: 'opt-in-off' };
  if (!String(serviceUrl || '').trim()) return { ok: false, reason: 'no-service' };
  try {
    normalizeServiceUrl(serviceUrl);
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) };
  }
  return { ok: true };
}

async function boundedJson(res, maxBytes = ASSIST_MAX_BYTES) {
  const declared = Number(res.headers?.get?.('content-length') || 0);
  if (declared > maxBytes) throw new Error('Assist response is too large.');
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error('Assist response is too large.');
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('Assist response was not JSON.');
  }
}

export async function requestSoulAssist({
  base,
  query,
  optIn = false,
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000,
} = {}) {
  const gate = canCallAssist({ optIn, serviceUrl: base });
  if (!gate.ok) {
    return {
      ok: false,
      skipped: true,
      reason: gate.reason,
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  }
  const q = String(query || '')
    .trim()
    .slice(0, ASSIST_MAX_QUERY);
  if (!q)
    return {
      ok: false,
      skipped: false,
      reason: 'empty',
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  let url;
  try {
    url = serviceRequestUrl(base, SERVICE_ASSIST_PATH);
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      reason: String(err?.message || err),
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  }
  const payload = JSON.stringify({ query: q, mode: 'help' });
  if (payload.length > ASSIST_MAX_BYTES) {
    return {
      ok: false,
      skipped: false,
      reason: 'too_large',
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  }
  if (!fetchImpl)
    return {
      ok: false,
      skipped: false,
      reason: 'no-fetch',
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      signal: controller.signal,
      redirect: 'error',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: payload,
    });
    if (!res.ok) throw new Error(`Assist returned HTTP ${res.status}.`);
    const body = await boundedJson(res);
    return {
      ok: true,
      skipped: false,
      reply: String(body?.reply || '').slice(0, 8000),
      assist: true,
      soul: false,
      conversationsSent: false,
      warning:
        'This is your Worker helper — not Soul, not a cloud mind, and not this conversation.',
    };
  } catch (err) {
    const timeout = err?.name === 'AbortError';
    return {
      ok: false,
      skipped: false,
      reason: String(
        timeout
          ? 'Eidovara assist timed out. Local Soul continues on this PC.'
          : err?.message || err
      ).slice(0, 300),
      assist: true,
      soul: false,
      conversationsSent: false,
    };
  } finally {
    clearTimeout(timer);
  }
}
