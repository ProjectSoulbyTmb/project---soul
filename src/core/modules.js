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
    id: 'workspace-apps',
    title: 'Apps & Gaming',
    summary: 'Windows shelf of titles you already trust. Confirm-launch only — no injection.',
    intents: ['apps'],
    commands: ['open apps', 'launch an app', 'discover installed apps'],
    workspace: 'apps',
    ui: { view: 'apps' }
  },
  {
    id: 'workspace-media',
    title: 'Entertainment',
    summary: 'Local taste, queue helpers, and lawful Spotify/YouTube HTTPS handoff.',
    intents: ['mood', 'favorites', 'watch', 'gaming-ost', 'study-ost', 'surprise'],
    commands: ['mood mix', 'surprise me', 'open entertainment'],
    workspace: 'entertainment',
    ui: { view: 'entertainment' }
  },
  {
    id: 'workspace-research',
    title: 'Research',
    summary: 'Explicit internet/web/online lookups via Wikipedia/Wikimedia. Stays off until you ask.',
    intents: ['research'],
    commands: ['search the internet', 'research online'],
    workspace: 'chat',
    ui: { view: 'chat' }
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
    intents: ['settings'],
    commands: ['open settings', 'show settings'],
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
    summary: 'One outcome, 25–50 minutes, then a stop. No other-process control.',
    intents: ['focus'],
    commands: ['plan a focused session', 'focus session'],
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
    summary: 'Checklists for play or stream. No OBS websocket control in this release.',
    intents: ['gaming'],
    commands: ['prepare my gaming', 'stream helper'],
    workspace: 'apps',
    ui: { view: 'apps' }
  },
  {
    id: 'memory-keeper',
    title: 'Memory',
    summary: 'Durable local notes you can review or forget. Your data, not system authority.',
    intents: ['memory', 'remember'],
    commands: ['review memory', 'remember that'],
    workspace: 'memory',
    ui: { view: 'memory' }
  },
  {
    id: 'talk-through',
    title: 'Talk-through',
    summary: 'Slow conversation, reassurance, and growth framing. Not therapy.',
    intents: ['talk', 'reassure', 'growth', 'thanks', 'hello', 'identity'],
    commands: ['talk something through', 'who are you'],
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
    summary: 'Self-model, Adult Mode triple gate, and revocable consent.',
    intents: ['identity-panel'],
    commands: ['open identity', 'adult mode'],
    workspace: 'identity',
    ui: { view: 'identity' }
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
