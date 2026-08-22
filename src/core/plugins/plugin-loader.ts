// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Loader
 * Handles loading, validation, and initialization of plugins
 */

import { PluginManifest, PluginValidationResult } from './plugin-manifest.js';
import { createPluginSandbox } from './plugin-sandbox.js';

export interface LoadedPlugin {
  manifest: PluginManifest;
  sandbox: ReturnType<typeof createPluginSandbox>;
  exports: Record<string, any>;
  initialized: boolean;
}

export class PluginLoader {
  private loaded: Map<string, LoadedPlugin> = new Map();
  private loadOrder: string[] = [];
  private maxPlugins: number;

  constructor(options: { maxPlugins?: number } = {}) {
    this.maxPlugins = options.maxPlugins ?? 50;
  }

  validateManifest(manifest: any): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (manifest.manifest_version !== 1) errors.push('Unsupported manifest version');
    if (!manifest.id || !/^[a-z0-9][a-z0-9.-]*$/.test(manifest.id))
      errors.push('Invalid plugin ID');
    if (!manifest.name || manifest.name.length > 100) errors.push('Invalid plugin name');
    if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version))
      errors.push('Invalid version format');
    if (!manifest.entrypoints?.main && !manifest.entrypoints?.commands?.length)
      errors.push('At least one entrypoint required');
    if (!manifest.author) warnings.push('Missing author field');
    if (!manifest.permissions) warnings.push('No permissions declared');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      manifest: errors.length === 0 ? manifest : undefined,
    };
  }

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    if (this.loaded.size >= this.maxPlugins) throw new Error('Maximum plugin limit reached');

    // In production this reads manifest.json from disk; here we accept the caller-provided object
    const manifestOrRaw = await import(/* @vite-ignore */ `${pluginPath}/manifest.json`).catch(
      () => null
    );
    const raw = manifestOrRaw?.default ?? manifestOrRaw;
    if (!raw) throw new Error(`Cannot read manifest at ${pluginPath}`);

    const validation = this.validateManifest(raw);
    if (!validation.valid) throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    const manifest = validation.manifest!;

    const permMap = new Map(Object.entries(manifest.permissions ?? {}));
    const sandbox = createPluginSandbox(manifest, permMap);
    const mod = await import(
      /* @vite-ignore */ `${pluginPath}/${manifest.entrypoints.main ?? 'index.js'}`
    );
    const exports = mod?.default ?? mod ?? {};

    const plugin: LoadedPlugin = { manifest, sandbox, exports, initialized: false };
    this.loaded.set(manifest.id, plugin);
    this.loadOrder.push(manifest.id);
    return plugin;
  }

  async initializePlugin(pluginId: string): Promise<void> {
    const plugin = this.loaded.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);
    if (plugin.initialized) return;
    if (typeof plugin.exports.init === 'function') await plugin.exports.init();
    plugin.initialized = true;
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loaded.get(pluginId);
    if (!plugin) return;
    if (typeof plugin.exports.cleanup === 'function') await plugin.exports.cleanup();
    this.loaded.delete(pluginId);
    const idx = this.loadOrder.indexOf(pluginId);
    if (idx !== -1) this.loadOrder.splice(idx, 1);
  }

  getPlugin(id: string): LoadedPlugin | undefined {
    return this.loaded.get(id);
  }
  getAll(): LoadedPlugin[] {
    return this.loadOrder.map(id => this.loaded.get(id)!).filter(Boolean);
  }
  isLoaded(id: string): boolean {
    return this.loaded.has(id);
  }
  get count(): number {
    return this.loaded.size;
  }
}
