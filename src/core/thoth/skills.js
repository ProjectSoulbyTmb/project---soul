// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH OPERATOR SKILLS - the bridge between "only my commands" and action.
 *
 * Flow for every request:
 *   1. authorizeOperatorCommand() - exact-match catalog + live operator session
 *   2. if the phrase maps to a real Thoth tool, dispatch through the bus
 *      (permission broker, caps, timeouts, kill switch all still apply)
 *   3. otherwise return structured UI actions the renderer already executes
 *   4. record the run via the optional onRun hook (wire to awareness)
 *
 * This module adds NO new execution power: it can only reach tools that
 * already exist in the registry, and only after operator authorization.
 */

import { authorizeOperatorCommand } from './operator.js';

// Operator phrase -> Thoth tool id. Only phrases with a genuine tool
// counterpart are listed; everything else stays a UI-action command.
const TOOL_BINDING = Object.freeze({
  'run diagnostics': 'system.info',
});

export function createOperatorSkills({ dispatchTool = null, getSession = null, onRun = null } = {}) {
  return {
    async handle(rawText) {
      const session = typeof getSession === 'function' ? getSession() : getSession ?? null;
      const auth = authorizeOperatorCommand(rawText, session);

      if (!auth.allowed) {
        onRun?.({ phrase: String(rawText || '').slice(0, 60), allowed: false, outcome: auth.code });
        return { ...auth, executed: null };
      }

      const phrase = auth.command.phrase;
      const toolId = TOOL_BINDING[phrase];

      if (toolId && typeof dispatchTool === 'function') {
        try {
          const result = await dispatchTool(toolId, {}, { source: 'operator-skill' });
          onRun?.({ phrase, allowed: true, outcome: `tool:${toolId}` });
          return { ...auth, executed: { kind: 'tool', id: toolId, result } };
        } catch (error) {
          const reason = String(error?.message || error || 'dispatch-failed').slice(0, 120);
          onRun?.({ phrase, allowed: true, outcome: `tool-error:${reason}` });
          // Authorization held but execution failed: surface honestly, fall back to UI actions.
          return { ...auth, executed: { kind: 'tool-error', id: toolId, reason } };
        }
      }

      onRun?.({ phrase, allowed: true, outcome: 'ui-actions' });
      return { ...auth, executed: { kind: 'ui-actions', actions: auth.actions } };
    },
  };
}
