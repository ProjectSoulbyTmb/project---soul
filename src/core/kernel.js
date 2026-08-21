import { classifyWorkspaceIntent } from './workspace.js';
import { knowledgeEntry, matchProductIntent, shouldUseKnowledgeReply } from './knowledge.js';
import { builtinModules, moduleForIntent } from './modules.js';
import { PRESENCE_LOOKS, defaultPresence, normalizePresence, presenceLook } from './presence.js';
import { FUTURE_VOICE_BACKEND, defaultVoiceSettings, normalizeVoiceSettings } from './voices.js';
import { defaultSoulOnline, normalizeSoulOnline } from './soul-online.js';
import {
  createRuntimeRegistry,
  defaultPhrasing,
  defaultRegistry,
  matchCustomAction,
  normalizeRegistry
} from './registry.js';
import {
  defaultWorkspaceLayers,
  expireFocusIfNeeded,
  isFocusStartCommand,
  isFocusStopCommand,
  isScratchCaptureCommand,
  normalizeWorkspaceLayers,
  workspacePublicView
} from './layers.js';

export function defaultKernelState() {
  return {
    session: { live: false, startedAt: null, heartbeatAt: null, pulseCount: 0, source: 'offline' },
    registry: defaultRegistry(),
    voice: defaultVoiceSettings(),
    presence: defaultPresence(),
    soulOnline: defaultSoulOnline(),
    workspace: defaultWorkspaceLayers()
  };
}

export function migrateKernel(input) {
  const base = defaultKernelState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  return {
    session: {
      live: input.session?.live === true,
      startedAt: input.session?.startedAt ? String(input.session.startedAt).slice(0, 40) : null,
      heartbeatAt: input.session?.heartbeatAt ? String(input.session.heartbeatAt).slice(0, 40) : null,
      pulseCount: Math.max(0, Number(input.session?.pulseCount) || 0),
      source: input.session?.source === 'assist' ? 'assist' : 'offline'
    },
    registry: normalizeRegistry(input.registry, base.registry),
    voice: normalizeVoiceSettings(input.voice, base.voice),
    presence: normalizePresence(input.presence, base.presence),
    soulOnline: normalizeSoulOnline(input.soulOnline, base.soulOnline),
    workspace: normalizeWorkspaceLayers(input.workspace, base.workspace)
  };
}

export function startKernelSession(state, { at } = {}) {
  const now = at || new Date().toISOString();
  state.kernel = migrateKernel(state.kernel);
  state.kernel.session.live = true;
  state.kernel.session.startedAt = state.kernel.session.startedAt || now;
  state.kernel.session.heartbeatAt = now;
  state.kernel.session.pulseCount = Math.max(0, Number(state.kernel.session.pulseCount) || 0);
  state.kernel.session.source = 'offline';
  if (state.continuity) state.continuity.lastActiveAt = now;
  return kernelView(state);
}

export function stopKernelSession(state) {
  state.kernel = migrateKernel(state.kernel);
  state.kernel.session.live = false;
  return kernelView(state);
}

export function kernelHeartbeat(state, { at } = {}) {
  const now = at || new Date().toISOString();
  state.kernel = migrateKernel(state.kernel);
  if (!state.kernel.session.live) return kernelView(state);
  state.kernel.session.heartbeatAt = now;
  state.kernel.session.pulseCount = Math.max(0, Number(state.kernel.session.pulseCount) || 0) + 1;
  if (state.continuity) state.continuity.lastActiveAt = now;
  return kernelView(state);
}

export function configureKernelState(state, input = {}) {
  state.kernel = migrateKernel(state.kernel);
  const next = input && typeof input === 'object' ? input : {};
  if (next.registry) state.kernel.registry = normalizeRegistry(next.registry, state.kernel.registry);
  if (next.moduleEnabled && typeof next.moduleEnabled === 'object') {
    state.kernel.registry = normalizeRegistry({ ...state.kernel.registry, moduleEnabled: { ...state.kernel.registry.moduleEnabled, ...next.moduleEnabled } }, state.kernel.registry);
  }
  if (Array.isArray(next.customActions)) {
    state.kernel.registry = normalizeRegistry({ ...state.kernel.registry, customActions: next.customActions }, state.kernel.registry);
  }
  if (next.phrasing) {
    state.kernel.registry = normalizeRegistry({ ...state.kernel.registry, phrasing: next.phrasing }, state.kernel.registry);
  }
  if (next.voice) state.kernel.voice = normalizeVoiceSettings(next.voice, state.kernel.voice);
  if (next.presence) state.kernel.presence = normalizePresence(next.presence, state.kernel.presence);
  if (next.soulOnline) state.kernel.soulOnline = normalizeSoulOnline(next.soulOnline, state.kernel.soulOnline);
  if (next.assistOptIn !== undefined) state.kernel.soulOnline = normalizeSoulOnline({ assistOptIn: next.assistOptIn }, state.kernel.soulOnline);
  if (next.workspace) state.kernel.workspace = normalizeWorkspaceLayers(next.workspace, state.kernel.workspace);
  const at = new Date().toISOString();
  if (!Array.isArray(state.audit)) state.audit = [];
  state.audit.push({ at, type: 'kernel.configured', details: { assistOptIn: state.kernel.soulOnline.assistOptIn === true, lookId: state.kernel.presence.lookId } });
  return kernelView(state);
}

export function kernelView(state, runtime) {
  const kernel = migrateKernel(state?.kernel);
  if (state?.kernel) {
    state.kernel = kernel;
    expireFocusIfNeeded(state);
  }
  const registry = runtime || createRuntimeRegistry();
  const modules = registry.list().map(mod => ({
    ...mod,
    enabled: registry.enabled(mod.id, kernel.registry)
  }));
  return {
    live: kernel.session.live === true,
    startedAt: kernel.session.startedAt,
    heartbeatAt: kernel.session.heartbeatAt,
    pulseCount: kernel.session.pulseCount || 0,
    source: kernel.session.source || 'offline',
    voice: kernel.voice,
    presence: { ...kernel.presence, look: presenceLook(kernel.presence.lookId) },
    soulOnline: kernel.soulOnline,
    phrasing: kernel.registry.phrasing,
    customActions: kernel.registry.customActions,
    modules,
    looks: PRESENCE_LOOKS,
    futureVoiceBackend: FUTURE_VOICE_BACKEND,
    selfModel: state?.continuity?.selfModel || null,
    assistOptIn: kernel.soulOnline.assistOptIn === true,
    workspace: workspacePublicView(state?.kernel?.workspace || kernel.workspace)
  };
}

function action(type, extra = {}) {
  return { type, auto: false, ...extra };
}

export function actionsForIntent(intent, overlay = {}) {
  switch (intent) {
    case 'apps':
      return [action('open-view', { view: 'apps', label: 'Open Apps & Gaming', auto: true })];
    case 'entertainment':
    case 'mood':
    case 'favorites':
    case 'watch':
    case 'gaming-ost':
    case 'study-ost':
    case 'surprise':
      return [action('open-view', { view: 'entertainment', label: 'Open Entertainment', auto: intent === 'entertainment' })];
    case 'memory':
      return [action('open-view', { view: 'memory', label: 'Open Memory', auto: true })];
    case 'identity':
    case 'identity-panel':
      return [action('open-view', { view: 'identity', label: 'Identity & consent', auto: true })];
    case 'settings':
      return [action('open-view', { view: 'settings', label: 'Open Settings', auto: true })];
    case 'status':
      return [action('open-diagnostics', { label: 'Show diagnostics', auto: true }), action('open-service', { label: 'Service settings' })];
    case 'setup':
      return [action('open-setup', { label: 'Assistant setup', auto: true })];
    case 'accessibility':
      return [action('open-view', { view: 'settings', label: 'Accessibility settings', auto: true })];
    case 'presence':
      return [action('open-view', { view: 'settings', label: 'Presence & voice', auto: true })];
    case 'focus':
      return [
        action('open-view', { view: 'dashboard', label: 'Open Dashboard' }),
        action('start-focus', { minutes: 25, label: 'Focus session' })
      ];
    case 'focus-stop':
      return [action('stop-focus', { label: 'Stop focus session', auto: true })];
    case 'scratch':
      return [action('open-view', { view: 'dashboard', label: 'Open scratchpad', auto: true }), action('capture-scratch', { label: 'Capture to memory' })];
    case 'palette':
      return [action('open-palette', { label: 'Open command palette', auto: true })];
    case 'search':
      return [action('open-palette', { label: 'Search this workspace', auto: true })];
    case 'cheatsheet':
      return [action('open-cheatsheet', { label: 'Keyboard cheatsheet', auto: true })];
    case 'widgets':
      return [action('open-view', { view: 'dashboard', label: 'Open Dashboard', auto: true })];
    case 'study':
    case 'create':
    case 'talk':
      return [action('open-view', { view: 'dashboard', label: 'Stay on workspace' })];
    case 'gaming':
      return [action('open-view', { view: 'apps', label: 'Apps & Gaming' })];
    case 'research':
      return [
        action('open-view', { view: 'research', label: 'Open Research', auto: true }),
        action('open-view', { view: 'chat', label: 'Open conversation' })
      ];
    default: {
      const entry = knowledgeEntry(intent);
      if (entry?.actions?.length) return entry.actions.map(item => action(item.type, item));
      return overlay.enabled
        ? [action('open-view', { view: 'identity', label: 'Soul identity' })]
        : [action('open-setup', { label: 'Optional Soul setup' })];
    }
  }
}

export function soulOverlay(state = {}) {
  const enabled = state.setup?.completed === true;
  const policy = state.policy || {};
  const adult = policy.mode === 'adult'
    && policy.adultSoulEnabled === true
    && policy.currentConsent === true
    && policy.adultStatusConfirmed === true;
  const sm = state.continuity?.selfModel || {};
  const name = String(sm.name || 'Soul');
  return {
    enabled,
    name: enabled ? name : null,
    architecture: enabled ? String(sm.architecture || '') : null,
    adultMode: Boolean(adult),
    sentience: false,
    label: enabled
      ? `${name} is a software self-model on this device — not a claim of consciousness.`
      : 'Optional Soul setup is off. The workspace kernel is software, not a mind.'
  };
}

export function routeKernel(input, state, runtime = createRuntimeRegistry()) {
  const text = String(input || '');
  const overlay = soulOverlay(state);
  const kernel = migrateKernel(state?.kernel);
  const custom = matchCustomAction(text, kernel.registry.customActions);
  if (custom) {
    const intent = custom.intent || classifyWorkspaceIntent(custom.command);
    const mod = moduleForIntent(intent, runtime.list()) || runtime.get('quick-actions');
    const enabled = !mod || runtime.enabled(mod.id, kernel.registry);
    return {
      intent,
      moduleId: mod?.id || 'quick-actions',
      enabled,
      source: 'custom-action',
      view: custom.view || mod?.ui?.view || 'chat',
      action: custom,
      overlay,
      knowledgeReply: null,
      usedKnowledge: false
    };
  }
  const workspace = classifyWorkspaceIntent(text);
  const product = matchProductIntent(text);
  let intent = (workspace === 'general' && product) ? product : workspace;
  if (intent === 'focus' && isFocusStopCommand(text)) intent = 'focus-stop';
  if (intent === 'focus' && isFocusStartCommand(text)) intent = 'focus';
  if (isScratchCaptureCommand(text) && workspace === 'scratch') intent = 'scratch';
  const productIntent = product && shouldUseKnowledgeReply(product) ? product : (shouldUseKnowledgeReply(intent) ? intent : null);
  const mod = moduleForIntent(productIntent || intent, runtime.list()) || moduleForIntent(workspace, runtime.list());
  const enabled = !mod || runtime.enabled(mod.id, kernel.registry);
  const entry = productIntent ? knowledgeEntry(productIntent) : null;
  const usedKnowledge = Boolean(enabled && entry?.reply && (intent === 'general' || shouldUseKnowledgeReply(intent) || productIntent));
  const routedIntent = productIntent && (intent === 'general' || shouldUseKnowledgeReply(intent)) ? productIntent : intent;
  const actions = actionsForIntent(routedIntent, overlay).map(item => {
    if (item.type === 'start-focus' && isFocusStartCommand(text)) return { ...item, auto: true };
    if (item.type === 'capture-scratch' && isScratchCaptureCommand(text)) return { ...item, auto: true };
    return item;
  });
  return {
    intent: routedIntent,
    moduleId: mod?.id || null,
    enabled,
    source: usedKnowledge ? 'knowledge' : 'workspace',
    view: mod?.ui?.view || (routedIntent === 'palette' || routedIntent === 'search' || routedIntent === 'cheatsheet' ? 'dashboard' : 'chat'),
    action: null,
    overlay,
    knowledgeReply: usedKnowledge ? entry.reply : null,
    usedKnowledge,
    actions
  };
}

export function researchResultActions(webResearch = {}, overlay = {}) {
  const actions = actionsForIntent('research', overlay);
  for (const source of (webResearch?.sources || []).slice(0, 6)) {
    if (!source?.url || !/^https:\/\//i.test(source.url)) continue;
    const host = String(source.hostname || '').slice(0, 80);
    const title = String(source.title || host || 'Source').slice(0, 60);
    actions.push(action('open-external', {
      url: source.url,
      hostname: host,
      snippet: String(source.description || source.extract || '').slice(0, 180),
      label: host ? `${title} · ${host}`.slice(0, 80) : title,
      auto: false
    }));
  }
  return actions;
}

export function kernelPublicMeta(route) {
  const value = route && typeof route === 'object' ? route : {};
  return {
    intent: String(value.intent || 'general'),
    moduleId: value.moduleId || null,
    enabled: value.enabled !== false,
    source: String(value.source || 'workspace'),
    view: String(value.view || 'chat'),
    usedKnowledge: Boolean(value.usedKnowledge),
    actions: Array.isArray(value.actions) ? value.actions.map(item => ({
      type: String(item.type || ''),
      view: item.view || undefined,
      legal: item.legal || undefined,
      url: item.url ? String(item.url).slice(0, 500) : undefined,
      hostname: item.hostname ? String(item.hostname).slice(0, 253) : undefined,
      snippet: item.snippet ? String(item.snippet).slice(0, 180) : undefined,
      label: String(item.label || '').slice(0, 80),
      auto: item.type === 'open-external' ? false : Boolean(item.auto)
    })).filter(item => item.type && (item.type !== 'open-external' || /^https:\/\//i.test(item.url || ''))) : [],
    soul: {
      enabled: Boolean(value.overlay?.enabled),
      name: value.overlay?.enabled ? String(value.overlay?.name || 'Soul') : null,
      adultMode: Boolean(value.overlay?.adultMode),
      sentience: false,
      label: String(value.overlay?.label || '')
    },
    localOnly: true,
    network: false,
    conversationsSent: false,
    webLookup: false
  };
}

export function disabledModuleReply(route, locale = 'en') {
  const title = route?.moduleId || 'that module';
  const copy = {
    en: `The ${title} module is turned off in Soul customization. Enable it in Settings when you want that workspace surface. Local Soul stays on this device.`,
    es: `El módulo ${title} está desactivado en la personalización de Soul. Actívalo en Configuración. Soul local sigue en este dispositivo.`,
    fr: `Le module ${title} est désactivé dans la personnalisation de Soul. Activez-le dans Paramètres. Soul local reste sur cet appareil.`,
    de: `Das Modul ${title} ist in der Soul-Anpassung aus. Aktivieren Sie es unter Einstellungen. Lokales Soul bleibt auf diesem Gerät.`
  };
  return copy[locale] || copy.en;
}

/** Local wording only. Default knobs leave replies unchanged. Never claims sentience. */
export function applyPhrasing(text, knobs, locale = 'en') {
  const defaults = defaultPhrasing();
  const wit = Number.isFinite(Number(knobs?.wit)) ? Number(knobs.wit) : defaults.wit;
  const formality = Number.isFinite(Number(knobs?.formality)) ? Number(knobs.formality) : defaults.formality;
  const brevity = Number.isFinite(Number(knobs?.brevity)) ? Number(knobs.brevity) : defaults.brevity;
  let out = String(text || '');
  const near = (value, fallback) => Math.abs(value - fallback) < 15;
  if (!near(formality, defaults.formality) && formality >= 70) {
    const extra = {
      en: 'Stated plainly, as software on this device — not a person.',
      es: 'Dicho con claridad: software en este dispositivo, no una persona.',
      fr: 'Dit clairement : un logiciel sur cet appareil, pas une personne.',
      de: 'Klar gesagt: Software auf diesem Gerät, keine Person.'
    }[locale] || '';
    if (extra && !out.includes(extra)) out = `${out}\n\n${extra}`;
  }
  if (brevity < 75 && !near(wit, defaults.wit) && wit >= 70) {
    const extra = {
      en: 'I can keep the wording sharp without pretending to be alive.',
      es: 'Puedo ser directo sin fingir que estoy vivo.',
      fr: 'Je peux rester vif sans prétendre être vivant.',
      de: 'Ich kann prägnant bleiben, ohne lebendig zu wirken.'
    }[locale] || '';
    if (extra && !out.includes(extra)) out = `${out}\n\n${extra}`;
  }
  return out;
}

export { builtinModules, createRuntimeRegistry, FUTURE_VOICE_BACKEND };
