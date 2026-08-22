// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Registry
 * Manages plugin registration, discovery, and lifecycle
 */

import {
  PluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission,
} from './plugin-manifest.js';
import { PluginLoader, createPluginLoader, PluginLoader, LoadedPlugin } from './plugin-loader.js';
import { PluginSandbox, createPluginSandbox, PluginSandbox } from './plugin-sandbox.js';

export interface PluginRegistryOptions {
  pluginsDir: string;
  enableHotReload: boolean;
  maxPlugins: number;
  autoLoad: boolean;
  strictValidation: boolean;
}

export interface PluginRegistryEvents {
  onPluginLoaded: (pluginId: string, manifest: any) => void;
  onPluginUnloaded: (pluginId: string) => void;
  onPluginError: (pluginId: string, error: Error) => void;
  onPluginStateChange: (
    pluginId: string,
    state: 'loading' | 'loaded' | 'error' | 'unloaded'
  ) => void;
}

export interface PluginRegistryOptions {
  pluginsDir: string;
  enableHotReload: boolean;
  maxPlugins: number;
  autoLoad: boolean;
  strictValidation: boolean;
}

export interface PluginRegistryEvents {
  onPluginLoaded?: (pluginId: string, manifest: any) => void;
  onPluginUnloaded?: (pluginId: string) => void;
  onPluginError?: (pluginId: string, error: Error) => void;
  onPluginStateChange?: (
    pluginId: string,
    state: 'loading' | 'loaded' | 'error' | 'unloaded'
  ) => void;
}

export class PluginRegistry {
  private pluginsDir: string;
  private loader: any;
  private loadedPlugins: Map<string, any> = new Map();
  private loadOrder: string[] = [];
  private options: {
    pluginsDir: string;
    enableHotReload: boolean;
    maxPlugins: number;
    autoLoad: boolean;
    strictValidation: boolean;
  };
  private eventHandlers: {
    onPluginLoaded?: (pluginId: string, manifest: any) => void;
    onPluginUnloaded?: (pluginId: string) => void;
    onPluginError?: (pluginId: string, error: Error) => void;
    onPluginStateChange?: (
      pluginId: string,
      state: 'loading' | 'loaded' | 'error' | 'unloaded'
    ) => void;
  } = {};

  constructor(
    options: {
      pluginsDir: string;
      enableHotReload?: boolean;
      maxPlugins?: number;
      autoLoad?: boolean;
      strictValidation?: boolean;
    } = {}
  ) {
    this.pluginsDir = options.pluginsDir || './plugins';
    this.options = {
      enableHotReload: options.enableHotReload ?? false,
      maxPlugins: options.maxPlugins ?? 50,
      autoLoad: options.autoLoad ?? true,
      strictValidation: options.strictValidation ?? true,
    };
  }

  async initialize(): Promise<void> {
    if (this.options.autoLoad) {
      await this.loadAllPlugins();
    }
  }

  async loadPlugin(pluginPath: string): Promise<any> {
    // This would use the PluginLoader to load a plugin
    // For now, return a mock
    return {
      manifest: { id: 'example', name: 'Example', version: '1.0.0' },
      sandbox: {},
      exports: {},
      initialized: true,
    };
  }

  async loadAllPlugins(): Promise<void> {
    // In a real implementation, this would scan the plugins directory
    // and load all valid plugins
  }

  async loadPlugin(pluginPath: string): Promise<any> {
    // Mock implementation
    return { manifest: { id: 'example' } };
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    // Unload a plugin
  }

  getPlugin(pluginId: string): any {
    return null;
  }

  getAllPlugins(): any[] {
    return [];
  }

  isLoaded(pluginId: string): boolean {
    return false;
  }

  on(event: string, handler: Function): void {
    // Event registration
  }

  off(event: string, handler: Function): void {
    // Remove event handler
  }

  emit(event: string, ...args: any[]): void {
    // Emit event
  }
}

export function createPluginRegistry(
  options: {
    pluginsDir: string;
    enableHotReload?: boolean;
    maxPlugins?: number;
    autoLoad?: boolean;
    strictValidation?: boolean;
  } = {}
): {
  initialize: () => Promise<void>;
  loadPlugin: (pluginPath: string) => Promise<any>;
  loadAllPlugins: () => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
  getPlugin: (pluginId: string) => any;
  getAllPlugins: () => any[];
  on: (event: string, handler: Function) => void;
  off: (event: string, handler: Function) => void;
  emit: (event: string, ...args: any[]) => void;
} {
  const registry = {
    initialize: async () => {},
    loadPlugin: async (pluginPath: string) => ({ manifest: { id: 'example' } }),
    loadAllPlugins: async () => {},
    unloadPlugin: async (pluginId: string) => {},
    getPlugin: (pluginId: string) => null,
    getAllPlugins: () => [],
    on: (event: string, handler: Function) => {},
    off: (event: string, handler: Function) => {},
    emit: (event: string, ...args: any[]) => {},
  };
  return registry;
}

export function createPluginRegistryWithOptions(
  options: {
    pluginsDir: string;
    enableHotReload?: boolean;
    maxPlugins?: number;
    autoLoad?: boolean;
    strictValidation?: boolean;
  } = {}
) {
  return createPluginRegistry(options);
}

export default {
  createPluginRegistry,
  createPluginRegistryWithOptions,
};
