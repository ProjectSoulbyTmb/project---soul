// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * In-app consumer workspace layers for the Soul kernel.
 *
 * Patterns taken (not brands): command-palette jump, unified local search,
 * pin/reorder dashboard tiles, a timed focus block, on-device scratch capture,
 * and a keyboard cheatsheet. This is Eidovara chrome — not a fake OS shell,
 * not an overlay injected into other processes, and not a cloud crawler.
 */

import { builtinModules } from './modules.js';
import { DESKTOP_KNOWLEDGE_ENTRIES } from './knowledge.js';
import { addMemory } from './memory.js';
import { overlayPaletteItems } from './overlays.js';

export const WIDGET_IDS = Object.freeze(['focus', 'apps', 'media', 'research', 'memory', 'diagnostics', 'scratch']);
export const DEFAULT_WIDGET_ORDER = Object.freeze(['focus', 'apps', 'media', 'memory', 'scratch', 'diagnostics']);
export const DEFAULT_WIDGET_HIDDEN = Object.freeze(['research']);
export const FOCUS_MIN_MINUTES = 5;
export const FOCUS_MAX_MINUTES = 90;
export const FOCUS_DEFAULT_MINUTES = 25;

export const SETTINGS_LABELS = Object.freeze([
  { id: 'set-language', title: 'Interface language', keywords: ['locale', 'español', 'français', 'deutsch'], view: 'settings', panel: 'assistantBehaviorForm' },
  { id: 'set-provider', title: 'Conversation engine provider', keywords: ['offline', 'ollama', 'endpoint'], view: 'settings' },
  { id: 'set-service', title: 'Eidovara service URL', keywords: ['worker', 'connect', 'health'], action: { type: 'open-service' } },
  { id: 'set-assist', title: 'Optional Worker helper /v1/assist', keywords: ['soul-online', 'opt-in', 'assist'], action: { type: 'open-service' } },
  { id: 'set-voice', title: 'OS voice and mute', keywords: ['speech', 'speechSynthesis'], view: 'settings', panel: 'kernelCustomizeForm' },
  { id: 'set-presence', title: 'Presence look', keywords: ['orb', 'hologram', 'companion'], view: 'settings', panel: 'kernelCustomizeForm' },
  { id: 'set-modules', title: 'Feature modules', keywords: ['registry', 'toggle'], view: 'settings', panel: 'kernelCustomizeForm' },
  { id: 'set-accessibility', title: 'Accessibility or interaction needs', keywords: ['reduced motion', 'keyboard-first', 'screen reader'], view: 'settings', panel: 'assistantBehaviorForm' },
  { id: 'set-backups', title: 'Local backups', keywords: ['snapshot', 'restore'], view: 'settings' },
  { id: 'set-updates', title: 'Software updates', keywords: ['github', 'sha-256'], action: { type: 'open-updates' } }
]);

export const CHEATSHEET_ENTRIES = Object.freeze([
  { keys: 'Ctrl+K', also: 'Ctrl+P', id: 'palette', summary: 'Command palette — jump to views, intents, settings, legal, modules, overlays, and linked apps.' },
  { keys: 'Ctrl+Shift+O', id: 'overlays', summary: 'Jump to the Play desk overlay menu (chat, browse, Discord guest). In-app only — does not fire inside other games.' },
  { keys: 'Ctrl+/', also: '?', id: 'cheatsheet', summary: 'Keyboard cheatsheet. ? is ignored while a text field is focused.' },
  { keys: 'Ctrl+A', id: 'admin', summary: 'Private administrator panel. Does not steal select-all from input, textarea, or select fields.' },
  { keys: 'Esc', id: 'escape', summary: 'Close palette, cheatsheet, legal, admin, or cancelable setup overlays.' },
  { keys: 'Enter', id: 'send', summary: 'Send the conversation. Shift+Enter inserts a new line.' }
]);

export function defaultWorkspaceLayers() {
  return {
    widgets: {
      order: [...DEFAULT_WIDGET_ORDER],
      hidden: [...DEFAULT_WIDGET_HIDDEN]
    },
    focus: {
      active: false,
      startedAt: null,
      durationMs: FOCUS_DEFAULT_MINUTES * 60 * 1000,
      label: '',
      quiet: true,
      completedAt: null
    },
    scratchpad: { text: '', updatedAt: null },
    recents: [],
    favorites: []
  };
}

function uniqueIds(list, allowed) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const id = String(raw || '').trim();
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function normalizeWorkspaceLayers(input, prev = defaultWorkspaceLayers()) {
  const base = defaultWorkspaceLayers();
  const incoming = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const prior = prev && typeof prev === 'object' && !Array.isArray(prev) ? prev : base;
  const allowed = new Set(WIDGET_IDS);
  const widgetsIn = incoming.widgets && typeof incoming.widgets === 'object' ? incoming.widgets : (prior.widgets || {});
  let order = uniqueIds(widgetsIn.order, allowed);
  for (const id of DEFAULT_WIDGET_ORDER) {
    if (!order.includes(id)) order.push(id);
  }
  for (const id of WIDGET_IDS) {
    if (!order.includes(id)) order.push(id);
  }
  const hidden = uniqueIds(widgetsIn.hidden, allowed).filter(id => order.includes(id));
  const focusIn = incoming.focus && typeof incoming.focus === 'object' ? incoming.focus : (prior.focus || {});
  const durationMs = clampDurationMs(focusIn.durationMs, base.focus.durationMs);
  const scratchIn = incoming.scratchpad && typeof incoming.scratchpad === 'object' ? incoming.scratchpad : (prior.scratchpad || {});
  return {
    widgets: { order, hidden },
    focus: {
      active: focusIn.active === true,
      startedAt: focusIn.startedAt ? String(focusIn.startedAt).slice(0, 40) : null,
      durationMs,
      label: String(focusIn.label || '').trim().slice(0, 120),
      quiet: focusIn.quiet !== false,
      completedAt: focusIn.completedAt ? String(focusIn.completedAt).slice(0, 40) : null
    },
    scratchpad: {
      text: String(scratchIn.text || '').slice(0, 4000),
      updatedAt: scratchIn.updatedAt ? String(scratchIn.updatedAt).slice(0, 40) : null
    },
    recents: normalizeRecents(incoming.recents !== undefined ? incoming.recents : prior.recents),
    favorites: uniqueStrings(incoming.favorites !== undefined ? incoming.favorites : prior.favorites, 24, 80)
  };
}

function uniqueStrings(value, limit, maxLen) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map(item => String(item || '').trim().slice(0, maxLen)).filter(Boolean))].slice(0, limit);
}

function normalizeRecents(list) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(list) ? list : []) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.id || '').trim().slice(0, 80);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      title: String(item.title || id).trim().slice(0, 120),
      kind: String(item.kind || 'command').trim().slice(0, 24),
      at: item.at ? String(item.at).slice(0, 40) : null
    });
    if (out.length >= 12) break;
  }
  return out;
}

function clampDurationMs(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const min = FOCUS_MIN_MINUTES * 60 * 1000;
  const max = FOCUS_MAX_MINUTES * 60 * 1000;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function ensureWorkspace(state) {
  if (!state.kernel || typeof state.kernel !== 'object') state.kernel = {};
  state.kernel.workspace = normalizeWorkspaceLayers(state.kernel.workspace);
  return state.kernel.workspace;
}

export function visibleWidgets(workspace) {
  const layers = normalizeWorkspaceLayers(workspace);
  return layers.widgets.order.filter(id => !layers.widgets.hidden.includes(id));
}

export function pinWidget(state, id) {
  const workspace = ensureWorkspace(state);
  const key = String(id || '').trim();
  if (!WIDGET_IDS.includes(key)) return workspace;
  workspace.widgets.hidden = workspace.widgets.hidden.filter(item => item !== key);
  if (!workspace.widgets.order.includes(key)) workspace.widgets.order.push(key);
  return workspace;
}

export function unpinWidget(state, id) {
  const workspace = ensureWorkspace(state);
  const key = String(id || '').trim();
  if (!WIDGET_IDS.includes(key)) return workspace;
  if (!workspace.widgets.hidden.includes(key)) workspace.widgets.hidden.push(key);
  return workspace;
}

export function reorderWidgets(state, order) {
  const workspace = ensureWorkspace(state);
  workspace.widgets = normalizeWorkspaceLayers({ ...workspace, widgets: { ...workspace.widgets, order } }).widgets;
  return workspace;
}

export function parseFocusMinutes(input, fallback = FOCUS_DEFAULT_MINUTES) {
  const match = String(input || '').match(/\b(\d{1,3})\s*(?:m|min|mins|minute|minutes)\b/i);
  const n = match ? Number(match[1]) : fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FOCUS_MIN_MINUTES, Math.min(FOCUS_MAX_MINUTES, Math.round(n)));
}

export function isFocusStartCommand(input) {
  const t = String(input || '').toLowerCase();
  return /\b(start|begin|kick\s*off)\b[\s\S]{0,40}\bfocus\b/.test(t)
    || /\bfocus\s+(?:session\s+)?(?:start|on|now)\b/.test(t);
}

export function isFocusStopCommand(input) {
  const t = String(input || '').toLowerCase();
  return /\b(stop|end|cancel|finish)\b[\s\S]{0,32}\bfocus\b/.test(t);
}

export function isScratchCaptureCommand(input) {
  const t = String(input || '').toLowerCase();
  return /^(note:|scratch:|capture\s+(this\s+)?(scratch(pad)?|note)|save\s+(this\s+)?(scratch(pad)?|note)\s+to\s+memory)\b/.test(t)
    || /\b(capture|save)\b[\s\S]{0,24}\bscratch(pad)?\b/.test(t);
}

export function scratchBodyFromInput(input) {
  return String(input || '').replace(/^(note:|scratch:|remember this scratch:?)\s*/i, '').trim().slice(0, 4000);
}

export function focusRemainingMs(focus, now = Date.now()) {
  const session = focus && typeof focus === 'object' ? focus : {};
  if (session.active !== true || !session.startedAt) return 0;
  const start = Date.parse(session.startedAt);
  if (!Number.isFinite(start)) return 0;
  const duration = clampDurationMs(session.durationMs, FOCUS_DEFAULT_MINUTES * 60 * 1000);
  return Math.max(0, start + duration - now);
}

export function expireFocusIfNeeded(state, now = Date.now()) {
  const workspace = ensureWorkspace(state);
  if (workspace.focus.active === true && focusRemainingMs(workspace.focus, now) <= 0) {
    workspace.focus.active = false;
    workspace.focus.completedAt = new Date(now).toISOString();
  }
  return workspace.focus;
}

export function startFocusSession(state, { minutes, label, at, now } = {}) {
  const workspace = ensureWorkspace(state);
  const stamp = at || new Date(now || Date.now()).toISOString();
  const mins = Number.isFinite(Number(minutes))
    ? Math.max(FOCUS_MIN_MINUTES, Math.min(FOCUS_MAX_MINUTES, Math.round(Number(minutes))))
    : FOCUS_DEFAULT_MINUTES;
  workspace.focus = {
    active: true,
    startedAt: stamp,
    durationMs: mins * 60 * 1000,
    label: String(label || '').trim().slice(0, 120),
    quiet: true,
    completedAt: null
  };
  const when = stamp;
  if (!Array.isArray(state.audit)) state.audit = [];
  state.audit.push({ at: when, type: 'workspace.focus_start', details: { minutes: mins, quiet: true, killsOtherProcesses: false } });
  return workspace.focus;
}

export function stopFocusSession(state, { at, now } = {}) {
  const workspace = ensureWorkspace(state);
  const stamp = at || new Date(now || Date.now()).toISOString();
  workspace.focus.active = false;
  workspace.focus.completedAt = stamp;
  if (!Array.isArray(state.audit)) state.audit = [];
  state.audit.push({ at: stamp, type: 'workspace.focus_stop', details: { quiet: true } });
  return workspace.focus;
}

export function saveScratchpad(state, text, { at } = {}) {
  const workspace = ensureWorkspace(state);
  const stamp = at || new Date().toISOString();
  workspace.scratchpad = {
    text: String(text || '').slice(0, 4000),
    updatedAt: stamp
  };
  return workspace.scratchpad;
}

export function captureScratchToMemory(state, { at, extra } = {}) {
  const workspace = ensureWorkspace(state);
  const body = String(extra || workspace.scratchpad.text || '').trim();
  if (!body) return null;
  const memory = addMemory(state, body, {
    kind: 'note',
    source: 'scratchpad',
    confidence: 0.9,
    tags: ['scratchpad', 'note'],
    provenance: { channel: 'scratchpad' }
  });
  const stamp = at || memory.createdAt;
  workspace.scratchpad = { text: '', updatedAt: stamp };
  return memory;
}

export function recordRecent(state, item, { at } = {}) {
  const workspace = ensureWorkspace(state);
  const id = String(item?.id || '').trim().slice(0, 80);
  if (!id) return workspace.recents;
  const next = {
    id,
    title: String(item.title || id).trim().slice(0, 120),
    kind: String(item.kind || 'command').trim().slice(0, 24),
    at: at || new Date().toISOString()
  };
  workspace.recents = [next, ...workspace.recents.filter(entry => entry.id !== id)].slice(0, 12);
  return workspace.recents;
}

export function toggleFavorite(state, id) {
  const workspace = ensureWorkspace(state);
  const key = String(id || '').trim().slice(0, 80);
  if (!key) return workspace.favorites;
  if (workspace.favorites.includes(key)) workspace.favorites = workspace.favorites.filter(item => item !== key);
  else workspace.favorites = [key, ...workspace.favorites].slice(0, 24);
  return workspace.favorites;
}

function haystack(item) {
  return [item.title, item.summary, item.label, ...(item.keywords || [])].filter(Boolean).join(' ').toLowerCase();
}

export function scoreMatch(query, item) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return item.boost || 1;
  const title = String(item.title || '').toLowerCase();
  const blob = haystack(item);
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 70;
  if (blob.includes(q)) return 50;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length && parts.every(part => blob.includes(part))) return 35;
  return 0;
}

export function filterItems(query, items, limit = 24) {
  const list = Array.isArray(items) ? items : [];
  const q = String(query || '').trim();
  const ranked = list
    .map(item => ({ item, score: scoreMatch(q, item) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title)));
  return ranked.slice(0, limit).map(entry => entry.item);
}

function action(type, extra = {}) {
  return { type, auto: false, ...extra };
}

export function builtinPaletteItems({
  modules = builtinModules,
  customActions = [],
  recents = [],
  favorites = [],
  enabledOf
} = {}) {
  const enabled = typeof enabledOf === 'function' ? enabledOf : (() => true);
  const views = [
    { id: 'view-dashboard', kind: 'view', title: 'Dashboard', keywords: ['home', 'workspace', 'tiles'], action: action('open-view', { view: 'dashboard', label: 'Open Dashboard' }) },
    { id: 'view-chat', kind: 'view', title: 'Conversation', keywords: ['chat', 'talk', 'composer'], action: action('open-view', { view: 'chat', label: 'Open conversation' }) },
    { id: 'view-apps', kind: 'view', title: 'Apps & Gaming', keywords: ['launch', 'windows', 'start menu'], action: action('open-view', { view: 'apps', label: 'Open Apps & Gaming' }) },
    { id: 'view-entertainment', kind: 'view', title: 'Entertainment', keywords: ['media', 'music', 'mix'], action: action('open-view', { view: 'entertainment', label: 'Open Entertainment' }) },
    { id: 'view-memory', kind: 'view', title: 'Memory', keywords: ['notes', 'remember'], action: action('open-view', { view: 'memory', label: 'Open Memory' }) },
    { id: 'view-identity', kind: 'view', title: 'Identity & consent', keywords: ['adult mode', 'self-model'], action: action('open-view', { view: 'identity', label: 'Identity & consent' }) },
    { id: 'view-settings', kind: 'view', title: 'Settings', keywords: ['engine', 'provider', 'backups'], action: action('open-view', { view: 'settings', label: 'Open Settings' }) }
  ];
  const commands = [
    { id: 'cmd-focus-start', kind: 'command', title: 'Start 25-minute focus session', keywords: ['timer', 'quiet', 'pomodoro'], action: action('start-focus', { minutes: 25, label: 'Focus session' }) },
    { id: 'cmd-focus-stop', kind: 'command', title: 'Stop focus session', keywords: ['end timer'], action: action('stop-focus') },
    { id: 'cmd-scratch-capture', kind: 'command', title: 'Capture scratchpad to memory', keywords: ['note', 'remember', 'local'], action: action('capture-scratch') },
    { id: 'cmd-cheatsheet', kind: 'command', title: 'Keyboard cheatsheet', keywords: ['shortcuts', 'hotkeys', 'help', 'ctrl+/'], action: action('open-cheatsheet') },
    { id: 'cmd-setup', kind: 'command', title: 'Assistant setup', keywords: ['roles'], action: action('open-setup', { label: 'Assistant setup' }) },
    { id: 'cmd-diagnostics', kind: 'command', title: 'Show diagnostics', keywords: ['health', 'gpu'], action: action('open-diagnostics', { label: 'Show diagnostics' }) },
    { id: 'cmd-service', kind: 'command', title: 'Eidovara service settings', keywords: ['worker', 'connect'], action: action('open-service', { label: 'Service settings' }) },
    { id: 'cmd-legal-about', kind: 'legal', title: 'About & legal', keywords: ['unsigned', 'source-available'], action: action('open-legal', { legal: 'about', label: 'About & legal' }) },
    { id: 'cmd-legal-terms', kind: 'legal', title: 'Terms of use', keywords: ['legal'], action: action('open-legal', { legal: 'terms', label: 'Terms' }) },
    { id: 'cmd-legal-privacy', kind: 'legal', title: 'Privacy notice', keywords: ['telemetry', 'local-first'], action: action('open-legal', { legal: 'privacy', label: 'Privacy' }) },
    { id: 'cmd-legal-age', kind: 'legal', title: 'Age 18+', keywords: ['adults only'], action: action('open-legal', { legal: 'age', label: 'Age 18+' }) },
    ...overlayPaletteItems()
  ];
  const moduleItems = (Array.isArray(modules) ? modules : []).filter(mod => enabled(mod.id)).map(mod => ({
    id: `mod-${mod.id}`,
    kind: 'module',
    title: mod.title,
    summary: mod.summary,
    keywords: [...(mod.commands || []), ...(mod.intents || [])],
    action: action('open-view', { view: mod.ui?.view || 'chat', panel: mod.ui?.panel || '', label: mod.title })
  }));
  const custom = (Array.isArray(customActions) ? customActions : []).map(item => ({
    id: `act-${item.id}`,
    kind: 'custom',
    title: item.label,
    keywords: [item.command, item.intent],
    action: action('run-command', { command: item.command, view: item.view || 'chat' })
  }));
  const favSet = new Set(Array.isArray(favorites) ? favorites : []);
  const recentItems = (Array.isArray(recents) ? recents : []).map(item => ({
    ...item,
    kind: 'recent',
    keywords: ['recent'],
    action: item.action || action('open-view', { view: 'dashboard' }),
    boost: 8
  }));
  return [...recentItems, ...views, ...commands, ...moduleItems, ...custom].map(item => ({
    ...item,
    favorite: favSet.has(item.id)
  }));
}

export function filterPalette(query, items) {
  return filterItems(query, items, 20);
}

export function searchWorkspace(query, {
  apps = [],
  memories = [],
  modules = builtinModules,
  customActions = [],
  recents = [],
  favorites = [],
  enabledOf
} = {}) {
  const palette = builtinPaletteItems({ modules, customActions, recents, favorites, enabledOf });
  const settingItems = SETTINGS_LABELS.map(item => ({
    id: item.id,
    kind: 'setting',
    title: item.title,
    keywords: item.keywords || [],
    action: item.action || action('open-view', { view: item.view || 'settings', panel: item.panel || '', label: item.title })
  }));
  const knowledgeItems = Object.entries(DESKTOP_KNOWLEDGE_ENTRIES).map(([id, entry]) => ({
    id: `know-${id}`,
    kind: 'knowledge',
    title: entry.title,
    keywords: [id, 'help', 'product'],
    action: (entry.actions && entry.actions[0]) || action('run-command', { command: entry.title })
  }));
  const memoryItems = (Array.isArray(memories) ? memories : []).filter(item => item && item.active !== false).map(item => ({
    id: `mem-${item.id}`,
    kind: 'memory',
    title: String(item.content || '').slice(0, 120),
    keywords: item.tags || [],
    action: action('open-view', { view: 'memory', label: 'Open Memory' })
  }));
  const appItems = (Array.isArray(apps) ? apps : []).map(app => ({
    id: `app-${app.id}`,
    kind: 'app',
    title: app.name || 'Linked app',
    keywords: [app.path, 'launch', 'confirm'],
    action: action('confirm-launch-app', { appId: app.id, label: app.name })
  }));
  return filterItems(query, [...palette, ...settingItems, ...knowledgeItems, ...memoryItems, ...appItems], 24);
}

export function cheatsheetEntries({ voiceInput = false } = {}) {
  const rows = [...CHEATSHEET_ENTRIES];
  if (voiceInput) {
    rows.push({
      keys: 'Hold 🎙',
      id: 'dictate',
      summary: 'Hold the dictation control to talk; release to stop. Uses OS speech recognition. Eidovara does not ship a neural TTS engine.'
    });
  }
  return rows;
}

export function workspacePublicView(workspace, now = Date.now()) {
  const layers = normalizeWorkspaceLayers(workspace);
  return {
    widgets: {
      order: layers.widgets.order,
      hidden: layers.widgets.hidden,
      visible: visibleWidgets(layers)
    },
    focus: {
      ...layers.focus,
      remainingMs: layers.focus.active ? focusRemainingMs(layers.focus, now) : 0
    },
    scratchpad: layers.scratchpad,
    recents: layers.recents,
    favorites: layers.favorites
  };
}

