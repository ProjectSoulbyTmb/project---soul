// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  defaultThothState,
  checkPermission,
  setStandingGrant,
  setToolEnabled,
  defineRoutine,
} from '../src/core/thoth/kernel.js';
import { evaluateArithmetic, BUILTIN_TOOLS, normalizeTool } from '../src/core/thoth/tools.js';
import { validateManifest } from '../src/core/thoth/manifest.js';
import { createBus, MAX_RESULT_BYTES } from '../src/core/thoth/bus.js';
import { createThothKernel, attachToEngine } from '../src/core/thoth/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------ arithmetic ------------------------------ */

test('safe arithmetic evaluates precedence, parens, unary minus, and power', () => {
  assert.equal(evaluateArithmetic('2+3*4').value, 14);
  assert.equal(evaluateArithmetic('(2+3)*4').value, 20);
  assert.equal(evaluateArithmetic('-3+5').value, 2);
  assert.equal(evaluateArithmetic('2**10').value, 1024);
  assert.equal(evaluateArithmetic('10%3').value, 1);
});

test('safe arithmetic rejects malformed input without throwing', () => {
  for (const bad of ['2+(3', '2+)', 'abc', '2;rm -rf', '1/0', '']) {
    assert.equal(evaluateArithmetic(bad).ok, false, bad);
  }
});

/* ------------------------------ broker ------------------------------ */

const L0 = { id: 'a.b', permissionClass: 'L0' };
const L1 = { id: 'c.d', permissionClass: 'L1' };
const L2 = { id: 'e.f', permissionClass: 'L2' };

test('broker is deny-by-default and honors class rules', () => {
  const s = defaultThothState();
  assert.equal(checkPermission(s, L0).allowed, true);
  assert.equal(checkPermission(s, L1).allowed, false);
  assert.equal(checkPermission(s, L1, { confirm: () => true }).allowed, true);
  assert.equal(checkPermission(s, L1, { confirm: () => false }).allowed, false);
  assert.equal(checkPermission(s, L2, {}).allowed, false);
  assert.equal(checkPermission(s, L2, { adminAuthorized: true }).allowed, true);
});

test('standing grants authorize matching-or-lower classes and can expire', async () => {
  const s = defaultThothState();
  setStandingGrant(s, 'c.d', 'L1', { ttlMs: 30 });
  assert.equal(checkPermission(s, L1).reason, 'standing-grant');
  await sleep(40);
  assert.equal(checkPermission(s, L1).allowed, false);

  setStandingGrant(s, 'e.f', 'L2');
  // An L2 standing grant does not bypass the admin gate itself.
  assert.equal(checkPermission(s, L2, {}).allowed, false);
  assert.equal(checkPermission(s, L2, { adminAuthorized: true }).allowed, true);
});

test('revoking grants and disabling tools blocks execution paths', () => {
  const s = defaultThothState();
  setStandingGrant(s, 'c.d', 'L1');
  assert.equal(setStandingGrant(s, 'c.d', null), null);
  assert.equal(checkPermission(s, L1).allowed, false);

  setToolEnabled(s, 'a.b', false);
  assert.equal(checkPermission(s, L0).allowed, false, 'disabled tool blocks even L0');
});

/* ------------------------------ bus ------------------------------ */

function makeRegistry(extra = []) {
  const reg = new Map();
  for (const def of [...BUILTIN_TOOLS, ...extra]) reg.set(def.id, normalizeTool(def));
  return reg;
}

test('bus dispatches allowed tools with capped, logged results', async () => {
  const state = defaultThothState();
  const bus = createBus({ registry: makeRegistry(), state });
  const out = await bus.dispatch('time.now', {});
  assert.equal(out.ok, true);
  assert.ok(out.durationMs >= 0);
  assert.ok(typeof out.data.epochMs === 'number');
  assert.ok(state.log.some((e) => e.type === 'thoth.tool.ran'));
});

test('bus fails closed on unknown tool, denial, timeout, and oversized output', async () => {
  const state = defaultThothState();
  const big = normalizeTool({
    id: 'x.big',
    permissionClass: 'L0',
    handler: () => ({ blob: 'x'.repeat(MAX_RESULT_BYTES + 1) }),
  });
  const slow = normalizeTool({
    id: 'x.slow',
    permissionClass: 'L0',
    handler: () => sleep(80),
  });
  const registry = makeRegistry([big, slow]);
  const bus = createBus({ registry, state });

  assert.equal((await bus.dispatch('nope.nope', {})).error, 'unknown-tool');

  setToolEnabled(state, 'time.now', false);
  assert.equal((await bus.dispatch('time.now', {})).reason, 'tool-disabled');
  setToolEnabled(state, 'time.now', true);

  const slowOut = await bus.dispatch('x.slow', {}, { timeoutMs: 15 });
  assert.equal(slowOut.error, 'timeout');

  assert.equal((await bus.dispatch('x.big', {})).error, 'result-too-large');
});

/* ------------------------------ routines ------------------------------ */

test('routines validate limits, dry-run safely, and stop on failure by default', async () => {
  const state = defaultThothState();

  assert.throws(() => defineRoutine(state, 'r1', []));
  assert.throws(() => defineRoutine(state, 'r1', Array(25).fill({ tool: 'time.now' })));

  defineRoutine(state, 'morning', [{ tool: 'time.now' }, { tool: 'math.evaluate', args: { expression: '1+1' } }]);

  const kernel = createThothKernel({ state });
  const dryRun = await kernel.runRoutine('morning', { dryRun: true });
  assert.equal(dryRun.ok, true);
  assert.equal(dryRun.results.every((r) => r.dryRun === true), true);
  assert.equal(state.routines.morning.runCount, 0);

  const live = await kernel.runRoutine('morning', { dryRun: false });
  assert.equal(live.ok, true);
  assert.equal(state.routines.morning.runCount, 1);
});

/* ------------------------------ manifest ------------------------------ */

test('manifest v2 validation accepts a correct contract and rejects drift', () => {
  const good = validateManifest({
    id: 'sample.plugin',
    version: '1.0.0',
    permissions: ['L1'],
    tools: [{ id: 'sample.write', permissionClass: 'L1', entry: 'writeNote', intents: ['jot'] }],
    routines: [{ id: 'daily', steps: [1] }],
  });
  assert.equal(good.ok, true);
  assert.equal(good.manifest.tools[0].intents[0], 'jot');

  const bad = validateManifest({
    id: 'Bad ID!',
    version: 'not-semver',
    permissions: [],
    tools: [
      { id: 'sample.write', permissionClass: 'L9', entry: 'x' },
      { id: 'sample.write', permissionClass: 'L1', entry: 'x' },
    ],
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.length >= 4);
});

/* ------------------------------ engine integration ------------------------------ */

function makeFakeEngine() {
  let providerCalls = 0;
  const state = defaultThothState();
  const engine = {
    state: {
      ...state,
      thoth: undefined,
      conversations: [{ id: 'main', messages: [], updatedAt: null }],
      activeConversationId: 'main',
      audit: [],
    },
    activeConversation() {
      return this.state.conversations[0];
    },
    async respond() {
      providerCalls += 1;
      return { reply: 'provider-reply' };
    },
  };
  return { engine, calls: () => providerCalls };
}

test('attachToEngine routes thoth commands before providers and records turns', async () => {
  const { engine, calls } = makeFakeEngine();
  attachToEngine(engine);

  const out = await engine.respond('thoth calc (2+3)*4');
  assert.equal(out.thoth.ok, true);
  assert.equal(out.thoth.data.result, 20);
  assert.match(out.reply, /deterministic software/i);
  assert.equal(calls(), 0, 'providers must not run for THOTH commands');

  const conv = engine.activeConversation();
  assert.equal(conv.messages.at(-2).role, 'user');
  assert.equal(conv.messages.at(-1).thoth, true);
  assert.ok(engine.state.audit.some((a) => a.type === 'thoth.command'));
});

test('non-thoth traffic passes through untouched and attach is idempotent', async () => {
  const { engine, calls } = makeFakeEngine();
  const first = attachToEngine(engine);
  const again = attachToEngine(engine);
  assert.equal(first, again);

  const out = await engine.respond('hello there');
  assert.equal(out.reply, 'provider-reply');
  assert.equal(calls(), 1);
});

test('help listing stays honest about what THOTH is', async () => {
  const k = createThothKernel({});
  const res = await k.handleCommand({ help: true });
  assert.match(res.reply, /THOTH tools on this device/);
  assert.doesNotMatch(res.reply, /alive|sentient|self-aware|feelings/i);
});

/* ------------------------------ failsafes ------------------------------ */

test('L2 cannot be held as a standing grant (elevation is per-call only)', () => {
  const s = defaultThothState();
  assert.throws(() => setStandingGrant(s, 'e.f', 'L2'), /per-call/);
  assert.ok(s.log.some((e) => e.type === 'thoth.grant.refused'));
});

test('emergency stop disables the kernel and clears every standing grant', async () => {
  const k = createThothKernel({});
  k.grant('note.append', 'L1');
  const out = k.stop('drill');
  assert.equal(out.revoked >= 1, true);
  assert.equal(k.state.masterEnabled, false);
  assert.ok(!Object.values(k.state.tools).some((t) => t.standingClass));
  const res = await k.runTool('time.now', {});
  assert.equal(res.error, 'permission-denied'); // broker rejects via master flag
  assert.equal(res.reason, 'thoth-disabled');
});

test('env kill switch forces masterEnabled off regardless of stored state', () => {
  const s = defaultThothState();
  s.masterEnabled = true;
  const prev = process.env.EIDOVARA_THOTH_DISABLED;
  process.env.EIDOVARA_THOTH_DISABLED = '1';
  try {
    const k = createThothKernel({ state: s });
    assert.equal(k.state.masterEnabled, false);
  } finally {
    if (prev === undefined) delete process.env.EIDOVARA_THOTH_DISABLED;
    else process.env.EIDOVARA_THOTH_DISABLED = prev;
  }
});

test('bus enforces per-tool rate limits', async () => {
  const state = defaultThothState();
  const bus = createBus({ registry: makeRegistry(), state, limits: { toolRate: 2, globalRate: 100 } });
  assert.equal((await bus.dispatch('time.now', {})).ok, true);
  assert.equal((await bus.dispatch('time.now', {})).ok, true);
  assert.equal((await bus.dispatch('time.now', {})).error, 'rate-limited');
  // A different tool still passes under its own bucket.
  assert.equal((await bus.dispatch('system.info', {})).ok, true);
});

test('circuit breaker opens after consecutive failures and logs the trip', async () => {
  const state = defaultThothState();
  const flaky = normalizeTool({
    id: 'x.flaky',
    permissionClass: 'L0',
    handler: () => {
      throw new Error('boom');
    },
  });
  const bus = createBus({ registry: makeRegistry([flaky]), state });
  for (let i = 0; i < 5; i += 1) await bus.dispatch('x.flaky', {});
  const out = await bus.dispatch('x.flaky', {});
  assert.equal(out.error, 'circuit-open');
  assert.ok(state.log.some((e) => e.type === 'thoth.breaker.open'));
});

test('oversized or non-serializable arguments fail closed before handlers run', async () => {
  let ran = false;
  const spy = normalizeTool({
    id: 'x.spy',
    permissionClass: 'L0',
    handler: () => {
      ran = true;
      return { ok: 1 };
    },
  });
  const bus = createBus({ registry: makeRegistry([spy]), state: defaultThothState() });

  const big = await bus.dispatch('x.spy', { blob: 'y'.repeat(9000) });
  assert.equal(big.error, 'args-too-large');
  assert.equal(ran, false);

  const circular = {};
  circular.self = circular;
  assert.equal((await bus.dispatch('x.spy', circular)).error, 'invalid-args');
  assert.equal(ran, false);
});

test('returned data is JSON-normalized: functions and prototypes are stripped', async () => {
  const dirty = normalizeTool({
    id: 'x.dirty',
    permissionClass: 'L0',
    handler: () => {
      const o = { safe: 1 };
      o.fn = () => 'nope';
      return o;
    },
  });
  const bus = createBus({ registry: makeRegistry([dirty]), state: defaultThothState() });
  const out = await bus.dispatch('x.dirty', {});
  assert.equal(out.ok, true);
  assert.deepEqual(Object.keys(out.data), ['safe']);
});

test('reentrant dispatch of a running tool is rejected as busy', async () => {
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  const holds = normalizeTool({
    id: 'x.hold',
    permissionClass: 'L0',
    handler: () => gate,
  });
  const bus = createBus({ registry: makeRegistry([holds]), state: defaultThothState() });
  const first = bus.dispatch('x.hold', {});
  await sleep(5);
  const second = await bus.dispatch('x.hold', {});
  assert.equal(second.error, 'tool-busy');
  release();
  assert.equal((await first).ok, true);
});

test('routine preflight refuses unknown tools and unelevated L2 steps up front', async () => {
  const k = createThothKernel({});
  assert.throws(() => k.defineRoutine('bad1', [{ tool: 'ghost.tool' }]));

  const adminTool = k.register({
    id: 'z.elevated',
    title: 'Elevated demo',
    permissionClass: 'L2',
    intents: [],
    handler: () => ({ ok: true }),
  });
  k.defineRoutine('needs-admin', [{ tool: adminTool }]);
  const refused = await k.runRoutine('needs-admin', { dryRun: false });
  assert.equal(refused.error, 'admin-required');

  const allowed = await k.runRoutine('needs-admin', { dryRun: false, adminAuthorized: true });
  assert.equal(allowed.ok, true);
});
