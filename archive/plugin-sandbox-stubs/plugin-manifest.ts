// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Manifest Types
 * Defines the structure and validation for Soul plugin manifests
 */

export type PermissionType =
  | 'memory'
  | 'filesystem'
  | 'network'
  | 'shell'
  | 'notifications'
  | 'clipboard'
  | 'idle'
  | 'power'
  | 'idle-detection';

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

export interface PluginCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category?: string;
  action: string;
  params?: PluginCommandParam[];
}

export interface PluginCommandParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'directory';
  description: string;
  required?: boolean;
  default?: any;
  options?: { value: string; label: string }[];
}

export interface PluginHook {
  name: string;
  event: string;
  handler: string;
  priority?: number;
  once?: boolean;
}

export interface PluginEntryPoint {
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
  entrypoints: PluginEntryPoint;
  dependencies?: Record<string, string>;
  engines?: {
    eidovara: string;
    node?: string;
  };
  categories?: string[];
  screenshots?: string[];
  icon?: string;
  minEidovaraVersion?: string;
  maxEidovaraVersion?: string;
  platform?: ('windows' | 'linux' | 'darwin')[];
  languages?: string[];
  maturity?: 'alpha' | 'beta' | 'stable' | 'deprecated';
  publisher?: string;
  license?: string;
  privacyPolicy?: string;
  supportUrl?: string;
  contributionGuide?: string;
  changelog?: string;
  tags?: string[];
}

export interface PluginCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category?: string;
  action: string;
  params?: PluginCommandParam[];
  hidden?: boolean;
  requireAdmin?: boolean;
  confirmBeforeRun?: boolean;
  icon?: string;
}

export interface PluginCommandParam {
  name: string;
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'select'
    | 'file'
    | 'directory'
    | 'color'
    | 'date'
    | 'time'
    | 'json';
  description: string;
  required?: boolean;
  default?: any;
  options?: { value: string; label: string }[];
  validation?: string;
  dependsOn?: string;
}

export interface PluginHook {
  name: string;
  event: string;
  handler: string;
  priority?: number;
  once?: boolean;
  filter?: string;
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
  engines?: {
    eidovara: string;
    node?: string;
  };
  categories?: string[];
  screenshots?: string[];
  icon?: string;
  minEidovaraVersion?: string;
  maxEidovaraVersion?: string;
  platform?: ('windows' | 'linux' | 'darwin')[];
  languages?: string[];
  maturity?: 'alpha' | 'beta' | 'stable' | 'deprecated';
  publisher?: string;
  license?: string;
  privacyPolicy?: string;
  supportUrl?: string;
  contributionGuide?: string;
  changelog?: string;
  tags?: string[];
}

export interface PluginManifestV1 extends PluginManifest {
  manifest_version: 1;
}

export interface ValidatedPluginManifest extends PluginManifest {
  validated: true;
  validatedAt: string;
  checksum: string;
  signature?: string;
}

export type PluginManifestInput = Omit<
  PluginManifest,
  'manifest_version' | 'validated' | 'validatedAt' | 'checksum' | 'signature'
>;

export const PLUGIN_MANIFEST_VERSION = 1;
export const PLUGIN_PERMISSION_TYPES = [
  'memory',
  'filesystem',
  'network',
  'shell',
  'notifications',
  'clipboard',
  'idle',
  'power',
  'idle-detection',
] as const;

export const PLUGIN_PERMISSION_DEFAULTS: PluginPermission = {
  memory: false,
  filesystem: [],
  network: [],
  shell: [],
  notifications: false,
  clipboard: undefined,
  idle: false,
  power: false,
  idleDetection: false,
};

export const PLUGIN_MATURITY_LEVELS = ['alpha', 'beta', 'stable', 'deprecated'] as const;
export const PLUGIN_PLATFORMS = ['windows', 'linux', 'darwin'] as const;
export const PLUGIN_CLIPBOARD_ACCESS = ['read', 'write', 'both'] as const;
export const PLUGIN_MATURITY_LEVELS = ['alpha', 'beta', 'stable', 'deprecated'] as const;

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: PluginManifest;
}

export const PLUGIN_MANIFEST_SCHEMA_VERSION = 1;
export const MIN_EIDOVARA_VERSION = '1.0.0';
export const MAX_MANIFEST_SIZE = 1024 * 1024; // 1MB
