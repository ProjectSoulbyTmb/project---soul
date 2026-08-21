// SPDX-FileCopyrightText: 2026 Tyler Michael Bosworth
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * First-party feature modules for the in-app Soul kernel.
 *
 * To add a module people can enjoy:
 *   1. Copy a descriptor below (id, title, summary, intents, commands, workspace, ui).
 *   2. Append it to builtinModules.
 *   3. If you need a new intent string, add it in workspace.js.
 * Settings and the companion dock pick the catalog up automatically.
 */

export function validateModule(mod) {
  if (!mod || typeof mod !== 'object' || Array.isArray(mod)) throw new Error('Module must be an object.');
  const id = String(mod.id || '').trim().slice(0, 64);
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(id)) throw new Error('Module id must be a lowercase slug.');
  const workspace = String(mod.workspace || 'chat').trim().slice(0, 40) || 'chat';
  const ui = mod.ui && typeof mod.ui === 'object' && !Array.isArray(mod.ui)
    ? { view: String(mod.ui.view || workspace).slice(0, 40), panel: String(mod.ui.panel || '').slice(0, 40) }
    : { view: workspace, panel: '' };
  return {
    id,
    title: String(mod.title || id).trim().slice(0, 80) || id,
    summary: String(mod.summary || '').trim().slice(0, 280),
    enabled: mod.enabled !== false,
    intents: uniqueStrings(mod.intents, 24, 40),
    commands: uniqueStrings(mod.commands, 24, 80),
    workspace,
    ui
  };
}

function uniqueStrings(value, limit, maxLen) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map(item => String(item || '').trim().slice(0, maxLen)).filter(Boolean))].slice(0, limit);
}

const catalog = [
  {
    id: 'workspace-home',
    title: 'Dashboard',
    summary: 'Command surface for this PC: focus, roles, apps, media, backups, and the companion dock.',
    intents: ['dashboard', 'here'],
    commands: ['open dashboard', 'what can you do here'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'workspace-apps',
    title: 'Apps & Gaming',
    summary: 'Windows shelf of titles you already trust. Confirm-launch only — no injection.',
    intents: ['apps', 'overlays', 'overlay-chat', 'overlay-browse', 'overlay-discord'],
    commands: ['open apps', 'launch an app', 'discover installed apps', 'open discord overlay', 'open browse overlay', 'open chat overlay'],
    workspace: 'apps',
    ui: { view: 'apps' }
  },
  {
    id: 'workspace-media',
    title: 'Entertainment',
    summary: 'Local taste, queue helpers, and lawful Spotify/YouTube HTTPS handoff.',
    intents: ['entertainment', 'mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise', 'local-media', 'adult-media', 'adult-media-blocked'],
    commands: ['mood mix', 'surprise me', 'open entertainment', 'open local media'],
    workspace: 'entertainment',
    ui: { view: 'entertainment' }
  },
  {
    id: 'workspace-research',
    title: 'Research',
    summary: 'Public web lookup after you ask. Not a full-internet index. Wikipedia/Wikimedia, Internet Archive, optional keyed search, pages you open, plus official YouTube/Spotify/Archive search links.',
    intents: ['research'],
    commands: ['search the internet', 'research online'],
    workspace: 'research',
    ui: { view: 'research' }
  },
  {
    id: 'workspace-help',
    title: 'Help',
    summary: 'Honest product facts: 18+, unsigned Windows, payments off, Assist ≠ Soul.',
    intents: ['help', 'what', 'hosted', 'download', 'unsigned', 'payments', 'premium', 'platforms', 'brands', 'forbidden', 'offline', 'connect', 'age', 'privacy', 'legal', 'status'],
    commands: ['what can you do', 'what is eidovara', 'help'],
    workspace: 'chat',
    ui: { view: 'chat' }
  },
  {
    id: 'workspace-settings',
    title: 'Settings',
    summary: 'Open conversation engine, backups, service attach, and customization.',
    intents: ['settings', 'backups', 'updates', 'service', 'setup', 'theme'],
    commands: ['open settings', 'show settings', 'create a backup', 'check for updates'],
    workspace: 'settings',
    ui: { view: 'settings' }
  },
  {
    id: 'workspace-access',
    title: 'Accessibility',
    summary: 'Readable pacing, reduced motion, keyboard-first next steps.',
    intents: ['accessibility'],
    commands: ['accessibility', 'reduced motion', 'keyboard-first'],
    workspace: 'settings',
    ui: { view: 'settings', panel: 'assistantBehaviorForm' }
  },
  {
    id: 'focus-session',
    title: 'Focus session',
    summary: 'A timed local block with remaining time and a quiet UI. No other-process control.',
    intents: ['focus', 'focus-stop'],
    commands: ['plan a focused session', 'start a focus session', 'stop focus session'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'command-palette',
    title: 'Command palette',
    summary: 'Ctrl+K / Ctrl+P jump to views, intents, settings, legal, modules, and companion commands.',
    intents: ['palette'],
    commands: ['open command palette', 'jump to'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'workspace-search',
    title: 'Local search',
    summary: 'Filter linked apps, memories, settings labels, and knowledge intents. No background crawler.',
    intents: ['search'],
    commands: ['search this workspace', 'find in memory'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'dashboard-widgets',
    title: 'Dashboard tiles',
    summary: 'Pin and reorder a few workspace tiles. Persisted on this PC. Not a fake OS shell.',
    intents: ['widgets'],
    commands: ['pin dashboard tiles', 'reorder widgets'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'scratchpad',
    title: 'Scratchpad',
    summary: 'Quick local capture to the dashboard pad or Memory. Stays on this device.',
    intents: ['scratch'],
    commands: ['capture scratchpad', 'quick note'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'hotkey-cheatsheet',
    title: 'Keyboard cheatsheet',
    summary: 'Ctrl+/, or ? away from fields. Lists Ctrl+K, Ctrl+A, and dictation when present.',
    intents: ['cheatsheet'],
    commands: ['keyboard shortcuts', 'cheatsheet'],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  },
  {
    id: 'study-coach',
    title: 'Study coach',
    summary: 'Plans and quizzes from what you give. Not a credentialed tutor.',
    intents: ['study'],
    commands: ['create a study plan', 'quiz me'],
    workspace: 'chat',
    ui: { view: 'chat' }
  },
  {
    id: 'creative-desk',
    title: 'Creative desk',
    summary: 'Outlines, prompts, and local notes. Licensed assets stay yours.',
    intents: ['create'],
    commands: ['start a creative project', 'create'],
    workspace: 'chat',
    ui: { view: 'chat' }
  },
  {
    id: 'gaming-prep',
    title: 'Gaming prep',
    summary: 'Checklists plus Eidovara glass overlays (chat, browse, Discord’s website). No game injection and no OBS websocket control.',
    intents: ['gaming', 'overlays', 'overlay-chat', 'overlay-browse', 'overlay-discord'],
    commands: ['prepare my gaming', 'stream helper', 'open discord overlay', 'open browse overlay'],
    workspace: 'apps',
    ui: { view: 'apps' }
  },
  {
    id: 'memory-keeper',
    title: 'Memory',
    summary: 'Durable local notes you can review or forget. Your data, not system authority.',
    intents: ['memory', 'remember', 'forget'],
    commands: ['review memory', 'remember that', 'forget that'],
    workspace: 'memory',
    ui: { view: 'memory' }
  },
  {
    id: 'talk-through',
    title: 'Talk-through',
    summary: 'Slow conversation, reassurance, and growth framing. Not therapy.',
    intents: ['talk', 'reassure', 'growth', 'thanks', 'hello', 'identity', 'conversation'],
    commands: ['talk something through', 'who are you', 'open conversation'],
    workspace: 'chat',
    ui: { view: 'chat' }
  },
  {
    id: 'companion-presence',
    title: 'Presence',
    summary: 'Orb, hologram, ambient, pulse, silhouette, or a local image. Not alive.',
    intents: ['presence'],
    commands: ['change presence', 'companion look'],
    workspace: 'settings',
    ui: { view: 'settings', panel: 'kernelCustomize' }
  },
  {
    id: 'identity-consent',
    title: 'Identity & consent',
    summary: 'Self-model, Adult Mode (admin panel until a later release), and revocable consent.',
    intents: ['identity-panel'],
    commands: ['open identity', 'adult mode'],
    workspace: 'identity',
    ui: { view: 'identity' }
  },
  {
    id: 'adult-soul-studio',
    title: 'Adult Soul studio',
    summary: 'Separate 21+ figure, Feel Sync pad, and guided sessions. Enablement is admin-panel only until a later release. Not a person.',
    intents: ['adult-soul', 'adult-session'],
    commands: ['open adult soul', 'feel pad', 'jerk off'],
    workspace: 'adultSoul',
    ui: { view: 'adultSoul' }
  },
  {
    id: 'quick-actions',
    title: 'Quick actions',
    summary: 'Your custom labels and commands. Stored only on this PC.',
    intents: ['custom'],
    commands: [],
    workspace: 'dashboard',
    ui: { view: 'dashboard' }
  }
];

export const builtinModules = catalog.map(validateModule);

export function moduleById(id) {
  return builtinModules.find(mod => mod.id === id) || null;
}

export function moduleForIntent(intent, list = builtinModules) {
  return list.find(mod => (mod.intents || []).includes(intent)) || null;
}
