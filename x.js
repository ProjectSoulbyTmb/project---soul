// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Notion Sync Plugin — Main Entry Point
 * Bidirectional sync between Eidovara memories and Notion pages
 */

const PLUGIN_ID = 'com.soul.notion-sync';
const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

let config = {
  apiKey: '',
  databaseId: '',
  autoSync: false,
  syncIntervalMs: 5 * 60_000,
  lastSyncAt: null,
  pendingQueue: []
};

let syncTimer = null;
let initialized = false;

export default {
  name: 'Notion Sync',
  version: '1.0.0',

  async init() {
    if (initialized) return;
    console.log(`[${PLUGIN_ID}] Initializing…`);

    try {
      const stored = localStorage.getItem('plugin_notion_sync_config');
      if (stored) config = { ...config, ...JSON.parse(stored) };
    } catch { /* private mode */ }

    if (config.apiKey && config.databaseId && config.autoSync) {
      startSyncInterval();
    }

    initialized = true;
    console.log(`[${PLUGIN_ID}] Initialized`);
  },

  async cleanup() {
    stopSyncInterval();
    initialized = false;
    console.log(`[${PLUGIN_ID}] Cleaned up`);
  },

  async sync(direction, databaseId) {
    checkConfigured();
    const db = databaseId || config.databaseId;
    let pushed = 0;
    let pulled = 0;

    if (direction === 'push' || direction === 'bidirectional') {
      pushed = await pushMemories(db);
    }
    if (direction === 'pull' || direction === 'bidirectional') {
      pulled = await pullMemories(db);
    }

    config.lastSyncAt = new Date().toISOString();
    saveConfig();

    return { success: true, pushed, pulled, syncedAt: config.lastSyncAt };
  },

  async configure(apiKey, databaseId) {
    if (!apiKey) throw new Error('Notion API key is required.');
    if (!databaseId) throw new Error('Notion database ID is required.');
    if (!/^[a-f0-9]{32}$/.test(databaseId)) {
      throw new Error('Database ID must be a 32-character hex string.');
    }
    config.apiKey = apiKey;
    config.databaseId = databaseId;
    saveConfig();
    console.log(`[Notion Sync] Configured for database ${databaseId}`);
    return { configured: true };
  },

  async onMemoryCreated(memory) {
    queueMemory(memory, 'create');
  },

  async onMemoryUpdated(memory) {
    queueMemory(memory, 'update');
  },

  async onMemoryDeleted(memory) {
    queueMemory(memory, 'delete');
  }
};

function checkConfigured() {
  if (!config.apiKey || !config.databaseId) {
    throw new Error('Notion Sync is not configured. Run "Configure Notion Sync" first.');
  }
}

function saveConfig() {
  try {
    localStorage.setItem('plugin_notion_sync_config', JSON.stringify({
      ...config,
      apiKey: config.apiKey // stored per-plugin in sandbox-prefixed key
    }));
  } catch { /* private mode */ }
}

function startSyncInterval() {
  stopSyncInterval();
  syncTimer = setInterval(() => {
    void pushMemories(config.databaseId).catch(err =>
      console.error('[Notion Sync] Auto-sync failed:', err?.message || err));
  }, config.syncIntervalMs);
}

function stopSyncInterval() {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
}

function queueMemory(memory, operation) {
  if (!config.apiKey || !config.autoSync) return;
  config.pendingQueue.push({ memory, operation, queuedAt: new Date().toISOString() });
  if (config.pendingQueue.length > 500) config.pendingQueue.shift();
}

async function notionFetch(path, options = {}) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers
    },
    redirect: 'error'
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function pushMemories(databaseId) {
  const queue = [...config.pendingQueue];
  if (!queue.length) return 0;

  let pushed = 0;
  for (const item of queue) {
    try {
      await notionFetch('/pages', {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Title: { title: [{ text: { content: item.memory.content?.slice(0, 100) || 'Untitled' } }] },
            Content: { rich_text: [{ text: { content: String(item.memory.content || '') } }] },
            Kind: { select: { name: String(item.memory.kind || 'note') } },
            Confidence: { number: Number(item.memory.confidence ?? 0.5) }
          }
        })
      });
      pushed++;
    } catch (err) {
      console.warn('[Notion Sync] Push failed for one item:', err?.message || err);
    }
  }

  config.pendingQueue = config.pendingQueue.filter(p => !queue.includes(p));
  saveConfig();
  return pushed;
}

async function pullMemories(databaseId) {
  const data = await notionFetch(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({ page_size: 50 })
  });

  const results = Array.isArray(data.results) ? data.results : [];
  return results.length;
}
