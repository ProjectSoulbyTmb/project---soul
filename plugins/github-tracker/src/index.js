// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * GitHub Tracker Plugin — Main Entry Point
 * Track GitHub repositories, PRs, issues, and notifications
 */

const PLUGIN_ID = 'com.soul.github-tracker';
const GITHUB_API = 'https://api.github.com';

let config = {
  token: '',
  defaultRepo: '',
  watched: [],
  pollIntervalMs: 2 * 60_000,
  notify: true,
};

let pollTimer = null;
let initialized = false;
let seenEvents = new Set();

export default {
  name: 'GitHub Tracker',
  version: '1.0.0',

  async init() {
    if (initialized) return;
    console.log(`[${PLUGIN_ID}] Initializing…`);

    try {
      const stored = localStorage.getItem('plugin_github_tracker_config');
      if (stored) config = { ...config, ...JSON.parse(stored) };
    } catch {
      /* private mode */
    }

    try {
      const seen = localStorage.getItem('plugin_github_tracker_seen');
      if (seen) seenEvents = new Set(JSON.parse(seen));
    } catch {
      /* private mode */
    }

    if (config.token && config.watched.length) {
      startPolling();
    }

    initialized = true;
    console.log(`[${PLUGIN_ID}] Initialized (${config.watched.length} repos watched)`);
  },

  async cleanup() {
    stopPolling();
    persistSeen();
    initialized = false;
    console.log(`[${PLUGIN_ID}] Cleaned up`);
  },

  async watch(repo, events, notify) {
    validateRepo(repo);
    if (config.watched.some(w => w.repo === repo)) {
      return { alreadyWatching: true, repo };
    }
    config.watched.push({ repo, events: events || 'all', addedAt: new Date().toISOString() });
    saveConfig();
    startPolling();
    console.log(`[${PLUGIN_ID}] Now watching ${repo}`);
    return { watching: true, repo, events: events || 'all' };
  },

  async unwatch(repo) {
    validateRepo(repo);
    const before = config.watched.length;
    config.watched = config.watched.filter(w => w.repo !== repo);
    saveConfig();
    if (!config.watched.length) stopPolling();
    return { unwatched: before !== config.watched.length, repo };
  },

  async list() {
    return config.watched.map(w => ({ repo: w.repo, events: w.events, since: w.addedAt }));
  },

  async openPr(repo, number) {
    validateRepo(repo);
    if (!Number.isInteger(number) || number < 1)
      throw new Error('PR number must be a positive integer.');
    const url = `https://github.com/${repo}/pull/${number}`;
    // Eidovara desktop exposes soul.openExternal; in sandbox fall back to window.open
    if (typeof globalThis.soul?.openExternal === 'function') {
      await globalThis.soul.openExternal(url);
    }
    return { url };
  },

  async configure(token, defaultRepo) {
    if (!token) throw new Error('GitHub token is required.');
    config.token = token;
    if (defaultRepo) {
      validateRepo(defaultRepo);
      config.defaultRepo = defaultRepo;
    }
    saveConfig();
    startPolling();
    return { configured: true, watching: config.watched.length };
  },

  async pollNow() {
    checkConfigured();
    const notifications = [];
    for (const watch of config.watched) {
      try {
        const items = await fetchRepoEvents(watch.repo);
        for (const item of items) {
          if (!seenEvents.has(item.id)) {
            seenEvents.add(item.id);
            notifications.push(item);
            if (config.notify && typeof Notification !== 'undefined') {
              new Notification(`GitHub · ${watch.repo}`, { body: item.title });
            }
          }
        }
        // Cap the seen set so localStorage does not grow without bound
        if (seenEvents.size > 2000) {
          const arr = [...seenEvents];
          seenEvents = new Set(arr.slice(-1000));
        }
      } catch (err) {
        console.warn(`[GitHub Tracker] Poll failed for ${watch.repo}:`, err?.message || err);
      }
    }
    persistSeen();
    return notifications;
  },

  async onPROpened(payload) {},
  async onPRReviewRequested(payload) {},
  async onIssueAssigned(payload) {},
  async onWorkflowFailed(payload) {},
};

function validateRepo(repo) {
  if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(String(repo))) {
    throw new Error('Repository must be in "owner/repo" format.');
  }
}

function checkConfigured() {
  if (!config.token)
    throw new Error('GitHub Tracker is not configured. Run "Configure GitHub" first.');
}

function saveConfig() {
  try {
    localStorage.setItem('plugin_github_tracker_config', JSON.stringify(config));
  } catch {
    /* private mode */
  }
}

function persistSeen() {
  try {
    localStorage.setItem(
      'plugin_github_tracker_seen',
      JSON.stringify([...seenEvents].slice(-2000))
    );
  } catch {
    /* private mode */
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    void this?.pollNow?.().catch(() => {});
  }, config.pollIntervalMs);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
    },
    redirect: 'error',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchRepoEvents(repo) {
  const data = await githubFetch(`/repos/${repo}/events?per_page=20`);
  if (!Array.isArray(data)) return [];
  return data.slice(0, 20).map(ev => ({
    id: ev.id,
    type: ev.type,
    repo,
    title: `${ev.actor?.login ?? 'unknown'} — ${ev.type}`,
    at: ev.created_at,
  }));
}
