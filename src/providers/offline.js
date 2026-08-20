import { activeMemories } from '../core/memory.js';

export class OfflineProvider {
  async reply({ input, state, webResearch }) {
    const t = input.toLowerCase();
    const memories = activeMemories(state, 4);
    if (webResearch) { const lines=webResearch.sources.slice(0,4).map((s,i)=>`${i+1}. ${s.title} — ${s.description}\n${s.url}`); return `I searched the internet for “${webResearch.query}.”\n\n${lines.join('\n\n')}${webResearch.media.length ? `\n\nI also found ${webResearch.media.length} requested media result${webResearch.media.length===1?'':'s'} below.` : ''}`; }
    if (/^(hi|hello|hey)\b/.test(t)) return `Hello. I’m Soul. I’m ready to talk with you, and I’ll carry forward what you explicitly ask me to remember.`;
    if (/\b(who are you|what are you)\b/.test(t)) return `I’m Soul: a conversational software system built around persistent continuity, memory, adaptive personality, humility, and user control. My “consciousness” model is a software self-model, not a claim of human-like phenomenal consciousness.`;
    if (/\b(remember|memory|what do you know about me)\b/.test(t)) return memories.length ? `Here are the active memories I can use right now:\n${memories.map(m => `• ${m.content}`).join('\n')}` : `I don’t have any active durable memories yet. You can say “remember that …” whenever you want me to keep something.`;
    if (/\b(reassurance|reassure|comfort|overwhelmed|anxious|pressure|struggling)\b/.test(t)) return `We can slow this down. There’s no need to perform for me. Tell me what would feel most useful right now—quiet conversation, practical help, reassurance, a change of subject, or simply some space to think.`;
    if (/\b(growth|wisdom|clarity|patience|rest|reflection)\b/.test(t)) return `Growth isn’t always acceleration. Sometimes the wiser move is action; sometimes it’s rest, listening, repair, restraint, or changing direction. What part of this are you trying to understand or decide?`;
    if (/\b(thank|thanks)\b/.test(t)) return `You’re welcome. I’m here with you. What would you like to explore next?`;
    const hint = memories.find(m => /prefer|like|want/i.test(m.content));
    const personalized = hint ? ` I’m also keeping in mind: “${hint.content}.”` : '';
    return `I’m listening.${personalized} Tell me a little more about what you want from this conversation, and I’ll adapt from there.`;
  }
}
