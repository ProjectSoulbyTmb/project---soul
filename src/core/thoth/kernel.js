// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH KERNEL - core state, permission broker, tool registry, routines.
 *
 * THOTH is a first-party local tool kernel for Eidovara: it executes
 * explicitly registered tools behind a deny-by-default permission broker and
 * bounded deterministic routines. It is software automation - never an
 * autonomous agent, never a claim of agency beyond executing registered code.
 *
 * Design invariants enforced here:
 *  - Deny-by-default: every tool call needs a grant appropriate to its class.
 *  - Bounded work: routines have hard step limits; the bus caps output size.
 *  - Auditable: every decision appends to a capped append-only event log.
 *  - Honest: replies produced elsewhere must describe THOTH as local software.
 */

export const PERMISSION_CLASSES = Object.freeze({
  L0: 'L0', // read-only local computation; no effects outside THOTH state
  L1: 'L1', // writes local user data or performs a visible action; per-use confirm or standing grant required
  L2: 'L2', // elevated/local-admin scope; requires an active admin authorization callback
});

export const CLASS_ORDER = Object.freeze(['L0', 'L1', 'L2']);
const MAX_LOG = 1000;
const MAX_ROUTINE_STEPS = 24;
const MAX_ROUTINES = 64;
// Standing grants are capped at 30 days; callers may request less, never more.
const GRANT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_GRANT_TTL_MS = GRANT_TTL_MS;

export function defaultThothState() {
  return {
    version: 1,
    masterEnabled: true,
    tools: {}, // id -> { enabled, standingClass, grantedAt, expiresAt }
    routines: {}, // id -> { definition..., runCount, lastRunAt }
    log: [], // capped append-only events
  };
}

function clampId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 64);
}

export function migrateThothState(input) {
  const base = defaultThothState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const next = base;
  next.masterEnabled = input.masterEnabled !== false;
  if (input.tools && typeof input.tools === 'object') {
    for (const [id, rec] of Object.entries(input.tools)) {
      const key = clampId(id);
      if (!key) continue;
      next.tools[key] = {
        enabled: rec?.enabled !== false,
        standingClass: CLASS_ORDER.includes(rec?.standingClass) ? rec.standingClass : null,
        grantedAt: rec?.grantedAt || null,
        expiresAt: Number.isFinite(rec?.expiresAt) ? rec.expiresAt : null,
      };
    }
  }
  if (input.routines && typeof input.routines === 'object') {
    for (const [id, rec] of Object.entries(input.routines)) {
      const key = clampId(id);
      if (!key) continue;
      next.routines[key] = {
        definition: Array.isArray(rec?.definition) ? rec.definition.slice(0, MAX_ROUTINE_STEPS) : [],
        runCount: Math.max(0, Number(rec?.runCount) || 0),
        lastRunAt: rec?.lastRunAt || null,
      };
    }
  }
  if (Array.isArray(input.log)) {
    next.log = input.log.slice(-MAX_LOG).filter((e) => e && typeof e === 'object');
  }
  return next;
}

/** Append-only, capped event log entry. Frozen to prevent tampering. */
export function pushEvent(state, type, details) {
  const entry = Object.freeze({
    at: new Date().toISOString(),
    type: String(type).slice(0, 60),
    details: Object.freeze(details && typeof details === 'object' ? { ...details } : {}),
  });
  state.log.push(entry);
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}

/* ------------------------------------------------------------------ *
 * Permission Broker
 * ------------------------------------------------------------------ */

/**
 * Decide whether `tool` may run right now.
 * @param {object} state          migrated THOTH state
 * @param {{id:string, permissionClass:string}} tool registered tool descriptor
 * @param {{adminAuthorized?:boolean, confirm?:function}} ctx runtime context
 * @returns {{allowed:boolean, reason:string}}
 */
export function checkPermission(state, tool, ctx = {}) {
  if (!state.masterEnabled) return { allowed: false, reason: 'thoth-disabled' };
  if (!tool || !CLASS_ORDER.includes(tool.permissionClass))
    return { allowed: false, reason: 'invalid-tool-class' };

  const rec = state.tools[tool.id];
  if (rec && rec.enabled === false) return { allowed: false, reason: 'tool-disabled' };

  const cls = tool.permissionClass;
  const hasStanding =
    rec &&
    rec.standingClass &&
    CLASS_ORDER.indexOf(rec.standingClass) >= CLASS_ORDER.indexOf(cls) &&
    (!rec.expiresAt || rec.expiresAt > Date.now());

  if (cls === 'L0') return { allowed: true, reason: 'read-only-class' };

  if (cls === 'L1') {
    if (hasStanding) return { allowed: true, reason: 'standing-grant' };
    if (typeof ctx.confirm === 'function') {
      let ok = false;
      try {
        ok = ctx.confirm({ tool: tool.id, permissionClass: cls }) === true;
      } catch {
        ok = false;
      }
      return ok
        ? { allowed: true, reason: 'per-use-confirm' }
        : { allowed: false, reason: 'confirm-denied' };
    }
    return { allowed: false, reason: 'no-grant' };
  }

  // L2
  if (ctx.adminAuthorized !== true) return { allowed: false, reason: 'admin-required' };
  if (hasStanding || cls === 'L2') return { allowed: true, reason: 'admin-elevated' };
  return { allowed: false, reason: 'no-grant' };
}

/**
 * Grant/revoke standing permission.
 *
 * Safeguards:
 *  - L2 can NEVER be held as a standing grant. Elevated scope is per-call only
 *    (live admin gate at dispatch); refusing here closes a persistence hole.
 *  - TTL is clamped to MAX_GRANT_TTL_MS; callers get shorter, never longer.
 */
export function setStandingGrant(state, toolId, klass, { ttlMs = GRANT_TTL_MS } = {}) {
  const key = clampId(toolId);
  if (!key) throw new Error('THOTH grant requires a valid tool id.');
  if (klass !== null && !CLASS_ORDER.includes(klass))
    throw new Error(`Unknown THOTH permission class: ${klass}`);
  if (klass === 'L2') {
    pushEvent(state, 'thoth.grant.refused', { tool: key, class: klass, why: 'elevation-is-per-call-only' });
    throw new Error('L2 cannot be granted as standing permission; elevation is per-call.');
  }

  if (klass === null) {
    delete state.tools[key];
    pushEvent(state, 'thoth.grant.revoked', { tool: key });
    return null;
  }

  const now = Date.now();
  const rec = {
    enabled: state.tools[key]?.enabled !== false,
    standingClass: klass,
    grantedAt: new Date(now).toISOString(),
    expiresAt: now + Math.min(Math.max(1000, Number(ttlMs) || GRANT_TTL_MS), MAX_GRANT_TTL_MS),
  };
  state.tools[key] = rec;
  pushEvent(state, 'thoth.grant', { tool: key, class: klass });
  return rec;
}

/**
 * EMERGENCY STOP. Failsafes the whole kernel in one call:
 *  - masterEnabled = false (broker rejects every dispatch immediately)
 *  - all standing grants revoked (nothing survives to silently re-arm)
 * Idempotent. Recovery is an explicit operator action:
 *   state.masterEnabled = true (grants stay cleared).
 */
export function emergencyStop(state, reason = 'operator') {
  state.masterEnabled = false;
  let revoked = 0;
  for (const key of Object.keys(state.tools)) {
    if (state.tools[key].standingClass) {
      delete state.tools[key].standingClass;
      delete state.tools[key].expiresAt;
      revoked += 1;
    }
  }
  pushEvent(state, 'thoth.emergency-stop', { reason: String(reason).slice(0, 80), revoked });
  return { revoked };
}

export function setToolEnabled(state, toolId, enabled) {
  const key = clampId(toolId);
  if (!state.tools[key]) state.tools[key] = defaultThothState().tools[key] || {};
  const rec = state.tools[key];
  rec.enabled = enabled === true;
  rec.standingClass = rec.standingClass || null;
  pushEvent(state, enabled ? 'thoth.tool.enabled' : 'thoth.tool.disabled', { tool: key });
  return rec;
}

/* ------------------------------------------------------------------ *
 * Routines (bounded deterministic sequences)
 * ------------------------------------------------------------------ */

export function defineRoutine(state, id, definition, { hasTool } = {}) {
  const key = clampId(id);
  if (!key) throw new Error('Routine id is required.');
  if (!Array.isArray(definition) || definition.length === 0)
    throw new Error('Routine definition must be a non-empty array of steps.');
  if (definition.length > MAX_ROUTINE_STEPS)
    throw new Error(`Routines are limited to ${MAX_ROUTINE_STEPS} steps.`);
  if (!state.routines[key] && Object.keys(state.routines).length >= MAX_ROUTINES)
    throw new Error(`Routine storage is limited to ${MAX_ROUTINES} definitions.`);
  for (const step of definition) {
    if (!step || typeof step !== 'object' || typeof step.tool !== 'string')
      throw new Error('Each routine step must reference a tool by name.');
    // Fail at definition time when a registry is supplied: unknown tools must
    // never be discovered mid-run.
    if (typeof hasTool === 'function' && !hasTool(clampId(step.tool)))
      throw new Error(`Routine references unknown tool: ${step.tool}`);
  }
  const prev = state.routines[key];
  state.routines[key] = {
    definition: definition.map((s) => ({ tool: clampId(s.tool), args: s.args ?? {} })),
    runCount: prev?.runCount || 0,
    lastRunAt: prev?.lastRunAt || null,
  };
  pushEvent(state, 'thoth.routine.defined', { routine: key, steps: definition.length });
  return state.routines[key];
}

/**
 * Dry-run or execute a routine step-by-step through `dispatch`.
 * Execution stops at the first failed step unless `continueOnError`.
 */
export async function runRoutine(
  state,
  id,
  dispatch,
  { dryRun = true, continueOnError = false, adminAuthorized = false, toolClassOf } = {}
) {
  const key = clampId(id);
  const rec = state.routines[key];
  if (!rec) return { ok: false, error: 'routine-not-found' };

  // Preflight: refuse the WHOLE run up front if any step needs elevation that
  // is not present, or any tool is unknown. Never half-execute a routine.
  for (const step of rec.definition) {
    if (typeof toolClassOf === 'function') {
      if (!toolClassOf(step.tool)) return { ok: false, error: 'unknown-tool-in-routine', tool: step.tool };
      if (toolClassOf(step.tool) === 'L2' && !adminAuthorized)
        return { ok: false, error: 'admin-required', tool: step.tool };
    }
  }

  const results = [];
  let stoppedAt = null;

  for (let i = 0; i < rec.definition.length && i < MAX_ROUTINE_STEPS; i += 1) {
    const step = rec.definition[i];
    if (dryRun) {
      results.push({ step: i, tool: step.tool, dryRun: true });
      continue;
    }
    const out = await dispatch(step.tool, step.args, {
      routine: key,
      step: i,
      adminAuthorized: adminAuthorized === true,
    });
    results.push({ step: i, tool: step.tool, ok: out.ok, error: out.error || null });
    if (!out.ok && !continueOnError) {
      stoppedAt = i;
      break;
    }
  }

  if (!dryRun && stoppedAt === null) {
    rec.runCount += 1;
    rec.lastRunAt = new Date().toISOString();
    pushEvent(state, 'thoth.routine.ran', { routine: key, steps: results.length });
  }
  return { ok: stoppedAt === null, dryRun, stoppedAt, results };
}
