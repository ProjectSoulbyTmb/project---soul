// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Loader
 * Handles loading, validation, and initialization of plugins
 */

import {
  PluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission,
  PluginManifestInput,
} from './plugin-manifest.js';
import { PluginSandbox, createPluginSandbox, PluginSandbox } from './plugin-sandbox.js';

export interface LoadedPlugin {
  manifest: any;
  sandbox: any;
  exports: Record<string, any>;
  initialized: boolean;
  instance?: any;
  destroy?: () => Promise<void>;
}

export interface PluginLoaderOptions {
  pluginsDir: string;
  enableHotReload: boolean;
  maxPlugins: number;
  strictValidation: boolean;
}

export class PluginLoader {
  private pluginsDir: string;
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private loadOrder: string[] = [];
  private options: PluginLoaderOptions;

  constructor(options: PluginLoaderOptions) {
    this.pluginsDir = options.pluginsDir;
    this.options = {
      enableHotReload: options.enableHotReload ?? false,
      maxPlugins: options.maxPlugins ?? 50,
      strictValidation: options.strictValidation ?? true,
    };
  }

  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    const manifestPath = `${pluginPath}/manifest.json`;
    const manifest = await this.loadManifest(manifestPath);

    const validation = await this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Plugin manifest validation failed: ${validation.errors.join(', ')}`);
    }

    if (this.loadedPlugins.size >= (this.options.maxPlugins || 50)) {
      throw new Error('Maximum plugin limit reached');
    }

    const sandbox = createPluginSandbox(validation.manifest!, new Map());
    const context = sandbox.getContext();

    const exports = await this.loadPluginModule(manifest, sandbox);
    const sandboxInstance = sandbox.getContext();

    const loadedPlugin: LoadedPlugin = {
      manifest: manifest,
      sandbox: sandbox,
      exports: exports,
      initialized: false,
      instance: null,
    };

    if (this.loadedPlugins.size >= (this.options.maxPlugins || 50)) {
      throw new Error('Maximum plugin limit reached');
    }

    this.loadedPlugins.set(manifest.id, loadedPlugin);
    this.loadOrder.push(manifest.id);

    return loadedPlugin;
  }

  private async loadManifest(manifestPath: string): Promise<any> {
    // In a real implementation, this would read from the filesystem
    // For now, return a mock manifest
    return {
      manifest_version: 1,
      id: 'com.example.plugin',
      name: 'Example Plugin',
      version: '1.0.0',
      description: 'An example plugin',
      author: 'Soul Consciousness Studios',
      license: 'LicenseRef-Eidovara-Source-Available-1.0',
      permissions: {
        memory: true,
        network: ['api.example.com'],
        filesystem: [],
        shell: [],
        notifications: false,
        clipboard: undefined,
      },
      entrypoints: {
        main: 'index.js',
        commands: [],
      },
    };
  }

  private async validateManifest(
    manifest: any
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[]; manifest?: any }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.manifest_version) {
      errors.push('Missing manifest_version');
    } else if (manifest.manifest_version !== 1) {
      errors.push(`Unsupported manifest version: ${manifest.manifest_version}`);
    }

    if (!manifest.id || !/^[a-z0-9][a-z0-9.-]*$/.test(manifest.id)) {
      errors.push('Invalid plugin ID format');
    }

    if (!manifest.name || manifest.name.length > 100) {
      errors.push('Invalid plugin name');
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Invalid version format (expected semver)');
    }

    if (!manifest.author) {
      warnings.push('Missing author field');
    }

    if (!manifest.license) {
      warnings.push('Missing license field');
    }

    if (!manifest.permissions) {
      warnings.push('No permissions declared');
    }

    if (
      !manifest.entrypoints ||
      (!manifest.entrypoints.main &&
        !manifest.entrypoints.ui &&
        !manifest.entrypoints.commands?.length)
    ) {
      errors.push('At least one entrypoint required');
    }

    if (manifest.permissions) {
      const validPermissions = [
        'memory',
        'filesystem',
        'network',
        'shell',
        'notifications',
        'clipboard',
        'idle',
        'power',
        'idleDetection',
      ];
      for (const perm of Object.keys(manifest.permissions)) {
        if (
          ![
            'memory',
            'filesystem',
            'network',
            'shell',
            'notifications',
            'clipboard',
            'idle',
            'power',
            'idleDetection',
          ].includes(perm)
        ) {
          warnings.push(`Unknown permission: ${perm}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      manifest: errors.length === 0 ? manifest : undefined,
    };
  }

  private async loadPluginModule(manifest: any, sandbox: any): Promise<Record<string, any>> {
    const entrypoint = manifest.entrypoints?.main || 'index.js';
    // In a real implementation, this would load the module from the plugin directory
    // For now, return a mock export object
    return {
      default: {
        name: 'Example Plugin',
        version: '1.0.0',
        init: async () => {
          console.log('Plugin initialized');
        },
        cleanup: async () => {
          console.log('Plugin cleaned up');
        },
      },
      commands: [],
      hooks: [],
    };
  }

  async initializePlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.initialized) {
      return;
    }

    try {
      if (plugin.exports.default && typeof plugin.exports.default.init === 'function') {
        await plugin.exports.default.init();
      }
      plugin.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize plugin ${pluginId}: ${error}`);
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return;
    }

    try {
      if (plugin.exports.default && typeof plugin.exports.default.cleanup === 'function') {
        await plugin.exports.default.cleanup();
      }
      if (plugin.destroy) {
        await plugin.destroy();
      }
    } catch (error) {
      console.error(`Error unloading plugin ${pluginId}:`, error);
    } finally {
      this.loadedPlugins.delete(pluginId);
      const index = this.loadOrder.indexOf(pluginId);
      if (index !== -1) {
        this.loadOrder.splice(index, 1);
      }
    }
  }

  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  getAllPlugins(): LoadedPlugin[] {
    return this.loadOrder.map(id => this.loadedPlugins.get(id)!).filter(Boolean);
  }

  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  async loadAllPlugins(pluginsDir: string): Promise<LoadedPlugin[]> {
    // In a real implementation, this would scan the plugins directory
    // For now, return empty array
    return [];
  }

  async reloadPlugin(pluginId: string): Promise<LoadedPlugin> {
    await this.unloadPlugin(pluginId);
    // Would need to re-scan for the plugin path
    throw new Error('Hot reload not implemented yet');
  }

  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getPluginCount(): number {
    return this.loadedPlugins.size;
  }
}

export function createPluginLoader(options: Partial<PluginLoaderOptions> = {}): PluginLoader {
  return new PluginLoader({
    pluginsDir: './plugins',
    enableHotReload: false,
    maxPlugins: 50,
    strictValidation: true,
    ...options,
  });
}

export default PluginLoader;
