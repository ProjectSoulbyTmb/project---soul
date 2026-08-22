// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Manifest Types
 * Defines the structure and validation for Soul plugin manifests
 */

export type ClipboardAccess = 'read' | 'write' | 'both';

export interface PluginPermission {
  memory?: boolean;
  filesystem?: string[];
  network?: string[];
  shell?: string[];
  notifications?: boolean;
  clipboard?: ClipboardAccess;
  idle?: boolean;
  power?: boolean;
  idleDetection?: boolean;
}

export interface PluginCommandParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'directory';
  description: string;
  required?: boolean;
  default?: any;
  options?: { value: string; label: string }[];
}

export interface PluginCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category?: string;
  action: string;
  params?: PluginCommandParam[];
}

export interface PluginHook {
  name: string;
  event: string;
  handler: string;
  priority?: number;
  once?: boolean;
  async?: boolean;
}

export interface PluginEntrypoint {
  main?: string;
  ui?: string;
  commands?: PluginCommand[];
  hooks?: PluginHook[];
  service?: string;
  worker?: string;
}

export interface PluginManifest {
  manifest_version: number;
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  keywords?: string[];
  homepage?: string;
  repository?: string;
  funding?: string;
  permissions: PluginPermission;
  entrypoints: PluginEntrypoint;
  dependencies?: Record<string, string>;
  engines?: { eidovara: string; node?: string };
  categories?: string[];
  icon?: string;
  minEidovaraVersion?: string;
  platform?: ('windows' | 'linux' | 'darwin')[];
  languages?: string[];
  maturity?: 'alpha' | 'beta' | 'stable' | 'deprecated';
  publisher?: string;
  tags?: string[];
}

export const PLUGIN_MANIFEST_VERSION = 1;
export const MIN_EIDOVARA_VERSION = '1.0.0';
export const PLUGIN_PERMISSION_TYPES = [
  'memory',
  'filesystem',
  'network',
  'shell',
  'notifications',
  'clipboard',
  'idle',
  'power',
  'idleDetection',
] as const;

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: PluginManifest;
}
