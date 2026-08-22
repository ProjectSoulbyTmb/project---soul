// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH OPERATOR AUTHORIZATION.
 *
 * Policy: Thoth executes ONLY commands issued by the operator, matched
 * EXACTLY against a frozen catalog of safe, read/navigation-class actions.
 * Everything else is refused by default and audited. No fuzzy matching,
 * no inference, no third-party phrasing, no escalation path.
 *
 * Pure module: no I/O, no Electron imports. The caller (main process)
 * supplies the operator session produced by the existing admin gate
 * (scrypt + timingSafeEqual) so authorization binds to one unlock flow.
 */

const ACTION_TYPES_ALLOWED = Object.freeze([
  'open-diagnostics',
  'open-service',
  'open-updates',
  'open-view',
  'open-legal',
]);

export const OPERATOR_COMMAND_CATALOG = Object.freeze([
  Object.freeze({ phrase: 'run diagnostics', actionId: 'open-diagnostics', riskClass: 'read', label: 'Show diagnostics' }),
  Object.freeze({ phrase: 'service status', actionId: 'open-service', riskClass: 'read', label: 'Service settings' }),
  Object.freeze({ phrase: 'check for updates', actionId: 'open-updates', riskClass: 'read', label: 'Software updates' }),
  Object.freeze({
    phrase: 'open settings',
    actionId: 'open-view',
    riskClass: 'read',
    label: 'Open Settings',
    view: 'settings',
  }),
  Object.freeze({
    phrase: 'open backups',
    actionId: 'open-view',
    riskClass: 'read',
    label: 'Open backups',
    view: 'settings',
    panel: 'backupSection',
  }),
  Object.freeze({
    phrase: 'open privacy notice',
    actionId: 'open-legal',
    riskClass: 'read',
    label: 'Privacy notice',
    legal: 'privacy',
  }),
]);

export function normalizeOperatorPhrase(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function auditEntry(at, decision, code, normalizedText, extra = {}) {
  return {
    at,
    type: `thoth.operator.${decision}`,
    details: { code, text: normalizedText.slice(0, 120), ...extra },
  };
}

/**
 * Authorize an operator command.
 * @param {string} text raw spoken/typed command
 * @param {{active?:boolean, expiresAt?:string|null}|null} session operator session from the admin gate
 * @param {{at?:string}} [opts]
 * @returns {{allowed:boolean, code:string, reason:string, command?:object, actions?:object[], audit:object}}
 */
export function authorizeOperatorCommand(text, session = null, opts = {}) {
  const at = opts.at || new Date().toISOString();
  const normalizedText = normalizeOperatorPhrase(text);

  const command = OPERATOR_COMMAND_CATALOG.find(c => c.phrase === normalizedText);
  if (!command) {
    return {
      allowed: false,
      code: 'unknown-command',
      reason: 'Not an exact operator command. Thoth follows only the operator catalog, word for word.',
      audit: auditEntry(at, 'deny', 'unknown-command', normalizedText),
    };
  }

  if (!session || session.active !== true) {
    return {
      allowed: false,
      code: 'no-operator-session',
      reason: 'No active operator session. Unlock via the admin gate first.',
      audit: auditEntry(at, 'deny', 'no-operator-session', normalizedText, { phrase: command.phrase }),
    };
  }

  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.parse(at)) {
    return {
      allowed: false,
      code: 'session-expired',
      reason: 'Operator session expired. Re-authenticate via the admin gate.',
      audit: auditEntry(at, 'deny', 'session-expired', normalizedText, { phrase: command.phrase }),
    };
  }

  const actions = [
    command.actionId === 'open-view'
      ? { type: 'open-view', view: command.view, panel: command.panel, label: command.label }
      : { type: command.actionId, label: command.label },
  ];
  if (command.actionId === 'open-legal') actions[0].legal = command.legal;

  return {
    allowed: true,
    code: 'ok',
    reason: 'Authorized operator command.',
    command,
    actions,
    audit: auditEntry(at, 'allow', 'ok', normalizedText, { phrase: command.phrase }),
  };
}

export function describeOperatorCatalog() {
  return OPERATOR_COMMAND_CATALOG.map(c => `"${c.phrase}"`).join(', ');
}
