// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * GitHub Tracker Plugin — Main Entry Point
 */

const GITHUB_API = 'https://api.github.com';
const CONFIG_KEY = 'plugin_github_tracker_config';

let config = { token: '', watched: [], seen: new Set() };

export default {
  name: 'GitHub Tracker',
  version: '1.0.0',

  async init() {
    try { const s = localStorage.getItem(CONFIG_KEY); if (s) { const d = JSON.parse(s); config = { ...config, ...d, seen: new Set(d.seen || []) }; } } catch {}
    console.log('[GitHub Tracker] Initialized');
  },

  async cleanup() {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, seen: [...config.seen] })); } catch {}
    console.log('[GitHub Tracker] Cleaned up');
  },

  async configure(token) {
    if (!token) throw new Error('GitHub token required.');
    config.token = token;
    return { configured: true };
  },

  async watch(repo) {
    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) throw new Error('Use owner/repo format.');
    if (config.watched.some(w => w.repo === repo)) return { alreadyWatching: true };
    config.watched.push({ repo, addedAt: new Date().toISOString() });
    return { watching: repo };
  },

  async unwatch(repo) {
    const before = config.watched.length;
    config.watched = config.watched.filter(w => w.repo !== repo);
    return { unwatched: before !== config.watched.length };
  },

  async list() {
    return config.watched.map(w => ({ repo: w.repo, since: w.addedAt }));
  },

  async pollNow() {
    if (!config.token) throw new Error('Not configured.');
    const items = [];
    for (const watch of config.watched) {
      try {
        const res = await fetch(`${GITHUB_API}/repos/${watch.repo}/events?per_page=10`, {
          headers: { 'Authorization': `Bearer ${config.token}`, 'Accept': 'application/vnd.github+json' }
        });
        if (!res.ok) continue;
        const events = await res.json();
        for (const ev of events.slice(0, 10)) {
          if (!config.seen.has(ev.id)) {
            config.seen.add(ev.id);
            items.push({ repo: watch.repo, type: ev.type, actor: ev.actor?.login, at: ev.created_at });
          }
        }
      } catch {}
    }
    if (config.seen.size > 2000) config.seen = new Set([...config.seen].slice(-1000));
    return items;
  }
};
