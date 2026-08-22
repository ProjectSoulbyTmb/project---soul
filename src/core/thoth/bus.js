// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH execution bus.
 *
 * dispatch() is the ONLY way tools run. Fail-closed guarantees:
 *  - broker decision first (deny-by-default),
 *  - hard per-call timeout,
 *  - serialized output capped at MAX_RESULT_BYTES,
 *  - every attempt appended to the audit log,
 *  - handler exceptions become structured errors, never thrown raw.
 */

import {
  CLASS_ORDER,
  checkPermission,
  pushEvent,
} from './kernel.js';
import { startSpan, endSpan } from '../telemetry.js';

export const MAX_RESULT_BYTES = 16_384;
export const DEFAULT_TIMEOUT_MS = 2_000;

/**
 * @param {object} opts
 * @param {Map<string,{tool:object}>} opts.registry   id -> normalized tool
 * @param {object} opts.state                         migrated THOTH state
 * @param {(toolId:string, args:object, meta:object) => Promise<any>} [opts.confirm]
 */
export function createBus({ registry, state, confirm } = {}) {
  if (!(registry instanceof Map)) throw new Error('THOTH bus requires a tool registry Map.');

  async function dispatch(toolName, args = {}, meta = {}) {
    const id = String(toolName || '').trim().toLowerCase();
    const started = Date.now();
    const spanId = startSpan(`thoth.tool.${id}`, { tool: id });

    const finish = (result) => {
      result.durationMs = Date.now() - started;
      endSpan(spanId, { ok: result.ok });
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

    const decision = checkPermission(state, tool, {
      adminAuthorized: meta.adminAuthorized === true,
      confirm:
        typeof confirm === 'function'
          ? (info) => confirm(info.tool, info.permissionClass)
          : undefined,
    });
    if (!decision.allowed)
      return finish({ ok: false, error: 'permission-denied', reason: decision.reason });

    let data;
    try {
      const timeoutMs =
        Number(meta.timeoutMs) > 0 ? Number(meta.timeoutMs) : DEFAULT_TIMEOUT_MS;
      data = await Promise.race([
        Promise.resolve(tool.handler(args ?? {}, { state })),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('thoth-timeout')), timeoutMs)
        ),
      ]);
    } catch (err) {
      return finish({
        ok: false,
        error: err && err.message === 'thoth-timeout' ? 'timeout' : 'handler-error',
      });
    }

    let payload;
    try {
      payload = JSON.stringify(data ?? {});
    } catch {
      return finish({ ok: false, error: 'unserializable-result' });
    }
    if (payload.length > MAX_RESULT_BYTES)
      return finish({ ok: false, error: 'result-too-large' });

    return finish({ ok: true, data, reason: decision.reason });
  }

  return { dispatch };
}

export { CLASS_ORDER };
