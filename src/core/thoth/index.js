// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH kernel - public surface.
 *
 * createThothKernel() wires registry + broker + bus into one object and is the
 * only entry point other modules should consume. Engine integration lives in
 * attachToEngine(); command parsing in matchInvocation()/handleCommand().
 */

import { createBus } from './bus.js';
import { BUILTIN_TOOLS, normalizeTool } from './tools.js';
import { SOFTWARE_TOOLS } from './software.js';
import {
  PERMISSION_CLASSES,
  CLASS_ORDER,
  migrateThothState,
  pushEvent,
  setStandingGrant,
  setToolEnabled,
  defineRoutine,
  runRoutine as runRoutineCore,
  emergencyStop,
} from './kernel.js';

export { PERMISSION_CLASSES, CLASS_ORDER };

const INVOCATION_RE = /^\/?(?:thoth|t\.)[:,]?\s*(.+)$/i;
const HONESTY_NOTE =
  'THOTH is a local tool kernel on this device - deterministic software, not a mind.';

/**
 * @param {{state?:object, confirm?:(tool:string, cls:string)=>boolean|Promise<boolean>}} opts
 */
export function createThothKernel(opts = {}) {
  const state = migrateThothState(opts.state);
  // Ops kill switch: environment always wins over stored state.
  if (process.env.EIDOVARA_THOTH_DISABLED === '1') state.masterEnabled = false;
  const registry = new Map();

  for (const def of [...BUILTIN_TOOLS, ...SOFTWARE_TOOLS]) {
    const tool = normalizeTool(def);
    registry.set(tool.id, tool);
    if (!state.tools[tool.id]) state.tools[tool.id] = {};
  }

  /** Register an additional (raw) tool at runtime; normalized on the way in. */
  function register(def) {
    const tool = normalizeTool(def);
    registry.set(tool.id, tool);
    if (!state.tools[tool.id]) state.tools[tool.id] = {};
    pushEvent(state, 'thoth.tool.registered', { tool: tool.id });
    return tool.id;
  }

  /**
   * EMERGENCY STOP passthrough: disables the kernel and revokes every standing
   * grant in one atomic action. Recovery requires explicitly setting
   * kernel.state.masterEnabled = true; grants are never auto-restored.
   */
  function stop(reason) {
    return emergencyStop(state, reason);
  }

  const bus = createBus({
    registry,
    state,
    confirm: typeof opts.confirm === 'function' ? opts.confirm : undefined,
  });

  function listTools() {
    return [...registry.values()].map((t) => ({
      id: t.id,
      title: t.title,
      summary: t.summary,
      permissionClass: t.permissionClass,
      intents: t.intents,
      enabled: state.tools[t.id]?.enabled !== false,
      standingClass: state.tools[t.id]?.standingClass || null,
    }));
  }

  /** Resolve a free-text intent phrase ("calc", "system info") to a tool. */
  function resolveIntent(phrase) {
    const p = String(phrase || '').trim().toLowerCase();
    for (const tool of registry.values()) {
      if (tool.intents.includes(p)) return tool;
    }
    return null;
  }

  function buildArgs(tool, rest) {
    const args = rest ? { _rest: rest } : {};
    if (tool.id === 'math.evaluate' && rest) args.expression = rest.slice(0, 200);
    if (tool.id === 'note.append' && rest) args.text = rest.slice(0, 500);
    return args;
  }

  /**
   * Parse `thoth <command> [args]` style invocations.
   * Returns {toolId, args} | {help:true} | null when text is not for THOTH.
   */
  function matchInvocation(text) {
    const m = INVOCATION_RE.exec(String(text || '').trim());
    if (!m) return null;
    const body = m[1].trim();
    if (!body || /^(help|tools|what can you do)\b/i.test(body)) return { help: true };

    const sp = body.indexOf(' ');
    const head = (sp === -1 ? body : body.slice(0, sp)).toLowerCase();
    const rest = sp === -1 ? '' : body.slice(sp + 1).trim();

    const tool = resolveIntent(head);
    if (tool) return { toolId: tool.id, args: buildArgs(tool, rest) };
    return { help: true };
  }

  async function runTool(toolId, args, meta = {}) {
    return bus.dispatch(toolId, args, meta);
  }

  /**
   * Handle a parsed invocation end-to-end and produce a user-facing reply.
   * Never throws; failures become honest error replies.
   */
  async function handleCommand(parsed, meta = {}) {
    if (parsed.help) {
      const tools = listTools()
        .map((t) => `- ${t.id} (${t.permissionClass}${t.enabled ? '' : ', disabled'})`)
        .join('\n');
      return {
        ok: true,
        reply: `THOTH tools on this device:\n${tools}\n\nUsage: thoth <intent> [args]. Example: thoth calc 2*(3+4).\nNetwork tools (dns, http/probe) need an L1 grant first: they are denied until you confirm once or grant standing access.\n${HONESTY_NOTE}`,
      };
    }
    const out = await runTool(parsed.toolId, parsed.args, meta);
    const lines = [];
    lines.push(out.ok ? 'Done.' : `Failed (${out.error}${out.reason ? `: ${out.reason}` : ''}).`);
    if (out.ok && out.data && Object.keys(out.data).length)
      lines.push(JSON.stringify(out.data, null, 2));
    lines.push(HONESTY_NOTE);
    return { ...out, reply: lines.join('\n') };
  }

  return {
    state,
    registry,
    listTools,
    register,
    stop,
    resolveIntent,
    matchInvocation,
    runTool,
    handleCommand,
    grant: (id, klass, o) => setStandingGrant(state, id, klass, o),
    enableTool: (id, on) => setToolEnabled(state, id, on),
    defineRoutine: (id, steps) =>
      defineRoutine(state, id, steps, { hasTool: (tid) => registry.has(tid) }),
    runRoutine: (id, o) =>
      runRoutineCore(
        state,
        id,
        (tool, args, meta) => bus.dispatch(tool, args, meta),
        {
          dryRun: true,
          adminAuthorized: false,
          toolClassOf: (tid) => registry.get(tid)?.permissionClass || null,
          ...(o || {}),
        }
      ),
  };
}

/**
 * Attach THOTH to a SoulEngine instance.
 * Wraps engine.respond so `thoth ...` messages route through the kernel
 * BEFORE providers run; everything else passes through untouched.
 * Idempotent: calling twice returns the existing kernel.
 * The original respond() is preserved as engine.__baseRespond.
 */
export function attachToEngine(engine, opts = {}) {
  if (!engine) throw new Error('attachToEngine requires an engine.');
  if (engine.thoth) return engine.thoth;
  if (typeof engine.respond !== 'function')
    throw new Error('attachToEngine requires an engine with respond().');

  const kernel = createThothKernel({
    state: engine.state?.thoth,
    confirm: opts.confirm,
  });

  const baseRespond = engine.respond.bind(engine);
  engine.__baseRespond = baseRespond;
  engine.thoth = kernel;

  engine.respond = async function thothAwareRespond(input, extra = {}) {
    const probeText = typeof input === 'string' ? input : String(input?.text ?? '');
    let parsed;
    try {
      parsed = kernel.matchInvocation(probeText);
    } catch {
      parsed = null; // parsing must never break the engine
    }
    if (!parsed) return baseRespond(input, extra);

    // Failsafe: a THOTH failure becomes an honest error reply, never a crash.
    let result;
    try {
      result = await kernel.handleCommand(parsed, {
        adminAuthorized: extra?.adminAuthorized === true,
      });
    } catch (err) {
      result = {
        ok: false,
        error: 'kernel-error',
        reply: `THOTH failed safely (${String(err?.message || err).slice(0, 120)}).\n${HONESTY_NOTE}`,
      };
    }

    const now = new Date().toISOString();
    const conv =
      (typeof engine.activeConversation === 'function' && engine.activeConversation()) ||
      engine.state.conversations.find((c) => c.id === engine.state.activeConversationId);

    if (conv) {
      conv.messages.push({
        id: `th-${now}-${Math.random().toString(36).slice(2, 8)}u`,
        role: 'user',
        content: probeText.slice(0, 200),
        at: now,
      });
      conv.messages.push({
        id: `th-${now}-${Math.random().toString(36).slice(2, 8)}a`,
        role: 'assistant',
        content: String(result.reply).slice(0, 4000),
        at: now,
        thoth: true,
      });
      conv.updatedAt = now;
    }
    if (Array.isArray(engine.state.audit)) {
      engine.state.audit.push({
        at: now,
        type: 'thoth.command',
        details: { ok: result.ok === true, tool: parsed.toolId || null },
      });
    }

    return {
      reply: result.reply,
      state: engine.state,
      thoth: { ok: result.ok, error: result.error || null, data: result.data ?? null },
      kernel: { intent: 'thoth', usedKnowledge: false, actions: [] },
    };
  };

  return kernel;
}
