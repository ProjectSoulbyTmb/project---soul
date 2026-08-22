// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  codeMetricsHandler,
  makeDnsLookupHandler,
  makeHttpProbeHandler,
  SOFTWARE_TOOLS,
} from '../src/core/thoth/software.js';
import { createThothKernel } from '../src/core/thoth/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ code.metrics ------------------------------ */

const FIXTURE = `// sample module
function add(a, b) {
  return a + b;
}

function risky(input) {
  if (!input) return null;
  const el = document.querySelector('#x');
  el.innerHTML = input; // smell
  eval(input);          // bigger smell
  return el;
}
`;

test('code.metrics reports size, depth, functions, and detected smells', () => {
  const out = codeMetricsHandler({ source: FIXTURE });
  assert.equal(out.ok, true);
  assert.equal(out.data.smells.includes('dynamic-eval'), true);
  assert.equal(out.data.smells.includes('raw-html-sink'), true);
  assert.ok(out.data.maxBraceDepth >= 2);
  assert.ok(out.data.functions >= 2);
  assert.ok(out.data.sloc > 5 && out.data.sloc < 20);
  assert.equal(typeof out.data.commentRatio, 'number');
});

test('code.metrics rejects empty and oversized sources without throwing', () => {
  assert.equal(codeMetricsHandler({ source: '   ' }).error, 'empty-source');
  const huge = { source: 'x'.repeat(200_001) };
  assert.equal(codeMetricsHandler(huge).error, 'source-too-large');
});

/* ------------------------------ net.dns (faked) ------------------------------ */

const fakeDnsOk = {
  resolve4: async () => ['93.184.216.34'],
  resolve6: async () => [],
  resolveCname: async () => Promise.reject(new Error('NOERROR-ish')),
};

test('dns handler returns records shape on success', async () => {
  const handler = makeDnsLookupHandler(fakeDnsOk);
  const out = await handler({ host: 'example.com' });
  assert.equal(out.ok, true);
  assert.deepEqual(out.data.records.A, ['93.184.216.34']);
  assert.ok(out.data.resolvedInMs >= 0);
});

test('dns handler reports no-records when everything fails, rejects bad hosts', async () => {
  const fail = {
    resolve4: () => Promise.reject(new Error('NXDOMAIN')),
    resolve6: () => Promise.reject(new Error('NXDOMAIN')),
    resolveCname: () => Promise.reject(new Error('NXDOMAIN')),
  };
  const none = await makeDnsLookupHandler(fail)({ host: 'missing.example' });
  assert.equal(none.error, 'no-records');

  for (const bad of ['', 'not a host', '-leading-dash.example', `${'a'.repeat(300)}.com`]) {
    const out = await makeDnsLookupHandler(fakeDnsOk)({ host: bad });
    assert.equal(out.error, 'invalid-hostname', bad);
  }
});

/* ------------------------------ net.http-probe (faked) ------------------------------ */

function fakeResponse({ status = 200, contentType = 'text/html', server = 'nginx' } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k) => ({ 'content-type': contentType, server }[k.toLowerCase()] ?? null) },
    body: {
      getReader() {
        let done = false;
        return {
          read: async () => {
            if (done) return { done: true };
            done = true;
            return { done: false, value: new TextEncoder().encode('<html>secret</html>') };
          },
          cancel: async () => {},
        };
      },
    },
  };
}

test('http probe enforces HTTPS and refuses credentials in URL', async () => {
  const handler = makeHttpProbeHandler({ fetch: async () => fakeResponse() });

  const insecure = await handler({ url: 'http://example.com/x' });
  assert.equal(insecure.error, 'https-required');

  const credentialed = await handler({ url: 'https://user:pass@example.com/' });
  assert.equal(credentialed.error, 'credentials-not-allowed');

  assert.equal((await handler({ url: 'not-a-url' })).error, 'invalid-url');
});

test('http probe returns metadata only - never body content - with timing', async () => {
  const handler = makeHttpProbeHandler({ fetch: async () => fakeResponse({ status: 204 }) });
  const out = await handler({ url: 'https://example.com/health' });
  assert.equal(out.ok, true);
  assert.equal(out.data.status, 204);
  assert.equal(out.data.bytesSeen, 15); // '<html>secret</html>' drained but not exposed
  assert.equal(JSON.stringify(out).includes('secret'), false);
  assert.ok(out.data.probedInMs >= 0);
});

test('http probe classifies aborts as timeout and other failures as unreachable', async () => {
  const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
  const timeout = await makeHttpProbeHandler({
    fetch: () => sleep(20).then(() => Promise.reject(abortErr)),
  })({ url: 'https://slow.example' });
  assert.equal(timeout.error, 'timeout');

  const dead = await makeHttpProbeHandler({
    fetch: () => Promise.reject(new Error('ECONNREFUSED')),
  })({ url: 'https://dead.example' });
  assert.equal(dead.error, 'unreachable');
});

/* ------------------- kernel integration + L1 gating ------------------- */

test('graduate tools register automatically; network stays L1-gated', async () => {
  const k = createThothKernel({});
  const ids = k.listTools().map((t) => t.id);
  assert.ok(ids.includes('code.metrics'));
  assert.ok(ids.includes('net.dns'));
  assert.ok(ids.includes('net.http-probe'));

  // L0 metrics runs immediately.
  const metrics = await k.runTool('code.metrics', { source: 'function a(){return 1}' });
  assert.equal(metrics.ok, true);

  // L1 dns is denied until confirmed or granted.
  const denied = await k.runTool('net.dns', { host: 'example.com' });
  assert.equal(denied.error, 'permission-denied');
  assert.equal(denied.reason, 'no-grant');
});

test('standing L1 grant unlocks network tool through the full bus path', async () => {
  const k = createThothKernel({});
  k.grant('net.dns', 'L1');
  // Swap in fake services so the test never touches the real resolver.
  const tool = k.registry.get('net.dns');
  const original = tool.handler;
  tool.handler = makeDnsLookupHandler(fakeDnsOk);
  try {
    const out = await k.runTool('net.dns', { host: 'example.com' });
    assert.equal(out.ok, true);
    assert.equal(out.reason, 'standing-grant');
  } finally {
    tool.handler = original;
  }
});
