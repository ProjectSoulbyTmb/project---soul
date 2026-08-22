// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { builtinModules, validateModule } from './modules.js';

export function defaultPhrasing() {
  return { wit: 40, formality: 40, brevity: 50 };
}

export function defaultRegistry() {
  return {
    moduleEnabled: Object.fromEntries(builtinModules.map(mod => [mod.id, mod.enabled !== false])),
    customActions: [],
    phrasing: defaultPhrasing()
  };
}

function clampKnob(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function normalizeCustomAction(input = {}, fallbackId) {
  const label = String(input.label || '').trim().slice(0, 80);
  const command = String(input.command || input.intent || '').trim().slice(0, 200);
  if (!label || !command) return null;
  const id = String(input.id || fallbackId || `act_${Date.now().toString(36)}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return {
    id: id || `act_${Date.now().toString(36)}`,
    label,
    command,
    intent: String(input.intent || 'general').trim().slice(0, 40) || 'general',
    view: String(input.view || 'chat').trim().slice(0, 40) || 'chat'
  };
}

export function normalizeRegistry(input = {}, prev = defaultRegistry()) {
  const base = defaultRegistry();
  const prior = prev && typeof prev === 'object' ? prev : base;
  const incoming = input && typeof input === 'object' ? input : {};
  const priorEnabled = prior.moduleEnabled && typeof prior.moduleEnabled === 'object' ? prior.moduleEnabled : {};
  const nextEnabled = incoming.moduleEnabled && typeof incoming.moduleEnabled === 'object' ? incoming.moduleEnabled : {};
  const moduleEnabled = { ...base.moduleEnabled };
  for (const mod of builtinModules) {
    if (Object.prototype.hasOwnProperty.call(nextEnabled, mod.id)) moduleEnabled[mod.id] = nextEnabled[mod.id] !== false;
    else if (Object.prototype.hasOwnProperty.call(priorEnabled, mod.id)) moduleEnabled[mod.id] = priorEnabled[mod.id] !== false;
  }
  const rawActions = Array.isArray(incoming.customActions) ? incoming.customActions : (Array.isArray(prior.customActions) ? prior.customActions : []);
  const customActions = rawActions.map((item, index) => normalizeCustomAction(item, `act_${index}`)).filter(Boolean).slice(0, 24);
  const phrasingIn = incoming.phrasing && typeof incoming.phrasing === 'object' ? incoming.phrasing : (prior.phrasing || {});
  const phrasingPrior = prior.phrasing || defaultPhrasing();
  return {
    moduleEnabled,
    customActions,
    phrasing: {
      wit: clampKnob(phrasingIn.wit, phrasingPrior.wit),
      formality: clampKnob(phrasingIn.formality, phrasingPrior.formality),
      brevity: clampKnob(phrasingIn.brevity, phrasingPrior.brevity)
    }
  };
}

export function createRuntimeRegistry(catalog = builtinModules) {
  const modules = new Map();
  function register(mod) {
    const ok = validateModule(mod);
    modules.set(ok.id, ok);
    return ok;
  }
  for (const mod of catalog) register(mod);
  return {
    register,
    get(id) { return modules.get(id) || null; },
    list() { return [...modules.values()]; },
    enabled(id, persisted) {
      const mod = modules.get(id);
      if (!mod) return false;
      const map = persisted?.moduleEnabled;
      if (map && typeof map === 'object' && Object.prototype.hasOwnProperty.call(map, id)) return map[id] !== false;
      return mod.enabled !== false;
    }
  };
}

export function matchCustomAction(input, actions = []) {
  const text = String(input || '').trim().toLowerCase();
  if (!text) return null;
  return (Array.isArray(actions) ? actions : []).find(action => {
    const command = String(action.command || '').trim().toLowerCase();
    return command && (text === command || text.includes(command));
  }) || null;
}

