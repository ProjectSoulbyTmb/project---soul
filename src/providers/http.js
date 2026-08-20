function trimSlash(s) { return String(s || '').replace(/\/+$/, ''); }

function validatedEndpoint(endpoint, { localOnly = false } = {}) {
  const url = new URL(String(endpoint || ''));
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!['http:', 'https:'].includes(url.protocol) || (url.protocol !== 'https:' && !loopback)) throw new Error('Endpoints must use HTTPS, except for loopback addresses.');
  if (localOnly && !loopback) throw new Error('The local provider must use a loopback address.');
  return trimSlash(url.toString());
}

export async function callCompatibleProvider({ endpoint, apiKey, model, messages, timeoutMs = 90000 }) {
  if (!endpoint || !model) throw new Error('Endpoint and model are required.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${validatedEndpoint(endpoint)}/chat/completions`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ model, messages, temperature: 0.75 })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || `Model request failed (${res.status}).`);
    const text = body?.choices?.[0]?.message?.content;
    if (!text) throw new Error('The model returned no message content.');
    return String(text).trim();
  } finally { clearTimeout(timer); }
}

export async function callLocalProvider({ endpoint = 'http://127.0.0.1:11434', model, messages, timeoutMs = 120000 }) {
  if (!model) throw new Error('A local model name is required.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${validatedEndpoint(endpoint, { localOnly: true })}/api/chat`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error || `Local model request failed (${res.status}).`);
    const text = body?.message?.content;
    if (!text) throw new Error('The local model returned no message content.');
    return String(text).trim();
  } finally { clearTimeout(timer); }
}
