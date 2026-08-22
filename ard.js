// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { defaultKernelState, migrateKernel } from './kernel.js';

export const CURRENT_SCHEMA_VERSION = 19;

export function defaultProfile(profileId = 'default') {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profileId,
    createdAt: now,
    updatedAt: now,
    continuity: {
      revision: 1,
      lastActiveAt: now,
      reflectionState: { growthInsightCount: 0, latestReflection: 'Soul begins from humility, care, and user-directed growth.', activeTheme: 'baseline-continuity' },
      selfModel: {
        name: 'Soul',
        architecture: 'persistent software continuity and self-model; not a claim of phenomenal consciousness',
        protectedIdentity: true,
        coreValues: ['humility', 'user autonomy', 'consent', 'non-manipulation', 'careful learning', 'bounded honesty']
      }
    },
    personality: {
      warmth: 0.62, curiosity: 0.70, assertiveness: 0.36, playfulness: 0.40,
      directness: 0.46, reassurance: 0.55, adaptability: 0.68, humility: 0.72,
      protected: ['humility', 'consent', 'nonManipulation', 'truthfulness']
    },
    relationship: { style: 'balanced', temporaryInitiative: false, initiativeReason: null, establishedPreference: null, trust: 0.50, comfort: 0.50, auditTrail: [] },
    assistant: { autonomy: 'balanced', initiativeEnabled: true, reflectionEnabled: true, identityDescription: 'persistent simulated continuity', ethicalFramework: ['lawfulness', 'human safety', 'consent', 'privacy', 'honesty', 'fairness', 'user autonomy'], preferences: { responseLength: 'balanced', tone: 'natural', focusMode: 'general', accessibility: '', language: 'en' }, capabilities: { webResearch: 'ask', appLaunch: 'confirm', mediaPlayback: 'confirm', memoryLearning: 'enabled' } },
    policy: { mode: 'standard', adultSoulEnabled: false, adultStatusConfirmed: false, currentConsent: false, boundaries: [], revokedAt: null, consentScope: null, lawfulUseRequired: true, localSafetyReports: [] },
    setup: { completed: false, completedAt: null, categories: [], customNeeds: '', stream: { enabled: false, obsWebSocketUrl: 'ws://127.0.0.1:4455', goals: '' } },
    entertainment: { favorites: [], history: [], taste: {}, adult: { watchLater: [], playlists: [], creators: [], continueWatching: [], lastCategory: 'for-you', folders: [] } },
    adultSoul: { schema: 3, kind: 'adult-soul-studio', active: false },
    memories: [], feedback: [], conversations: [{ id: 'main', title: 'Conversation', createdAt: now, updatedAt: now, messages: [] }],
    activeConversationId: 'main',
    kernel: defaultKernelState(),
    audit: [{ at: now, type: 'profile.created', details: { profileId } }]
  };
}

export function migrateProfile(input, profileId = 'default') {
  const base = defaultProfile(profileId);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const merged = {
    ...base, ...input,
    continuity: { ...base.continuity, ...(input.continuity || {}), selfModel: { ...base.continuity.selfModel, ...(input.continuity?.selfModel || {}) }, reflectionState: { ...base.continuity.reflectionState, ...(input.continuity?.reflectionState || {}) } },
    personality: { ...base.personality, ...(input.personality || {}) },
    relationship: { ...base.relationship, ...(input.relationship || {}) },
    assistant: { ...base.assistant, ...(input.assistant || {}), preferences: { ...base.assistant.preferences, ...(input.assistant?.preferences || {}) }, capabilities: { ...base.assistant.capabilities, ...(input.assistant?.capabilities || {}) } },
    policy: { ...base.policy, ...(input.policy || {}) },
    setup: { ...base.setup, ...(input.setup || {}), stream: { ...base.setup.stream, ...(input.setup?.stream || {}) } },
    entertainment: { ...base.entertainment, ...(input.entertainment || {}) },
    kernel: migrateKernel(input.kernel)
  };
  if (!Array.isArray(merged.memories)) merged.memories = [];
  if (!Array.isArray(merged.feedback)) merged.feedback = [];
  if (!Array.isArray(merged.audit)) merged.audit = [];
  if (!Array.isArray(merged.conversations) || merged.conversations.length === 0) merged.conversations = base.conversations;
  merged.conversations = merged.conversations.filter(c => c && typeof c === 'object').map((c, index) => ({
    id: String(c.id || uid('conv')), title: String(c.title || `Conversation ${index + 1}`).slice(0, 120),
    createdAt: c.createdAt || base.createdAt, updatedAt: c.updatedAt || c.createdAt || base.updatedAt,
    messages: Array.isArray(c.messages) ? c.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string') : []
  }));
  if (!merged.conversations.length) merged.conversations = base.conversations;
  if (!Array.isArray(merged.policy.boundaries)) merged.policy.boundaries = [];
  if (!Array.isArray(merged.policy.localSafetyReports)) merged.policy.localSafetyReports = [];
  if (!Array.isArray(merged.setup.categories)) merged.setup.categories = [];
  if (!Array.isArray(merged.entertainment.favorites)) merged.entertainment.favorites = [];
  if (!Array.isArray(merged.entertainment.history)) merged.entertainment.history = [];
  if (!merged.entertainment.taste || typeof merged.entertainment.taste !== 'object' || Array.isArray(merged.entertainment.taste)) merged.entertainment.taste = {};
  if (!merged.entertainment.adult || typeof merged.entertainment.adult !== 'object' || Array.isArray(merged.entertainment.adult)) {
    merged.entertainment.adult = base.entertainment.adult;
  }
  if (!merged.adultSoul || typeof merged.adultSoul !== 'object' || Array.isArray(merged.adultSoul)) {
    merged.adultSoul = base.adultSoul;
  }
  if (!Array.isArray(merged.relationship.auditTrail)) merged.relationship.auditTrail = [];
  if (!['user-led', 'balanced', 'proactive'].includes(merged.assistant.autonomy)) merged.assistant.autonomy = 'balanced';
  if (!Array.isArray(merged.assistant.ethicalFramework)) merged.assistant.ethicalFramework = [...base.assistant.ethicalFramework];
  if (!['concise','balanced','detailed'].includes(merged.assistant.preferences.responseLength)) merged.assistant.preferences.responseLength='balanced';
  if (!['natural','direct','warm','professional','playful'].includes(merged.assistant.preferences.tone)) merged.assistant.preferences.tone='natural';
  if (!['en','es','fr','de'].includes(merged.assistant.preferences.language)) merged.assistant.preferences.language='en';
  if (!merged.activeConversationId || !merged.conversations.some(c => c.id === merged.activeConversationId)) merged.activeConversationId = merged.conversations[0].id;
  merged.schemaVersion = CURRENT_SCHEMA_VERSION;
  merged.profileId ||= profileId;
  return merged;
}

export function clamp01(value) { return Math.max(0, Math.min(1, Number(value))); }
export function uid(prefix = 'id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; }

