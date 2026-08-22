// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Registry
 * Manages plugin discovery, lifecycle, and event dispatch
 */

import { PluginLoader } from './plugin-loader.js';

export class PluginRegistry {
  private loader: PluginLoader;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(options: { maxPlugins?: number } = {}) {
    this.loader = new PluginLoader(options);
  }

  async initialize(): Promise<void> {
    // Scan plugins/ directory and load all valid plugins
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data?: any): void {
    for (const handler of this.listeners.get(event) ?? []) {
      try { handler(data); } catch (err) { console.error(`[PluginRegistry] Handler error for ${event}:`, err); }
    }
  }
}
