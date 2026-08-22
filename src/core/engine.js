// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { JsonStore } from './store.js';
import { addMemory, forgetMemory } from './memory.js';
import { applyPolicyCommand, adultAllowed, assessRequestSafety } from './policy.js';
import { processLearning } from './learning.js';
import { reflectOnGrowth } from './growth.js';
import { updateRelationship } from './relationship.js';
import { uid } from './schema.js';
import { redactSecretsForLog } from './log-redact.js';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { OfflineProvider } from '../providers/offline.js';
import { buildSystemContext } from '../providers/context.js';
import {
  researchInternet,
  researchOpenActions,
  citeResearchInReply,
} from '../providers/internet.js';
import {
  entertainmentSummary,
  recordMediaEvent,
  discoverMedia,
  mergeMediaDiscovery,
  moodMix as computeMoodMix,
} from './entertainment.js';
import { isExplicitInternetRequest, isMediaDiscoveryRequest } from './workspace.js';
import {
  configureAdultSoul,
  deactivateAdultSoul,
  adultSoulView,
  startAdultSession,
  stopAdultSession,
  tickAdultSession,
  applyAdultCommand,
  addAdultClip,
  adultSoulReply,
} from './adult-soul.js';
import { buildAdultMediaDesk, configureAdultMedia, adultMediaReply } from './adult-media.js';
import {
  normalizeAdultFeel,
  publicStealth,
  feelSample,
  feelToPace,
  addBookmarkToFolder,
  adultFeelReply,
} from './adult-feel.js';
import {
  configureKernelState,
  createRuntimeRegistry,
  applyPhrasing,
  disabledModuleReply,
  kernelHeartbeat,
  kernelPublicMeta,
  kernelView,
  researchResultActions,
  routeKernel,
  startKernelSession,
} from './kernel.js';
import { requestSoulAssist } from './soul-online.js';
import { answerCompanion, companionPublicMeta } from './companion.js';
import {
  captureScratchToMemory,
  filterPalette,
  builtinPaletteItems,
  isFocusStartCommand,
  isFocusStopCommand,
  isScratchCaptureCommand,
  parseFocusMinutes,
  pinWidget,
  recordRecent,
  reorderWidgets,
  saveScratchpad,
  scratchBodyFromInput,
  searchWorkspace,
  startFocusSession,
  stopFocusSession,
  toggleFavorite,
  unpinWidget,
} from './layers.js';
import { setTelemetryEnabled, providerTelemetry, storeTelemetry } from './telemetry.js';

export class SoulEngine {
  constructor({ store, provider = new OfflineProvider(), internetOptions = {} } = {}) {
    this.store = store || new JsonStore();
    this.provider = provider;
    this.internetOptions = internetOptions;
    this.modules = createRuntimeRegistry();
    this.state = storeTelemetry.op('load', () => this.store.load());

    // Enable telemetry if explicitly configured
    const telemetryEnabled =
      process.env.EIDOVARA_TELEMETRY === '1' ||
      this.state?.assistant?.capabilities?.telemetry === 'enabled';
    setTelemetryEnabled(telemetryEnabled);

    startKernelSession(this.state);
    storeTelemetry.op('save', () => this.store.save(this.state));
  }
  setProvider(provider) {
    this.provider = provider || new OfflineProvider();
  }
  setInternetOptions(options = {}) {
    this.internetOptions = { ...(this.internetOptions || {}), ...options };
  }
  registerModule(mod) {
    return this.modules.register(mod);
  }
  kernelStatus() {
    return kernelView(this.state, this.modules);
  }
  heartbeat({ persist = false, at } = {}) {
    kernelHeartbeat(this.state, { at });
    if (persist) this.store.save(this.state);
    return this.kernelStatus();
  }
  configureKernel(input = {}) {
    configureKernelState(this.state, input);
    this.store.save(this.state);
    return this.snapshot();
  }
  searchWorkspace(query, extras = {}) {
    kernelHeartbeat(this.state);
    const kernel = this.state.kernel;
    return searchWorkspace(query, {
      apps: extras.apps || [],
      memories: this.state.memories || [],
      modules: this.modules.list(),
      customActions: kernel?.registry?.customActions || [],
      recents: kernel?.workspace?.recents || [],
      favorites: kernel?.workspace?.favorites || [],
      enabledOf: id => this.modules.enabled(id, kernel?.registry),
    });
  }
  paletteItems(query = '', extras = {}) {
    const kernel = this.state.kernel;
    const items = builtinPaletteItems({
      modules: this.modules.list(),
      customActions: kernel?.registry?.customActions || [],
      recents: kernel?.workspace?.recents || [],
      favorites: kernel?.workspace?.favorites || [],
      enabledOf: id => this.modules.enabled(id, kernel?.registry),
    });
    const filtered = filterPalette(query, items);
    return extras.apps ? this.searchWorkspace(query, extras) : filtered;
  }
  pinWidget(id) {
    pinWidget(this.state, id);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  unpinWidget(id) {
    unpinWidget(this.state, id);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  reorderWidgets(order) {
    reorderWidgets(this.state, order);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  startFocusSession(opts = {}) {
    startFocusSession(this.state, opts);
    kernelHeartbeat(this.state);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  stopFocusSession(opts = {}) {
    stopFocusSession(this.state, opts);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  saveScratchpad(text) {
    saveScratchpad(this.state, text);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  captureScratchpad(extra) {
    const memory = captureScratchToMemory(this.state, { extra });
    this.store.save(this.state);
    return { memory, kernel: this.kernelStatus(), state: this.snapshot() };
  }
  recordPaletteUse(item) {
    recordRecent(this.state, item);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  togglePaletteFavorite(id) {
    toggleFavorite(this.state, id);
    this.store.save(this.state);
    return this.kernelStatus();
  }
  async assistQuery(query, { base, fetchImpl } = {}) {
    kernelHeartbeat(this.state);
    const result = await requestSoulAssist({
      base,
      query,
      optIn: this.state.kernel?.soulOnline?.assistOptIn === true,
      fetchImpl,
    });
    const at = new Date().toISOString();
    this.state.audit.push({
      at,
      type: result.ok ? 'kernel.assist_ok' : 'kernel.assist_skipped',
      details: { reason: result.reason || '', conversationsSent: false, soul: false },
    });
    this.store.save(this.state);
    return result;
  }
  reset() {
    this.state = this.store.reset();
    startKernelSession(this.state);
    this.store.save(this.state);
    return this.snapshot();
  }
  markFunnel(stage) {
    if (!this.state || !this.state.funnel) return;
    const key = String(stage);
    if (!(key in this.state.funnel)) return;
    if (this.state.funnel[key]) return;
    this.state.funnel[key] = new Date().toISOString();
    this.store.save(this.state);
  }
  explainLastReply(id = this.state.activeConversationId) {
    const conv = this.state.conversations.find(c => c.id === id);
    const last = [...(conv?.messages || [])].reverse().find(m => m.role === 'assistant');
    if (!last) throw new Error('No explained assistant reply yet.');
    return { messageId: last.id, at: last.at, why: last.why || null };
  }
  moodMix(mood = 'focus', limit = 6) {
    return computeMoodMix(this.state, mood, limit);
  }
  snapshot() {
    const copy = JSON.parse(JSON.stringify(this.state));
    if (copy.adultSoul?.feel?.stealth) {
      copy.adultSoul.feel.stealth = publicStealth(copy.adultSoul.feel.stealth);
    }
    return copy;
  }
  remember(content, opts = {}) {
    const m = addMemory(this.state, content, opts);
    this.store.save(this.state);
    return m;
  }
  forget(idOrText) {
    const count = forgetMemory(this.state, idOrText);
    this.store.save(this.state);
    return count;
  }
  createBackup() {
    return this.store.createBackup(this.state);
  }
  listBackups() {
    return this.store.listBackups();
  }
  restoreBackup(name) {
    this.state = this.store.restoreBackup(name);
    startKernelSession(this.state);
    this.store.save(this.state);
    return this.snapshot();
  }
  recordMedia(input) {
    const event = recordMediaEvent(this.state, input);
    this.state.audit.push({
      at: event.at,
      type: `media.${event.event}`,
      details: { type: event.type, title: event.title },
    });
    this.store.save(this.state);
    return entertainmentSummary(this.state);
  }
  entertainment() {
    return entertainmentSummary(this.state);
  }
  configureSetup(input = {}) {
    if (!this.state.funnel) this.state.funnel = {};
    if (!this.state.funnel.setupCompletedAt) this.state.funnel.setupCompletedAt = new Date().toISOString();
    const allowed = [
      'gaming-editing',
      'stream-helper',
      'studying',
      'personal',
      'creative',
      'work-productivity',
      'accessibility',
    ];
    const categories = Array.isArray(input.categories)
      ? [...new Set(input.categories.filter(x => allowed.includes(x)))]
      : [];
    const obsWebSocketUrl = String(input.obsWebSocketUrl || 'ws://127.0.0.1:4455')
      .trim()
      .slice(0, 300);
    if (categories.includes('stream-helper')) {
      let url;
      try {
        url = new URL(obsWebSocketUrl);
      } catch {
        throw new Error('OBS WebSocket must be a valid ws:// or wss:// URL.');
      }
      if (!['ws:', 'wss:'].includes(url.protocol))
        throw new Error('OBS WebSocket must use ws:// or wss://.');
    }
    this.state.setup = {
      completed: true,
      completedAt: new Date().toISOString(),
      categories,
      customNeeds: String(input.customNeeds || '')
        .trim()
        .slice(0, 2000),
      stream: {
        enabled: categories.includes('stream-helper'),
        obsWebSocketUrl,
        goals: String(input.streamGoals || '')
          .trim()
          .slice(0, 1000),
      },
    };
    this.state.audit.push({
      at: this.state.setup.completedAt,
      type: 'setup.configured',
      details: { categories },
    });
    this.store.save(this.state);
    return this.snapshot();
  }
  configureAssistant(input = {}) {
    const prev = this.state.assistant || {};
    const prefs = prev.preferences || {};
    const caps = prev.capabilities || {};
    const choice = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
    const autonomy = choice(
      input.autonomy,
      ['user-led', 'balanced', 'proactive'],
      choice(prev.autonomy, ['user-led', 'balanced', 'proactive'], 'balanced')
    );
    this.state.assistant = {
      ...prev,
      autonomy,
      initiativeEnabled:
        input.initiativeEnabled === undefined
          ? prev.initiativeEnabled !== false
          : Boolean(input.initiativeEnabled),
      reflectionEnabled:
        input.reflectionEnabled === undefined
          ? prev.reflectionEnabled !== false
          : Boolean(input.reflectionEnabled),
      preferences: {
        ...prefs,
        responseLength: choice(
          input.responseLength,
          ['concise', 'balanced', 'detailed'],
          prefs.responseLength || 'balanced'
        ),
        tone: choice(
          input.tone,
          ['natural', 'direct', 'warm', 'professional', 'playful'],
          prefs.tone || 'natural'
        ),
        focusMode: choice(
          input.focusMode,
          ['general', 'gaming', 'streaming', 'studying', 'creative', 'productivity'],
          prefs.focusMode || 'general'
        ),
        accessibility: String(
          input.accessibility !== undefined ? input.accessibility : prefs.accessibility || ''
        )
          .trim()
          .slice(0, 500),
        language: choice(input.language, ['en', 'es', 'fr', 'de'], prefs.language || 'en'),
      },
      capabilities: {
        ...caps,
        webResearch: choice(
          input.webResearch,
          ['disabled', 'ask', 'enabled'],
          caps.webResearch || 'ask'
        ),
        appLaunch: 'confirm',
        mediaPlayback: choice(
          input.mediaPlayback,
          ['disabled', 'confirm', 'enabled'],
          caps.mediaPlayback || 'confirm'
        ),
        memoryLearning: choice(
          input.memoryLearning,
          ['disabled', 'enabled'],
          caps.memoryLearning || 'enabled'
        ),
      },
    };
    const at = new Date().toISOString();
    this.state.audit.push({
      at,
      type: 'assistant.configured',
      details: { autonomy, initiativeEnabled: this.state.assistant.initiativeEnabled },
    });
    this.store.save(this.state);
    return this.snapshot();
  }
  adultSoulStatus() {
    return adultSoulView(this.state);
  }
  configureAdultSoul(input = {}) {
    const view = configureAdultSoul(this.state, input);
    this.store.save(this.state);
    return view;
  }
  startAdultSession(input = {}) {
    const view = startAdultSession(this.state, input);
    this.store.save(this.state);
    return view;
  }
  stopAdultSession() {
    const view = stopAdultSession(this.state);
    this.store.save(this.state);
    return view;
  }
  tickAdultSession(atMs) {
    return tickAdultSession(this.state, atMs);
  }
  adultSoulCommand(command) {
    const view = applyAdultCommand(this.state, command);
    this.store.save(this.state);
    return view;
  }
  addAdultClip(clip) {
    const view = addAdultClip(this.state, clip);
    this.store.save(this.state);
    return view;
  }
  adultMediaDesk(input = {}) {
    return buildAdultMediaDesk(this.state, input);
  }
  configureAdultMedia(input = {}) {
    const desk = configureAdultMedia(this.state, input);
    this.store.save(this.state);
    return desk;
  }
  addAdultFolderBookmark(folderId, item) {
    if (!adultAllowed(this.state))
      throw new Error('Adult bookmarks stay locked until the triple gate is on.');
    const feel = addBookmarkToFolder(this.state.adultSoul?.feel, folderId, item);
    configureAdultSoul(this.state, { feel });
    this.store.save(this.state);
    return adultSoulView(this.state);
  }
  setAdultPin(pin, confirm) {
    if (!adultAllowed(this.state))
      throw new Error('Adult PIN stays locked until the triple gate is on.');
    const a = String(pin || '').replace(/\D/g, '');
    const b = String(confirm || '').replace(/\D/g, '');
    if (a.length < 4 || a.length > 8) throw new Error('Adult PIN must be 4–8 digits.');
    if (a !== b) throw new Error('Adult PIN confirmation did not match.');
    const salt = randomBytes(16);
    const hash = scryptSync(a, salt, 32);
    const feel = normalizeAdultFeel(this.state.adultSoul?.feel);
    feel.stealth = {
      ...feel.stealth,
      pinEnabled: true,
      pinSalt: salt.toString('hex'),
      pinHash: hash.toString('hex'),
      locked: false,
      blanked: false,
    };
    configureAdultSoul(this.state, { feel });
    this.store.save(this.state);
    return adultSoulView(this.state);
  }
  unlockAdultStealth(pin) {
    if (!adultAllowed(this.state)) throw new Error('Adult Mode is off.');
    const feel = normalizeAdultFeel(this.state.adultSoul?.feel);
    if (!feel.stealth.pinEnabled || !feel.stealth.pinHash || !feel.stealth.pinSalt) {
      feel.stealth.locked = false;
      feel.stealth.blanked = false;
      configureAdultSoul(this.state, { feel });
      this.store.save(this.state);
      return adultSoulView(this.state);
    }
    const digits = String(pin || '').replace(/\D/g, '');
    const salt = Buffer.from(feel.stealth.pinSalt, 'hex');
    const expected = Buffer.from(feel.stealth.pinHash, 'hex');
    const actual = scryptSync(digits, salt, 32);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new Error('Adult PIN did not match.');
    }
    feel.stealth.locked = false;
    feel.stealth.blanked = false;
    configureAdultSoul(this.state, { feel });
    this.store.save(this.state);
    return adultSoulView(this.state);
  }
  lockAdultStealth() {
    if (!adultAllowed(this.state)) return adultSoulView(this.state);
    const feel = normalizeAdultFeel(this.state.adultSoul?.feel);
    if (feel.stealth.pinEnabled !== true) return adultSoulView(this.state);
    feel.stealth.locked = true;
    feel.stealth.blanked = true;
    configureAdultSoul(this.state, { feel });
    this.store.save(this.state);
    return adultSoulView(this.state);
  }
  applyFeelLevel(level, atMs) {
    if (!adultAllowed(this.state)) return { level: 0, pace: 'stop', pattern: 'hold' };
    const feel = normalizeAdultFeel(this.state.adultSoul?.feel);
    const sample = feelSample(feel, atMs, level);
    const pace = feelToPace(sample);
    this.state.adultSoul = this.state.adultSoul || {};
    this.state.adultSoul.feel = { ...feel, lastLevel: sample };
    if (this.state.adultSoul.stage) {
      this.state.adultSoul.stage = {
        ...this.state.adultSoul.stage,
        arousal: Math.round(sample * 100),
      };
    }
    if (this.state.adultSoul.session?.active) {
      this.state.adultSoul.session = {
        ...this.state.adultSoul.session,
        pace,
        heat: Math.max(this.state.adultSoul.session.heat || 0, Math.round(sample * 100)),
      };
    }
    return { level: sample, pace, pattern: feel.pattern, syncMode: feel.syncMode };
  }
  adultFeelStatus() {
    return {
      honesty: adultFeelReply(this.state.adultSoul?.feel),
      feel: adultSoulView(this.state).feel,
    };
  }
  activeConversation() {
    return (
      this.state.conversations.find(c => c.id === this.state.activeConversationId) ||
      this.state.conversations[0]
    );
  }
  newConversation() {
    const now = new Date().toISOString();
    const c = {
      id: uid('conv'),
      title: 'New conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    this.state.conversations.unshift(c);
    this.state.activeConversationId = c.id;
    this.store.save(this.state);
    return this.snapshot();
  }
  selectConversation(id) {
    if (this.state.conversations.some(c => c.id === id)) {
      this.state.activeConversationId = id;
      this.store.save(this.state);
    }
    return this.snapshot();
  }
  deleteConversation(id) {
    if (this.state.conversations.length <= 1) return this.snapshot();
    this.state.conversations = this.state.conversations.filter(c => c.id !== id);
    if (!this.state.conversations.some(c => c.id === this.state.activeConversationId))
      this.state.activeConversationId = this.state.conversations[0].id;
    this.store.save(this.state);
    return this.snapshot();
  }
  exportConversation(id = this.state.activeConversationId, { format = 'json', redact = true } = {}) {
    const conv = this.state.conversations.find(c => c.id === id);
    if (!conv) throw new Error('Conversation not found.');
    const messages = conv.messages.map(m => ({
      role: m.role,
      at: m.at,
      content: redact ? redactSecretsForLog(String(m.content ?? '')) : String(m.content ?? ''),
    }));
    const safeTitle = redact
      ? redactSecretsForLog(conv.title || 'Conversation')
      : (conv.title || 'Conversation');
    const exportedAt = new Date().toISOString();
    const slug =
      (conv.title || 'Conversation').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'conversation';
    if (format === 'md') {
      const body = [
        `# ${conv.title || 'Conversation'}`,
        '',
        `- Conversation ID: ${conv.id}`,
        `- Started: ${conv.createdAt}`,
        `- Exported: ${exportedAt}`,
        `- Messages: ${messages.length}`,
        `- Redacted: ${redact ? 'yes' : 'no'}`,
        '',
        ...messages.map(m => `**${m.role}** (${m.at})\n\n${m.content}\n`),
      ].join('\n');
      return { filename: `${slug}-${conv.id}.md`, messageCount: messages.length, data: body };
    }
    const payload = {
      app: 'Eidovara',
      version: 1,
      conversation: { id: conv.id, title: safeTitle, createdAt: conv.createdAt, updatedAt: conv.updatedAt || conv.createdAt },
      exportedAt,
      redacted: redact,
      messages,
    };
    return { filename: `${slug}-${conv.id}.json`, messageCount: messages.length, data: JSON.stringify(payload, null, 2) };
  }

  async respond(input, extra = {}) {
    const payload =
      input && typeof input === 'object' && !Array.isArray(input)
        ? input
        : { text: input, ...extra };
    const text = String(payload.text || input || '').trim();
    const view = String(payload.view || extra.view || '').slice(0, 40);
    if (!text) throw new Error('Message cannot be empty.');
    if (text.length > 12000) throw new Error('Message is too long.');
    const now = new Date().toISOString();
    this.state.continuity.lastActiveAt = now;
    const policyEvents = applyPolicyCommand(this.state, text, {
      adminAuthorized: payload.adminAuthorized === true,
    });
    const safetyReport = assessRequestSafety(this.state, text);
    const learning =
      this.state.assistant?.capabilities?.memoryLearning === 'disabled'
        ? []
        : processLearning(this.state, text);
    const relationship = updateRelationship(this.state, text);
    if (this.state.assistant?.reflectionEnabled !== false) reflectOnGrowth(this.state, text);

    if (/^remember:/i.test(text))
      addMemory(this.state, text.replace(/^remember:/i, '').trim(), {
        kind: 'preference',
        confidence: 0.85,
        tags: ['preference'],
      });
    if (/^forget:/i.test(text)) forgetMemory(this.state, text.replace(/^forget:/i, '').trim());

    let policyReply = safetyReport
      ? "I can't help plan or facilitate illegal abuse, violence, exploitation, theft, fraud, or unauthorized access. This request was blocked and recorded in the local safety audit. If someone is in immediate danger, contact local emergency services."
      : null;
    if (!policyReply && policyEvents.some(([type]) => type === 'policy.adult_admin_blocked'))
      policyReply =
        'Adult Soul cannot be enabled from chat. Use the private administrator panel (Ctrl+A, away from text fields) until a later release. Revoke consent and Standard mode stay available on Identity.';
    else if (!policyReply && policyEvents.some(([type]) => type === 'policy.adult_enable_blocked'))
      policyReply = 'Adult Soul cannot be enabled until adult status is explicitly confirmed.';
    else if (!policyReply && policyEvents.some(([type]) => type === 'policy.consent_revoked'))
      policyReply =
        'Consent has been revoked immediately. I’m returning to a non-adult, pressure-free interaction stance.';
    else if (!policyReply && policyEvents.some(([type]) => type === 'policy.consent_blocked'))
      policyReply = 'Current consent cannot be activated until the adult gate is complete.';
    if (
      policyEvents.some(
        ([type]) => type === 'policy.consent_revoked' || type === 'policy.standard_enabled'
      )
    ) {
      deactivateAdultSoul(this.state);
    }

    const conv = this.activeConversation();
    conv.messages.push({ id: uid('msg'), role: 'user', content: text, at: now });
    if (conv.messages.length === 1) conv.title = text.slice(0, 42) + (text.length > 42 ? '…' : '');

    kernelHeartbeat(this.state, { at: now });
    const route = routeKernel(text, this.state, this.modules, { view });
    const locale = this.state.assistant?.preferences?.language || 'en';

    if (!policyReply && route.enabled !== false) {
      if (route.intent === 'focus' && isFocusStartCommand(text)) {
        this.startFocusSession({
          minutes: parseFocusMinutes(text),
          label: text.slice(0, 80),
          at: now,
        });
      } else if (
        route.intent === 'focus-stop' ||
        (route.intent === 'focus' && isFocusStopCommand(text))
      ) {
        this.stopFocusSession({ at: now });
      } else if (route.intent === 'scratch') {
        const body = scratchBodyFromInput(text);
        if (body && /^(note:|scratch:)/i.test(text)) {
          this.saveScratchpad(body);
          this.captureScratchpad(body);
        } else if (isScratchCaptureCommand(text)) {
          this.captureScratchpad(body || undefined);
        } else if (body) {
          this.saveScratchpad(body);
        }
      }
    }

    let reply = policyReply;
    let providerError = null;
    let internetError = null;
    let webResearch = null;
    let mediaDiscovery = null;
    const companionTurn = answerCompanion(text, { state: this.state });
    if (!reply && route.enabled === false && route.moduleId) {
      reply = disabledModuleReply(route, locale);
    }
    if (!reply && route.knowledgeReply) reply = route.knowledgeReply;
    if (!reply && companionTurn.usedKnowledge && companionTurn.reply) reply = companionTurn.reply;
    if (!reply && route.intent === 'search') {
      const hits = this.searchWorkspace(text, { apps: [] });
      const lines = hits
        .slice(0, 8)
        .map(item => `• ${item.title} (${item.kind})`)
        .join('\n');
      reply = hits.length
        ? `Local workspace matches on this PC (no background crawler, no Worker helper). Assist is not Soul.\n${lines}`
        : 'No local matches for that query. Search stays on this device — it does not crawl other apps or POST to the website helper.';
    }
    if (!reply && route.intent === 'focus-stop') {
      reply =
        'Focus session stopped. Remaining time is cleared. Eidovara did not close, inject into, or throttle other processes.';
    }
    if (!reply && route.intent === 'focus' && isFocusStartCommand(text)) {
      const mins =
        Math.round((this.state.kernel?.workspace?.focus?.durationMs || 0) / 60000) ||
        parseFocusMinutes(text);
      reply = `Focus session started on this PC (${mins} minutes). The quiet bar shows remaining time. Other apps are not closed or injected into. Assist is not Soul.`;
    }
    if (!reply && route.intent === 'scratch' && /^(note:|scratch:)/i.test(text)) {
      reply =
        'Captured to Memory on this device from the scratchpad. Nothing was sent to the website helper.';
    }
    if (!reply && (route.intent === 'adult-soul' || route.intent === 'adult-session')) {
      reply =
        payload.adminAuthorized === true
          ? adultSoulReply(text, this.state).reply
          : 'Adult Soul stays in the private administrator panel (Ctrl+A, away from text fields) until a later release. Revoke consent and Standard mode stay on Identity.';
    }
    if (!reply && (route.intent === 'adult-media' || route.intent === 'adult-media-blocked')) {
      reply =
        payload.adminAuthorized === true
          ? adultMediaReply(text, this.state)
          : 'Adult Media stays in the private administrator panel (Ctrl+A) until a later release. Guest overlays stay closed when Adult Mode is on.';
    }
    if (!reply) {
      const wantRemote =
        route.intent === 'research' &&
        this.state.assistant?.capabilities?.webResearch !== 'disabled' &&
        isExplicitInternetRequest(text);
      if (wantRemote) {
        try {
          webResearch = await researchInternet(text, this.internetOptions);
        } catch (err) {
          internetError = String(err?.message || err);
        }
      }
      if (wantRemote || isMediaDiscoveryRequest(text) || webResearch) {
        mediaDiscovery = discoverMedia(text, {
          entertainment: this.state.entertainment,
          localLibrary: this.internetOptions?.localLibrary,
          query: webResearch?.query,
          adultAllowed: adultAllowed(this.state),
        });
        if (webResearch) webResearch = mergeMediaDiscovery(webResearch, mediaDiscovery);
      }
      const history = conv.messages.slice(-24).map(m => ({ role: m.role, content: m.content }));
      try {
        const researchContext = webResearch
          ? `\n\nCurrent internet research (cite the numbered source links and do not invent missing facts):\n${webResearch.context}`
          : '';
        const discoveryContext =
          !webResearch && mediaDiscovery
            ? `\n\nLocal library and official search links (cite these; do not invent streams or inject into other players):\n${mediaDiscovery.context}`
            : '';
        const providerName = this.provider?.constructor?.name || 'unknown';
        reply = await providerTelemetry.call(providerName, () =>
          this.provider.reply({
            input: text,
            state: this.state,
            webResearch,
            mediaDiscovery: webResearch ? null : mediaDiscovery,
            view,
            intent: route.intent,
            messages: [
              {
                role: 'system',
                content: buildSystemContext(this.state) + researchContext + discoveryContext,
              },
              ...history,
            ],
          })
        );
      } catch (err) {
        providerError = String(err?.message || err);
        providerTelemetry.record('provider-error', 0, false);
        const fallback = new OfflineProvider();
        reply = await providerTelemetry.call('offline-fallback', () =>
          fallback.reply({
            input: text,
            state: this.state,
            webResearch,
            mediaDiscovery: webResearch ? null : mediaDiscovery,
            messages: history,
          })
        );
        reply += `\n\n(Model connection unavailable; continuing in offline mode.)`;
      }
    }
    if (!policyReply) {
      reply = applyPhrasing(reply, this.state.kernel?.registry?.phrasing, locale);
      reply = citeResearchInReply(reply, webResearch || mediaDiscovery, internetError);
    }

    const displayResearch = webResearch || mediaDiscovery;
    const kernelActions =
      route.intent === 'research'
        ? [
            ...researchResultActions(webResearch || {}, route.overlay).filter(
              item => item.type !== 'open-external'
            ),
            ...researchOpenActions(displayResearch),
          ]
        : [
            ...(route.actions || []),
            ...researchOpenActions(mediaDiscovery && !webResearch ? mediaDiscovery : null),
          ];
    const kernel = kernelPublicMeta({
      ...route,
      actions: kernelActions,
      view: route.intent === 'research' ? 'research' : route.view,
    });
    if (webResearch) kernel.webLookup = true;
    const done = new Date().toISOString();
    conv.messages.push({
      id: uid('msg'),
      role: 'assistant',
      content: reply,
      at: done,
      webResearch,
      mediaDiscovery: webResearch ? null : mediaDiscovery,
      actions: kernel.actions,
      kernelIntent: route.intent,
      why: {
        policyEvents: policyEvents.map(([type]) => type),
        safetyBlocked: Boolean(policyReply && safetyReport),
        learningCount: Array.isArray(learning) ? learning.length : 0,
        providerFallback: Boolean(providerError),
      },
    });
    this.markFunnel('firstReplyAt');
    conv.updatedAt = done;
    const companion = companionPublicMeta(companionTurn);
    this.state.audit.push({
      at: done,
      type: 'conversation.turn',
      details: {
        conversationId: conv.id,
        input: text.slice(0, 240),
        reply: reply.slice(0, 240),
        providerError,
        internetError,
        kernelIntent: route.intent,
        kernelModule: route.moduleId,
        webLookup: Boolean(webResearch),
        companionIntent: companion.intent,
        companionNetwork: false,
      },
    });
    if (this.state.audit.length > 5000) this.state.audit = this.state.audit.slice(-5000);
    this.store.save(this.state);
    return {
      at: done,
      input: text,
      reply,
      policyEvents,
      learning,
      relationship,
      safetyReport,
      providerError,
      internetError,
      webResearch,
      mediaDiscovery: webResearch ? null : mediaDiscovery,
      companion,
      kernel,
      adultAllowed: adultAllowed(this.state),
      state: this.snapshot(),
    };
  }
}
