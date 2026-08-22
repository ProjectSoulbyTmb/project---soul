import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeProviderEndpoint,
  callLocalProvider,
  callCompatibleProvider,
  providerRequestUrl,
  LOCAL_PROVIDER_DEFAULT_ENDPOINT,
  LOCAL_PROVIDER_CHAT_PATH,
  COMPATIBLE_PROVIDER_CHAT_PATH
} from '../src/providers/http.js';

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  const body = Buffer.from(JSON.stringify(payload));
  return {
    ok,
    status,
    headers: { get: name => name.toLowerCase() === 'content-length' ? String(body.length) : null },
    arrayBuffer: async () => body
  };
}

test('local endpoints require loopback HTTP(S) and strip a pasted /api/chat path', () => {
  assert.equal(normalizeProviderEndpoint('http://127.0.0.1:11434/api/chat/', { localOnly: true }), LOCAL_PROVIDER_DEFAULT_ENDPOINT);
  assert.equal(normalizeProviderEndpoint('127.0.0.1:11434', { localOnly: true }), LOCAL_PROVIDER_DEFAULT_ENDPOINT);
  assert.equal(normalizeProviderEndpoint('http://localhost:11434', { localOnly: true }), 'http://localhost:11434');
  assert.equal(normalizeProviderEndpoint('http://[::1]:11434/api/chat', { localOnly: true }), 'http://[::1]:11434');
  assert.throws(() => normalizeProviderEndpoint('https://example.test', { localOnly: true }), /loopback/);
  assert.throws(() => normalizeProviderEndpoint('http://192.168.1.5:11434', { localOnly: true }), /loopback/);
  assert.throws(() => normalizeProviderEndpoint('ws://127.0.0.1:11434', { localOnly: true }), /HTTPS|http\(s\)/i);
});

test('compatible endpoints require HTTPS except loopback and strip a pasted /chat/completions path', () => {
  assert.equal(normalizeProviderEndpoint('https://api.example.test/v1/chat/completions'), 'https://api.example.test/v1');
  assert.equal(normalizeProviderEndpoint('http://127.0.0.1:8080/v1'), 'http://127.0.0.1:8080/v1');
  assert.throws(() => normalizeProviderEndpoint('http://api.example.test/v1'), /HTTPS/);
  assert.throws(() => normalizeProviderEndpoint('https://user:pass@api.example.test/v1'), /credentials/);
  assert.throws(() => normalizeProviderEndpoint(''), /required/i);
  assert.equal(normalizeProviderEndpoint('https://api.example.test/v1?api-key=secret'), 'https://api.example.test/v1');
  assert.equal(providerRequestUrl('https://api.example.test/v1?api-key=secret', COMPATIBLE_PROVIDER_CHAT_PATH), 'https://api.example.test/v1/chat/completions');
});

test('providerRequestUrl does not double-append chat suffixes', () => {
  assert.equal(providerRequestUrl('https://api.example.test/v1', COMPATIBLE_PROVIDER_CHAT_PATH), 'https://api.example.test/v1/chat/completions');
  assert.equal(providerRequestUrl('https://api.example.test/v1/chat/completions', COMPATIBLE_PROVIDER_CHAT_PATH), 'https://api.example.test/v1/chat/completions');
  assert.equal(providerRequestUrl('http://127.0.0.1:11434/api/chat', LOCAL_PROVIDER_CHAT_PATH), 'http://127.0.0.1:11434/api/chat');
});

test('local provider posts to /api/chat even when the stored URL already includes that path', async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, opts) => {
    seen.push({ url, body: JSON.parse(opts.body) });
    return jsonResponse({ message: { content: 'local-ok' } });
  };
  try {
    const text = await callLocalProvider({
      endpoint: 'http://127.0.0.1:11434/api/chat',
      model: 'llama3.2',
      messages: [{ role: 'user', content: 'hi' }]
    });
    assert.equal(text, 'local-ok');
    assert.equal(seen[0].url, `${LOCAL_PROVIDER_DEFAULT_ENDPOINT}${LOCAL_PROVIDER_CHAT_PATH}`);
    assert.equal(seen[0].body.stream, false);
    assert.equal(seen[0].body.model, 'llama3.2');
  } finally { globalThis.fetch = original; }
});

test('compatible provider posts to /chat/completions with an optional bearer key', async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, opts) => {
    seen.push({ url, headers: opts.headers, body: JSON.parse(opts.body) });
    return jsonResponse({ choices: [{ message: { content: 'remote-ok' } }] });
  };
  try {
    const text = await callCompatibleProvider({
      endpoint: 'https://api.example.test/v1/chat/completions',
      apiKey: 'secret',
      model: 'gpt-test',
      messages: [{ role: 'user', content: 'hi' }]
    });
    assert.equal(text, 'remote-ok');
    assert.equal(seen[0].url, `https://api.example.test/v1${COMPATIBLE_PROVIDER_CHAT_PATH}`);
    assert.equal(seen[0].headers.Authorization, 'Bearer secret');
    assert.equal(seen[0].body.model, 'gpt-test');
  } finally { globalThis.fetch = original; }
});
