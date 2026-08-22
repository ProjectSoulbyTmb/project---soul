// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { classifyWorkspaceIntent } from './workspace.js';
import { knowledgeEntry, matchProductIntent, shouldUseKnowledgeReply } from './knowledge.js';

export { shouldUseKnowledgeReply };

export const COMPANION_NETWORK = Object.freeze({
  localOnly: true,
  network: false,
  workerAssist: false,
  transcriptsUploaded: false,
});

const NAV_RULES = [
  {
    id: 'apps',
    re: /\b(?:open|show|go\s+to|take\s+me\s+to|launch)\b[\s\S]{0,48}\b(?:apps?(?:\s*&\s*gaming)?|gaming\s+hub)\b/i,
  },
  {
    id: 'entertainment',
    re: /\b(?:open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\bentertainment\b/i,
  },
  { id: 'memory', re: /\b(?:open|show|go\s+to|take\s+me\s+to)\b[\s\S]{0,40}\bmemory\b/i },
  {
    id: 'identity',
    re: /\b(?:open|show|go\s+to)\b[\s\S]{0,40}\b(?:identity|consent|adult\s+mode)\b/i,
  },
  { id: 'status', re: /\b(?:open|show|go\s+to)\b[\s\S]{0,40}\b(?:settings|diagnostics|status)\b/i },
  { id: 'legal', re: /\b(?:open|show|read)\b[\s\S]{0,40}\b(?:legal|terms|privacy|age\s*18)\b/i },
  {
    id: 'setup',
    re: /\b(?:open|show|configure)\b[\s\S]{0,40}\b(?:assistant\s+setup|soul\s+setup|setup\s+roles)\b/i,
  },
];

const WORKSPACE_KEEP = new Set([
  'focus',
  'gaming',
  'study',
  'create',
  'research',
  'mood',
  'favorites',
  'watch',
  'gaming-ost',
  'study-ost',
  'surprise',
  'talk',
  'reassure',
  'growth',
  'remember',
  'apps',
  'memory',
  'overlay-chat',
  'overlay-browse',
  'overlay-discord',
  'overlays',
]);

export function soulOverlay(state = {}) {
  const enabled = state.setup?.completed === true;
  const policy = state.policy || {};
  const adult =
    policy.mode === 'adult' &&
    policy.adultSoulEnabled === true &&
    policy.currentConsent === true &&
    policy.adultStatusConfirmed === true;
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
      : 'Optional Soul setup is off. This workspace companion is not Soul and is not conscious.',
  };
}

export function classifyCompanionIntent(input) {
  const text = String(input || '');
  if (!text.trim()) return 'empty';
  for (const rule of NAV_RULES) {
    if (rule.re.test(text)) return rule.id;
  }
  const workspace = classifyWorkspaceIntent(text);
  if (workspace === 'research') return 'research';
  if (WORKSPACE_KEEP.has(workspace)) return workspace;
  const product = matchProductIntent(text);
  if (product) return product;
  return workspace;
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
      return [
        action('open-view', {
          view: 'entertainment',
          label: 'Open Entertainment',
          auto: intent === 'entertainment',
        }),
      ];
    case 'memory':
      return [action('open-view', { view: 'memory', label: 'Open Memory', auto: true })];
    case 'identity':
      return [action('open-view', { view: 'identity', label: 'Identity & consent', auto: true })];
    case 'status':
      return [
        action('open-diagnostics', { label: 'Show diagnostics', auto: true }),
        action('open-service', { label: 'Service settings' }),
      ];
    case 'setup':
      return [action('open-setup', { label: 'Assistant setup', auto: true })];
    case 'focus':
    case 'study':
    case 'create':
    case 'talk':
      return [action('open-view', { view: 'dashboard', label: 'Stay on workspace' })];
    case 'gaming':
      return [action('open-view', { view: 'apps', label: 'Apps & Gaming' })];
    case 'overlay-chat':
      return [
        action('open-chat-overlay', { label: 'Soul chat overlay' }),
        action('open-overlay', { kind: 'chat', label: 'Soul chat overlay' }),
      ];
    case 'overlay-browse':
      return [
        action('open-browse-overlay', { label: 'Browse overlay' }),
        action('open-overlay', { kind: 'browse', label: 'Browse overlay' }),
      ];
    case 'overlay-discord':
      return [
        action('open-discord-overlay', { label: 'Discord guest overlay' }),
        action('open-overlay', { kind: 'discord', label: 'Discord guest overlay' }),
      ];
    case 'overlays':
      return [
        action('open-view', { view: 'apps', label: 'Play desk', auto: true }),
        action('open-chat-overlay', { label: 'Soul chat overlay' }),
      ];
    case 'research':
      return [action('open-view', { view: 'chat', label: 'Open conversation' })];
    default: {
      const entry = knowledgeEntry(intent);
      if (entry?.actions?.length) {
        return entry.actions.map(item => action(item.type, item));
      }
      return overlay.enabled
        ? [action('open-view', { view: 'identity', label: 'Soul identity' })]
        : [action('open-setup', { label: 'Optional Soul setup' })];
    }
  }
}

export function answerCompanion(input, { state } = {}) {
  const overlay = soulOverlay(state);
  const text = String(input || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) {
    return {
      ok: false,
      code: 'empty',
      intent: 'empty',
      knowledgeId: null,
      usedKnowledge: false,
      reply:
        'Ask a short question about this workspace, 18+, legal notices, or a next step. Answers stay on this PC.',
      actions: [
        action('open-view', { view: 'apps', label: 'Apps & Gaming' }),
        action('open-legal', { legal: 'about', label: 'Legal' }),
        action('open-setup', {
          label: overlay.enabled ? 'Adjust Soul setup' : 'Optional Soul setup',
        }),
      ],
      soul: overlay,
      ...COMPANION_NETWORK,
    };
  }
  const intent = classifyCompanionIntent(text);
  const entry = knowledgeEntry(intent);
  const usedKnowledge = shouldUseKnowledgeReply(intent) && Boolean(entry);
  const reply = usedKnowledge ? entry.reply : null;
  return {
    ok: true,
    code: usedKnowledge ? 'match' : 'workspace',
    intent,
    knowledgeId: usedKnowledge ? intent : null,
    usedKnowledge,
    reply,
    actions: actionsForIntent(intent, overlay),
    soul: overlay,
    ...COMPANION_NETWORK,
  };
}

export function companionPublicMeta(result) {
  const value = result && typeof result === 'object' ? result : {};
  return {
    intent: String(value.intent || 'general'),
    knowledgeId: value.knowledgeId || null,
    usedKnowledge: Boolean(value.usedKnowledge),
    actions: Array.isArray(value.actions)
      ? value.actions
          .map(item => ({
            type: String(item.type || ''),
            view: item.view || undefined,
            legal: item.legal || undefined,
            kind: item.kind ? String(item.kind).slice(0, 20) : undefined,
            url: item.url ? String(item.url).slice(0, 500) : undefined,
            label: String(item.label || '').slice(0, 80),
            auto: Boolean(item.auto),
          }))
          .filter(item => item.type)
      : [],
    soul: {
      enabled: Boolean(value.soul?.enabled),
      name: value.soul?.enabled ? String(value.soul?.name || 'Soul') : null,
      adultMode: Boolean(value.soul?.adultMode),
      sentience: false,
      label: String(value.soul?.label || ''),
    },
    localOnly: true,
    network: false,
    workerAssist: false,
    transcriptsUploaded: false,
  };
}
