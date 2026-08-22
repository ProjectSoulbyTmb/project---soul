import test from 'node:test';
import assert from 'node:assert/strict';
import {
  callCompatibleProvider,
  callLocalProvider,
  providerRequestUrl,
} from '../src/providers/http.js';
import {
  isExplicitInternetRequest,
  isLocalWorkspaceIntent,
  classifyWorkspaceIntent,
} from '../src/core/workspace.js';
import { researchInternet } from '../src/providers/internet.js';

test('providerRequestUrl strips duplicate chat suffixes', () => {
  assert.equal(
    providerRequestUrl('https://api.example.test/v1', '/chat/completions'),
    'https://api.example.test/v1/chat/completions'
  );
  assert.equal(
    providerRequestUrl('https://api.example.test/v1/chat/completions', '/chat/completions'),
    'https://api.example.test/v1/chat/completions'
  );
  assert.equal(
    providerRequestUrl('http://127.0.0.1:11434/api/chat', '/api/chat'),
    'http://127.0.0.1:11434/api/chat'
  );
});

test('http providers do not duplicate chat path suffixes', async () => {
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    seen.push({ url: String(url), body: JSON.parse(options.body) });
    return {
      ok: true,
      headers: { get: () => '20' },
      arrayBuffer: async () =>
        Buffer.from(
          JSON.stringify({
            choices: [{ message: { content: 'ok-remote' } }],
            message: { content: 'ok-local' },
          })
        ),
    };
  };
  try {
    const remote = await callCompatibleProvider({
      endpoint: 'https://api.example.test/v1/chat/completions',
      apiKey: 'k',
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
    });
    const local = await callLocalProvider({
      endpoint: 'http://127.0.0.1:11434/api/chat',
      model: 'llama',
      messages: [{ role: 'user', content: 'hi' }],
    });
    assert.equal(remote, 'ok-remote');
    assert.equal(local, 'ok-local');
    assert.equal(seen[0].url, 'https://api.example.test/v1/chat/completions');
    assert.equal(seen[1].url, 'http://127.0.0.1:11434/api/chat');
  } finally {
    globalThis.fetch = original;
  }
});

test('mood mix and app-shelf talk stay local instead of hitting Wikipedia', async () => {
  let called = false;
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    called = true;
    throw new Error('network should not run');
  };
  try {
    assert.equal(
      classifyWorkspaceIntent('Find music that fits my current mood and explain why.'),
      'mood'
    );
    assert.equal(
      isLocalWorkspaceIntent('Find music that fits my current mood and explain why.'),
      true
    );
    assert.equal(
      isExplicitInternetRequest('Find music that fits my current mood and explain why.'),
      false
    );
    assert.equal(
      await researchInternet('Find music that fits my current mood and explain why.'),
      null
    );
    assert.equal(await researchInternet('Find music audio to play about an example'), null);
    assert.equal(
      await researchInternet('Help me add a trusted Windows app from the Start Menu.'),
      null
    );
    assert.equal(called, false);
    assert.equal(
      isExplicitInternetRequest('Search the internet for information and pictures of Saturn'),
      true
    );
  } finally {
    globalThis.fetch = original;
  }
});
