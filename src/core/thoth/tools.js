// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH first-party tools.
 *
 * Every tool is a pure descriptor + handler pair:
 *   { id, title, permissionClass, intents:[...], handler(args, ctx) }
 * Handlers must be deterministic, dependency-free, and bounded. No network,
 * no child processes, no dynamic code evaluation at this tier.
 */

import { checkPermission } from './kernel.js';

/* ------------------------------------------------------------------ *
 * Safe arithmetic evaluator (shunting-yard; never uses eval/Function)
 * ------------------------------------------------------------------ */
const MATH_TOKEN = /\s*(?:(\d+(?:\.\d+)?)|(\*\*|[()+\-*/%]))/y;

export function evaluateArithmetic(input) {
  const src = String(input || '').slice(0, 200);
  const tokens = [];
  let pos = 0;
  while (pos < src.length) {
    if (/^\s+$/.test(src.slice(pos))) break;
    MATH_TOKEN.lastIndex = pos;
    const m = MATH_TOKEN.exec(src);
    if (!m || m.index !== pos) return { ok: false, error: 'invalid-character' };
    tokens.push(m[1] !== undefined ? { t: 'num', v: Number(m[1]) } : { t: 'op', v: m[2] });
    pos = MATH_TOKEN.lastIndex;
  }
  if (!tokens.length) return { ok: false, error: 'empty-expression' };

  const outQ = [];
  const ops = [];
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '**': 3 };
  let prevType = null;

  for (const tok of tokens) {
    if (tok.t === 'num') {
      outQ.push(tok.v);
      prevType = 'num';
    } else if (tok.v === '(') {
      ops.push(tok.v);
      prevType = '(';
    } else if (tok.v === ')') {
      while (ops.length && ops.at(-1) !== '(') outQ.push(ops.pop());
      if (!ops.length) return { ok: false, error: 'unbalanced-parens' };
      ops.pop();
      prevType = 'num'; // closed group behaves like a value
    } else {
      // operator; unary minus becomes 0 - x
      const unaryMinus = tok.v === '-' && (prevType === null || prevType === 'op' || prevType === '(');
      if (unaryMinus) {
        outQ.push(0);
        prevType = 'num';
      }
      while (
        ops.length &&
        ops.at(-1) !== '(' &&
        PREC[ops.at(-1)] >= PREC[tok.v] &&
        tok.v !== '**'
      )
        outQ.push(ops.pop());
      ops.push(tok.v);
      if (!unaryMinus) prevType = 'op';
    }
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === '(') return { ok: false, error: 'unbalanced-parens' };
    outQ.push(op);
  }

  const st = [];
  for (const item of outQ) {
    if (typeof item === 'number') {
      st.push(item);
      continue;
    }
    const b = st.pop();
    const a = st.pop();
    if (a === undefined || b === undefined) return { ok: false, error: 'malformed-expression' };
    switch (item) {
      case '+': st.push(a + b); break;
      case '-': st.push(a - b); break;
      case '*': st.push(a * b); break;
      case '/': if (b === 0) return { ok: false, error: 'division-by-zero' }; st.push(a / b); break;
      case '%': if (b === 0) return { ok: false, error: 'division-by-zero' }; st.push(a % b); break;
      case '**': st.push(a ** b); break;
      default: return { ok: false, error: 'unknown-operator' };
    }
    if (!Number.isFinite(st.at(-1))) return { ok: false, error: 'non-finite-result' };
  }
  if (st.length !== 1) return { ok: false, error: 'malformed-expression' };
  return { ok: true, value: st[0] };
}

/* ------------------------------------------------------------------ *
 * Built-in tool descriptors
 * ------------------------------------------------------------------ */

function systemInfoHandler() {
  return {
    ok: true,
    data: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      uptimeSec: Math.round(process.uptime()),
      memoryRssMb: Math.round(process.memoryUsage().rss / 1048576),
    },
  };
}

function timeNowHandler() {
  const d = new Date();
  return {
    ok: true,
    data: {
      iso: d.toISOString(),
      epochMs: d.getTime(),
      timezoneOffsetMin: d.getTimezoneOffset(),
    },
  };
}

function mathEvaluateHandler(args) {
  const res = evaluateArithmetic(String(args?.expression ?? args?.input ?? args?._rest ?? ''));
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, data: { expression: String(args?.expression ?? ''), result: res.value } };
}

/** L1 demo: appends to an in-kernel scratchpad carried on ctx.state.notes. */
function noteAppendHandler(args, ctx) {
  const text = String(args?.text ?? args?._rest ?? '').trim().slice(0, 500);
  if (!text) return { ok: false, error: 'empty-note' };
  if (!Array.isArray(ctx.state.notes)) ctx.state.notes = [];
  ctx.state.notes.push({ at: new Date().toISOString(), text });
  if (ctx.state.notes.length > 200) ctx.state.notes.splice(0, ctx.state.notes.length - 200);
  return { ok: true, data: { stored: true, total: ctx.state.notes.length } };
}

export const BUILTIN_TOOLS = [
  {
    id: 'system.info',
    title: 'Local runtime snapshot',
    summary: 'Platform, Node version, uptime, and RSS for this process only.',
    permissionClass: 'L0',
    intents: ['system info', 'info'],
    handler: systemInfoHandler,
  },
  {
    id: 'time.now',
    title: 'Current time',
    summary: 'Local clock reading as ISO string and epoch milliseconds.',
    permissionClass: 'L0',
    intents: ['time', 'now'],
    handler: timeNowHandler,
  },
  {
    id: 'math.evaluate',
    title: 'Safe calculator',
    summary: 'Evaluates bounded arithmetic without dynamic code evaluation.',
    permissionClass: 'L0',
    intents: ['calc', 'math'],
    handler: mathEvaluateHandler,
  },
  {
    id: 'note.append',
    title: 'Scratchpad note',
    summary: 'Appends a short local note kept in THOTH state on this device.',
    permissionClass: 'L1',
    intents: ['note'],
    handler: noteAppendHandler,
  },
];

/** Normalize descriptors and freeze the catalog shape. */
export function normalizeTool(def) {
  if (!def || typeof def !== 'object') throw new Error('Tool must be an object.');
  const id = String(def.id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 64);
  if (!id) throw new Error('Tool id is required.');
  if (typeof def.handler !== 'function') throw new Error(`Tool ${id} needs a handler function.`);
  const permissionClass = ['L0', 'L1', 'L2'].includes(def.permissionClass)
    ? def.permissionClass
    : 'L1';
  return {
    id,
    title: String(def.title || id).slice(0, 80),
    summary: String(def.summary || '').slice(0, 280),
    permissionClass,
    intents: Array.isArray(def.intents)
      ? def.intents.map((s) => String(s).toLowerCase().trim()).filter(Boolean).slice(0, 8)
      : [],
    handler: def.handler,
  };
}

export { checkPermission };
