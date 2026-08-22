// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH execution bus.
 *
 * dispatch() is the ONLY way tools run. Failsafes, in order of enforcement:
 *  1. master kill switch + broker decision (deny-by-default)
 *  2. per-tool reentrancy guard        -> 'tool-busy'
 *  3. sliding-window rate limits       -> 'rate-limited'   (per-tool + global)
 *  4. consecutive-failure breaker      -> 'circuit-open'    (per-tool cooldown)
 *  5. sanitized, size-capped arguments -> 'args-too-large' / 'invalid-args'
 *  6. hard per-call timeout with timer cleanup
 *  7. result JSON-normalized (strips functions/prototypes) and size-capped
 *  8. every attempt appended to the audit log; handler throws never escape
 */

import { CLASS_ORDER, checkPermission, pushEvent } from './kernel.js';
import { startSpan, endSpan } from '../telemetry.js';

export const MAX_RESULT_BYTES = 16_384;
export const MAX_ARGS_BYTES = 8_192;
export const DEFAULT_TIMEOUT_MS = 2_000;

const RATE_WINDOW_MS = 60_000;
const DEFAULT_TOOL_RATE = 60; // calls/min/tool
const DEFAULT_GLOBAL_RATE = 300; // calls/min across all tools
const BREAKER_THRESHOLD = 5; // consecutive failures before opening
const BREAKER_COOLDOWN_MS = 60_000;

/**
 * @param {object} opts
 * @param {Map<string,{tool:object}>} opts.registry   id -> normalized tool
 * @param {object} opts.state                         migrated THOTH state
 * @param {(tool:string, cls:string)=>boolean|Promise<boolean>} [opts.confirm]
 * @param {{toolRate?:number, globalRate?:number}} [opts.limits]
 */
export function createBus({ registry, state, confirm, limits = {} } = {}) {
  if (!(registry instanceof Map)) throw new Error('THOTH bus requires a tool registry Map.');

  const toolRate = Math.max(1, Number(limits.toolRate) || DEFAULT_TOOL_RATE);
  const globalRate = Math.max(toolRate, Number(limits.globalRate) || DEFAULT_GLOBAL_RATE);

  const hits = new Map(); // key -> timestamps[]   ('<id>' per-tool, '@global')
  const busy = new Set(); // currently executing tool ids
  const failures = new Map(); // id -> {count, openUntil}

  function rateOk(id, now) {
    const windowStart = now - RATE_WINDOW_MS;
    const bump = (key, cap) => {
      let arr = hits.get(key);
      if (!arr) {
        arr = [];
        hits.set(key, arr);
      }
      while (arr.length && arr[0] <= windowStart) arr.shift();
      if (arr.length >= cap) return false;
      arr.push(now);
      return true;
    };
    return bump(id, toolRate) && bump('@global', globalRate);
  }

  function breakerOpen(id, now) {
    const f = failures.get(id);
    if (!f || !f.openUntil) return false;
    if (f.openUntil <= now) {
      failures.delete(id); // cooldown elapsed: half-open trial
      return false;
    }
    return true;
  }

  function recordOutcome(id, ok, now) {
    if (ok) {
      failures.delete(id);
      return;
    }
    const f = failures.get(id) || { count: 0, openUntil: 0 };
    f.count += 1;
    if (f.count >= BREAKER_THRESHOLD) {
      f.openUntil = now + BREAKER_COOLDOWN_MS;
      f.count = 0;
      pushEvent(state, 'thoth.breaker.open', { tool: id, cooldownMs: BREAKER_COOLDOWN_MS });
    }
    failures.set(id, f);
  }

  /** Strip functions/symbols/prototypes via JSON round-trip. */
  function sanitize(value, maxBytes, label) {
    let payload;
    try {
      payload = JSON.stringify(value ?? {});
    } catch {
      return { error: label === 'args' ? 'invalid-args' : 'unserializable-result' };
    }
    if (!payload || payload.length > maxBytes)
      return { error: label === 'args' ? 'args-too-large' : 'result-too-large' };
    return { value: JSON.parse(payload) };
  }

  async function dispatch(toolName, rawArgs = {}, meta = {}) {
    const id = String(toolName || '').trim().toLowerCase();
    const started = Date.now();
    const spanId = startSpan(`thoth.tool.${id}`, { tool: id });

    const finish = (result) => {
      result.durationMs = Date.now() - started;
      endSpan(spanId, { ok: result.ok });
      recordOutcome(id, result.ok === true, Date.now());
      pushEvent(state, result.ok ? 'thoth.tool.ran' : 'thoth.tool.denied-or-failed', {
        tool: id,
        ok: result.ok,
        reason: result.reason || result.error || null,
        ms: result.durationMs,
        routine: meta.routine || null,
      });
      return result;
    };

    const tool = registry.get(id);
    if (!tool) return finish({ ok: false, error: 'unknown-tool' });
    if (busy.has(id)) return finish({ ok: false, error: 'tool-busy' });
    if (!rateOk(id, Date.now())) return finish({ ok: false, error: 'rate-limited' });
    if (breakerOpen(id, Date.now())) return finish({ ok: false, error: 'circuit-open' });

    // Broker decision AFTER cheap rejections but BEFORE any handler effect.
    const decision = checkPermission(state, tool, {
      adminAuthorized: meta.adminAuthorized === true,
      confirm:
        typeof confirm === 'function'
          ? (info) => confirm(info.tool, info.permissionClass)
          : undefined,
    });
    if (!decision.allowed)
      return finish({ ok: false, error: 'permission-denied', reason: decision.reason });

    const cleanArgs = sanitize(rawArgs, MAX_ARGS_BYTES, 'args');
    if (cleanArgs.error) return finish({ ok: false, error: cleanArgs.error });

    busy.add(id);
    let data;
    let timer;
    try {
      const timeoutMs =
        Number(meta.timeoutMs) > 0 ? Math.min(Number(meta.timeoutMs), 30_000) : DEFAULT_TIMEOUT_MS;
      data = await Promise.race([
        Promise.resolve()
          .then(() => tool.handler(cleanArgs.value, { state }))
          .then((v) => v),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('thoth-timeout')), timeoutMs);
        }),
      ]);
    } catch (err) {
      return finish({
        ok: false,
        error: err && err.message === 'thoth-timeout' ? 'timeout' : 'handler-error',
      });
    } finally {
      clearTimeout(timer);
      busy.delete(id);
    }

    const cleanResult = sanitize(data, MAX_RESULT_BYTES, 'result');
    if (cleanResult.error) return finish({ ok: false, error: cleanResult.error });

    return finish({ ok: true, data: cleanResult.value, reason: decision.reason });
  }

  return { dispatch };
}

export { CLASS_ORDER };
