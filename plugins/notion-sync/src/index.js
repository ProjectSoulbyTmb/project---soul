// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Notion Sync Plugin — Main Entry Point
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const CONFIG_KEY = 'plugin_notion_sync_config';

let config = { apiKey: '', databaseId: '', autoSync: false, pending: [] };

export default {
  name: 'Notion Sync',
  version: '1.0.0',

  async init() {
    try { const s = localStorage.getItem(CONFIG_KEY); if (s) config = { ...config, ...JSON.parse(s) }; } catch {}
    console.log('[Notion Sync] Initialized');
  },

  async cleanup() {
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch {}
    console.log('[Notion Sync] Cleaned up');
  },

  async configure(apiKey, databaseId) {
    if (!apiKey || !databaseId) throw new Error('API key and database ID required.');
    config.apiKey = apiKey;
    config.databaseId = databaseId;
    return { configured: true };
  },

  async sync(_direction = 'bidirectional') {
    if (!config.apiKey) throw new Error('Not configured. Run configure first.');
    let pushed = 0;
    for (const item of config.pending.splice(0)) {
      try {
        await fetch(`${NOTION_API}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { database_id: config.databaseId },
            properties: {
              Title: { title: [{ text: { content: String(item.content || '').slice(0, 100) } }] },
              Content: { rich_text: [{ text: { content: String(item.content || '') } }] }
            }
          })
        });
        pushed++;
      } catch (err) { console.warn('[Notion Sync] Push failed:', err); }
    }
    return { success: true, pushed };
  },

  async onMemoryCreated(memory) { config.pending.push(memory); },
  async onMemoryUpdated(memory) { config.pending.push(memory); }
};
