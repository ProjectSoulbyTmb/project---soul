import { JsonStore } from './store.js';
import { addMemory, activeMemories, forgetMemory } from './memory.js';
import { applyPolicyCommand, adultAllowed, assessRequestSafety } from './policy.js';
import { processLearning } from './learning.js';
import { reflectOnGrowth } from './growth.js';
import { updateRelationship } from './relationship.js';
import { uid } from './schema.js';
import { OfflineProvider } from '../providers/offline.js';
import { buildSystemContext } from '../providers/context.js';
import { researchInternet } from '../providers/internet.js';
import { entertainmentSummary, recordMediaEvent } from './entertainment.js';

export class SoulEngine {
  constructor({ store, provider = new OfflineProvider(), internetOptions = {} } = {}) {
    this.store = store || new JsonStore();
    this.provider = provider;
    this.internetOptions = internetOptions;
    this.state = this.store.load();
  }
  setProvider(provider) { this.provider = provider || new OfflineProvider(); }
  setInternetOptions(options = {}) { this.internetOptions = options; }
  reset() { this.state = this.store.reset(); return this.snapshot(); }
  snapshot() { return JSON.parse(JSON.stringify(this.state)); }
  remember(content, opts = {}) { const m = addMemory(this.state, content, opts); this.store.save(this.state); return m; }
  forget(idOrText) { const count = forgetMemory(this.state, idOrText); this.store.save(this.state); return count; }
  createBackup() { return this.store.createBackup(this.state); }
  listBackups() { return this.store.listBackups(); }
  restoreBackup(name) { this.state = this.store.restoreBackup(name); return this.snapshot(); }
  recordMedia(input) { const event = recordMediaEvent(this.state, input); this.state.audit.push({ at: event.at, type: `media.${event.event}`, details: { type: event.type, title: event.title } }); this.store.save(this.state); return entertainmentSummary(this.state); }
  entertainment() { return entertainmentSummary(this.state); }
  configureSetup(input = {}) {
    const allowed = ['gaming-editing', 'stream-helper', 'studying', 'personal', 'creative', 'work-productivity', 'accessibility'];
    const categories = Array.isArray(input.categories) ? [...new Set(input.categories.filter(x => allowed.includes(x)))] : [];
    const obsWebSocketUrl = String(input.obsWebSocketUrl || 'ws://127.0.0.1:4455').trim().slice(0, 300);
    if (categories.includes('stream-helper')) { const url = new URL(obsWebSocketUrl); if (!['ws:', 'wss:'].includes(url.protocol)) throw new Error('OBS WebSocket must use ws:// or wss://.'); }
    this.state.setup = { completed: true, completedAt: new Date().toISOString(), categories, customNeeds: String(input.customNeeds || '').trim().slice(0, 2000), stream: { enabled: categories.includes('stream-helper'), obsWebSocketUrl, goals: String(input.streamGoals || '').trim().slice(0, 1000) } };
    this.state.audit.push({ at: this.state.setup.completedAt, type: 'setup.configured', details: { categories } }); this.store.save(this.state); return this.snapshot();
  }
  configureAssistant(input = {}) {
    const prev = this.state.assistant || {};
    const prefs = prev.preferences || {};
    const caps = prev.capabilities || {};
    const choice=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
    const autonomy = choice(input.autonomy, ['user-led', 'balanced', 'proactive'], choice(prev.autonomy, ['user-led', 'balanced', 'proactive'], 'balanced'));
    this.state.assistant = {
      ...prev,
      autonomy,
      initiativeEnabled: input.initiativeEnabled === undefined ? prev.initiativeEnabled !== false : Boolean(input.initiativeEnabled),
      reflectionEnabled: input.reflectionEnabled === undefined ? prev.reflectionEnabled !== false : Boolean(input.reflectionEnabled),
      preferences: {
        ...prefs,
        responseLength: choice(input.responseLength, ['concise', 'balanced', 'detailed'], prefs.responseLength || 'balanced'),
        tone: choice(input.tone, ['natural', 'direct', 'warm', 'professional', 'playful'], prefs.tone || 'natural'),
        focusMode: choice(input.focusMode, ['general', 'gaming', 'streaming', 'studying', 'creative', 'productivity'], prefs.focusMode || 'general'),
        accessibility: String(input.accessibility !== undefined ? input.accessibility : (prefs.accessibility || '')).trim().slice(0, 500),
        language: choice(input.language, ['en', 'es', 'fr', 'de'], prefs.language || 'en')
      },
      capabilities: {
        ...caps,
        webResearch: choice(input.webResearch, ['disabled', 'ask', 'enabled'], caps.webResearch || 'ask'),
        appLaunch: 'confirm',
        mediaPlayback: choice(input.mediaPlayback, ['disabled', 'confirm', 'enabled'], caps.mediaPlayback || 'confirm'),
        memoryLearning: choice(input.memoryLearning, ['disabled', 'enabled'], caps.memoryLearning || 'enabled')
      }
    };
    const at = new Date().toISOString(); this.state.audit.push({ at, type: 'assistant.configured', details: { autonomy, initiativeEnabled: this.state.assistant.initiativeEnabled } }); this.store.save(this.state); return this.snapshot();
  }
  activeConversation() { return this.state.conversations.find(c => c.id === this.state.activeConversationId) || this.state.conversations[0]; }
  newConversation() {
    const now = new Date().toISOString();
    const c = { id: uid('conv'), title: 'New conversation', createdAt: now, updatedAt: now, messages: [] };
    this.state.conversations.unshift(c); this.state.activeConversationId = c.id; this.store.save(this.state); return this.snapshot();
  }
  selectConversation(id) { if (this.state.conversations.some(c => c.id === id)) { this.state.activeConversationId = id; this.store.save(this.state); } return this.snapshot(); }
  deleteConversation(id) {
    if (this.state.conversations.length <= 1) return this.snapshot();
    this.state.conversations = this.state.conversations.filter(c => c.id !== id);
    if (!this.state.conversations.some(c => c.id === this.state.activeConversationId)) this.state.activeConversationId = this.state.conversations[0].id;
    this.store.save(this.state); return this.snapshot();
  }

  async respond(input) {
    const text = String(input || '').trim();
    if (!text) throw new Error('Message cannot be empty.');
    if (text.length > 12000) throw new Error('Message is too long.');
    const now = new Date().toISOString();
    this.state.continuity.lastActiveAt = now;
    const policyEvents = applyPolicyCommand(this.state, text);
    const safetyReport = assessRequestSafety(this.state, text);
    const learning = this.state.assistant?.capabilities?.memoryLearning === 'disabled' ? [] : processLearning(this.state, text);
    const relationship = updateRelationship(this.state, text);
    if (this.state.assistant?.reflectionEnabled !== false) reflectOnGrowth(this.state, text);

    if (/^remember:/i.test(text)) addMemory(this.state, text.replace(/^remember:/i, '').trim(), { kind: 'preference', confidence: 0.85, tags: ['preference'] });
    if (/^forget:/i.test(text)) forgetMemory(this.state, text.replace(/^forget:/i, '').trim());

    let policyReply = safetyReport ? 'I can’t help plan or facilitate illegal abuse, violence, exploitation, theft, fraud, or unauthorized access. This request was blocked and recorded in the local safety audit. If someone is in immediate danger, contact local emergency services.' : null;
    if (!policyReply && policyEvents.some(([type]) => type === 'policy.adult_enable_blocked')) policyReply = 'Adult Soul cannot be enabled until adult status is explicitly confirmed.';
    else if (policyEvents.some(([type]) => type === 'policy.consent_revoked')) policyReply = 'Consent has been revoked immediately. I’m returning to a non-adult, pressure-free interaction stance.';
    else if (policyEvents.some(([type]) => type === 'policy.consent_blocked')) policyReply = 'Current consent cannot be activated until the adult gate is complete.';

    const conv = this.activeConversation();
    conv.messages.push({ id: uid('msg'), role: 'user', content: text, at: now });
    if (conv.messages.length === 1) conv.title = text.slice(0, 42) + (text.length > 42 ? '…' : '');

    let reply = policyReply;
    let providerError = null;
    let internetError = null;
    let webResearch = null;
    if (!reply) {
      if (this.state.assistant?.capabilities?.webResearch !== 'disabled') { try { webResearch = await researchInternet(text, this.internetOptions); } catch (err) { internetError = String(err?.message || err); } }
      const history = conv.messages.slice(-24).map(m => ({ role: m.role, content: m.content }));
      try {
        const researchContext = webResearch ? `\n\nCurrent internet research (cite the numbered source links and do not invent missing facts):\n${webResearch.context}` : '';
        reply = await this.provider.reply({ input: text, state: this.state, webResearch, messages: [{ role: 'system', content: buildSystemContext(this.state) + researchContext }, ...history] });
      } catch (err) {
        providerError = String(err?.message || err);
        const fallback = new OfflineProvider();
        reply = await fallback.reply({ input: text, state: this.state, messages: history });
        reply += `\n\n(Model connection unavailable; continuing in offline mode.)`;
      }
    }

    const done = new Date().toISOString();
    conv.messages.push({ id: uid('msg'), role: 'assistant', content: reply, at: done, webResearch });
    conv.updatedAt = done;
    this.state.audit.push({ at: done, type: 'conversation.turn', details: { conversationId: conv.id, input: text.slice(0, 240), reply: reply.slice(0, 240), providerError, internetError } });
    if (this.state.audit.length > 5000) this.state.audit = this.state.audit.slice(-5000);
    this.store.save(this.state);
    return { at: done, input: text, reply, policyEvents, learning, relationship, safetyReport, providerError, internetError, webResearch, adultAllowed: adultAllowed(this.state), state: this.snapshot() };
  }
}
