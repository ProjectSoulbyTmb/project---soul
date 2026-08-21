const clean = (value, limit = 500) => String(value || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
const allowedTypes = new Set(['audio', 'video']);
const allowedEvents = new Set(['play', 'complete', 'favorite', 'skip']);

export function normalizeMediaEvent(input = {}) {
  const type = allowedTypes.has(input.type) ? input.type : 'audio';
  const event = allowedEvents.has(input.event) ? input.event : 'play';
  const title = clean(input.title, 300);
  if (!title) throw new Error('A media title is required.');
  let sourceUrl = '';
  try { const parsed = new URL(String(input.sourceUrl || '')); if (parsed.protocol === 'https:') sourceUrl = parsed.toString().slice(0, 1000); } catch {}
  return { event, type, title, sourceUrl, at: new Date().toISOString() };
}

export function recordMediaEvent(state, input) {
  const item = normalizeMediaEvent(input);
  state.entertainment ||= { favorites: [], history: [], taste: {} };
  state.entertainment.history = [...(state.entertainment.history || []), item].slice(-500);
  if (item.event === 'favorite' && !(state.entertainment.favorites || []).some(x => x.title.toLowerCase() === item.title.toLowerCase())) {
    state.entertainment.favorites = [...state.entertainment.favorites, item].slice(-200);
  }
  const key = item.title.toLowerCase();
  const weight = { play: 1, complete: 2, favorite: 4, skip: -1 }[item.event];
  state.entertainment.taste ||= {};
  state.entertainment.taste[key] = Math.max(-5, Math.min(20, Number(state.entertainment.taste[key] || 0) + weight));
  return item;
}

export function entertainmentSummary(state) {
  const entertainment = state.entertainment || {};
  return {
    favorites: [...(entertainment.favorites || [])].slice(-20).reverse(),
    recent: [...(entertainment.history || [])].slice(-30).reverse(),
    topTitles: Object.entries(entertainment.taste || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([title, score]) => ({ title, score }))
  };
}
