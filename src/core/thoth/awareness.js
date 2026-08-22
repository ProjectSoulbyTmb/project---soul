// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH AWARENESS - live memory for what Thoth has seen and done.
 *
 * Pure state container: the caller (main process heartbeat / update checks /
 * operator skill runs) feeds snapshots in; Soul asks awarenessView() for an
 * honest summary. Nothing here performs I/O or network calls, and nothing is
 * persisted beyond the profile store the engine already owns.
 *
 * Retention: bounded rings (last 20 events per ring) so profiles stay small.
 */

const RING_LIMIT = 20;

export function createAwarenessState() {
  return {
    service: { lastSnapshot: null, consecutiveFailures: 0 },
    updates: { lastCheck: null, availableVersion: null, verified: false },
    commands: [],
    maintenance: [],
  };
}

function pushRing(list, item) {
  const next = [...list, item];
  return next.length > RING_LIMIT ? next.slice(next.length - RING_LIMIT) : next;
}

export function recordServiceSnapshot(state, { at, ok, latencyMs = null, detail = '' } = {}) {
  if (!state || typeof state !== 'object') return state;
  state.service = state.service || { lastSnapshot: null, consecutiveFailures: 0 };
  const snapshot = {
    at: String(at || new Date().toISOString()),
    ok: ok === true,
    latencyMs: Number.isFinite(Number(latencyMs)) ? Number(latencyMs) : null,
    detail: String(detail || '').slice(0, 120),
  };
  state.service.lastSnapshot = snapshot;
  state.service.consecutiveFailures = snapshot.ok ? 0 : state.service.consecutiveFailures + 1;
  return state;
}

export function recordUpdateCheck(state, { at, available = false, version = null, verified = false } = {}) {
  if (!state || typeof state !== 'object') return state;
  state.updates = state.updates || { lastCheck: null, availableVersion: null, verified: false };
  state.updates.lastCheck = String(at || new Date().toISOString());
  state.updates.availableVersion = available ? String(version || '').slice(0, 40) : null;
  state.updates.verified = verified === true;
  return state;
}

export function recordOperatorRun(state, { at, phrase, allowed, outcome = '' } = {}) {
  if (!state || typeof state !== 'object') return state;
  state.commands = pushRing(state.commands || [], {
    at: String(at || new Date().toISOString()),
    phrase: String(phrase || '').slice(0, 60),
    allowed: allowed === true,
    outcome: String(outcome || '').slice(0, 80),
  });
  return state;
}

export function recordMaintenance(state, { at, actionId, result = 'ok', detail = '' } = {}) {
  if (!state || typeof state !== 'object') return state;
  state.maintenance = pushRing(state.maintenance || [], {
    at: String(at || new Date().toISOString()),
    actionId: String(actionId || '').slice(0, 40),
    result: String(result || 'ok').slice(0, 24),
    detail: String(detail || '').slice(0, 120),
  });
  return state;
}

export function serviceSummary(state) {
  const s = state?.service?.lastSnapshot;
  if (!s) return 'No service probe recorded yet.';
  const when = s.at.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  return s.ok
    ? `Service was UP at ${when}${s.latencyMs != null ? ` (${s.latencyMs} ms)` : ''}.`
    : `Service was UNREACHABLE at ${when}; ${state.service.consecutiveFailures} consecutive failure(s).`;
}

export function updatesSummary(state) {
  const u = state?.updates;
  if (!u?.lastCheck) return 'No update check recorded yet.';
  const when = u.lastCheck.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  return u.availableVersion
    ? `Update ${u.availableVersion} was available at last check (${when}), integrity ${u.verified ? 'verified' : 'UNVERIFIED'}.`
    : `No newer installer at last check (${when}).`;
}

export function maintenanceSummary(state) {
  const log = state?.maintenance || [];
  if (!log.length) return 'No maintenance actions recorded yet.';
  const last = log[log.length - 1];
  return `${log.length} recent maintenance event(s); latest: ${last.actionId} -> ${last.result} at ${last.at.replace('T', ' ')}.`;
}

export function commandSummary(state) {
  const cmds = state?.commands || [];
  const allowed = cmds.filter(c => c.allowed).length;
  return `${cmds.length} operator command(s) on record; ${allowed} authorized.`;
}

export function awarenessView(state) {
  if (!state || typeof state !== 'object') return createAwarenessState();
  return {
    service: serviceSummary(state),
    updates: updatesSummary(state),
    commands: commandSummary(state),
    maintenance: maintenanceSummary(state),
    raw: state,
  };
}
