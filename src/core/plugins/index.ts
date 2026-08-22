// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin System Main Entry Point
 * Exports all plugin system components
 */

export * from './plugin-manifest.js';
export * from './plugin-sandbox.js';
export * from './plugin-loader.js';
export * from './plugin-registry.js';

// Re-export types
export type {
  PluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission,
  PluginManifestInput,
  PluginPermission,
  PluginManifestInput,
  PluginManifest,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginCommand,
  PluginCommandParam,
  PluginHook,
  PluginEntrypoint,
  PluginCommand,
  PluginCommandParam,
  PluginHook,
  PluginEntrypoint,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission,
  PluginPermission,
  PluginManifestInput,
  PluginManifest,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission
} from './plugin-manifest.js';

export type {
  PluginSandbox,
  SandboxGlobals,
  SandboxExports
} from './plugin-sandbox.js';

export type {
  LoadedPlugin,
  PluginLoaderOptions,
  PluginLoader
} from './plugin-loader.js';

export type {
  PluginRegistryOptions,
  PluginRegistryEvents,
  PluginRegistryOptions,
  PluginRegistryEvents
} from './plugin-registry.js';

export {
  createPluginSandbox,
  PluginSandbox
} from './plugin-sandbox.js';

export {
  createPluginLoader,
  PluginLoader
} from './plugin-loader.js';

export {
  createPluginRegistry,
  createPluginRegistryWithOptions,
  PluginRegistry
} from './plugin-registry.js';

export {
  createPluginSandbox,
  PluginSandbox
} from './plugin-sandbox.js';

export {
  createPluginLoader,
  PluginLoader
} from './plugin-loader.js';

export {
  createPluginRegistry,
  createPluginRegistryWithOptions,
  PluginRegistry
} from './plugin-registry.js';

export {
  PLUGIN_MANIFEST_VERSION,
  PLUGIN_PERMISSION_TYPES,
  PLUGIN_PERMISSION_DEFAULTS,
  PLUGIN_MATURITY_LEVELS,
  PLUGIN_PLATFORMS,
  PLUGIN_CLIPBOARD_ACCESS,
  PLUGIN_MATURITY_LEVELS,
  PluginValidationResult,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginManifest,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission,
  PluginPermission,
  PluginManifestInput,
  PluginManifest,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission
} from './plugin-manifest.js';

export {
  PLUGIN_MANIFEST_VERSION,
  PLUGIN_PERMISSION_TYPES,
  PLUGIN_PERMISSION_DEFAULTS,
  PLUGIN_MATURITY_LEVELS,
  PLUGIN_PLATFORMS,
  PLUGIN_CLIPBOARD_ACCESS,
  PLUGIN_MATURITY_LEVELS,
  PluginValidationResult,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginManifest,
  PluginManifestV1,
  ValidatedPluginManifest,
  PluginManifestInput,
  PluginValidationResult,
  PluginPermission
} from './plugin-manifest.js';