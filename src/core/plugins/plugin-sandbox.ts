// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Sandbox
 * Provides isolated execution environment for plugins with explicit permission controls
 */

export class PluginSandbox {
  private permissions: Map<string, any>;
  private context: Record<string, any>;

  constructor(manifest: any, permissions: Map<string, any>) {
    this.permissions = permissions;
    this.context = this.buildContext();
  }

  private buildContext(): Record<string, any> {
    return {
      console: this.createSafeConsole(),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      JSON: globalThis.JSON,
      Math: globalThis.Math,
      Date: globalThis.Date,
      Object: globalThis.Object,
      Array: globalThis.Array,
      String: globalThis.String,
      Number: globalThis.Number,
      Boolean: globalThis.Boolean,
      Promise: globalThis.Promise,
      Map: globalThis.Map,
      Set: globalThis.Set,
      WeakMap: globalThis.WeakMap,
      Symbol: globalThis.Symbol,
      Error: globalThis.Error,
      TypeError: globalThis.TypeError,
      crypto: this.createSafeCrypto(),
      fetch: this.createFetchWrapper(),
      performance: globalThis.performance,
      navigator: { userAgent: 'Eidovara-Plugin', language: 'en', onLine: true },
      localStorage: this.createSafeStorage('localStorage'),
      sessionStorage: this.createSafeStorage('sessionStorage'),
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      URL: globalThis.URL,
      URLSearchParams: globalThis.URLSearchParams,
      structuredClone: globalThis.structuredClone?.bind(globalThis),
      queueMicrotask: globalThis.queueMicrotask?.bind(globalThis),
    };
  }

  private createSafeConsole(): Console {
    const orig = globalThis.console;
    const methods = ['log', 'warn', 'error', 'info', 'debug'];
    const safe: any = {};
    for (const m of methods) {
      if (typeof orig[m] === 'function') {
        safe[m] = (...args: unknown[]) => orig[m].call(orig, '[Plugin]', ...args);
      }
    }
    return safe;
  }

  private createSafeCrypto() {
    const c = globalThis.crypto;
    return { getRandomValues: c.getRandomValues.bind(c), randomUUID: c.randomUUID.bind(c) };
  }

  private createFetchWrapper(): typeof fetch {
    const orig = globalThis.fetch;
    const allowed = new Set(this.getAllowedDomains());
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const host = new URL(url).hostname;
      if (!this.hasPermission('network')) throw new Error('Network access not permitted');
      if (allowed.size && !allowed.has(host))
        throw new Error(`Network access to ${host} not permitted`);
      return orig(input, init);
    };
  }

  private getAllowedDomains(): string[] {
    const perm = this.permissions.get('network');
    return Array.isArray(perm) ? perm : [];
  }

  private createSafeStorage(type: 'localStorage' | 'sessionStorage'): Storage {
    const orig = globalThis[type];
    const prefix = 'plugin_';
    return {
      getItem: (key: string) => orig.getItem(prefix + key),
      setItem: (key: string, value: string) => orig.setItem(prefix + key, value),
      removeItem: (key: string) => orig.removeItem(prefix + key),
      clear: () => {
        for (let i = orig.length - 1; i >= 0; i--) {
          const k = orig.key(i);
          if (k?.startsWith(prefix)) orig.removeItem(k);
        }
      },
      key: (index: number) => {
        let count = 0;
        for (let i = 0; i < orig.length; i++) {
          const k = orig.key(i);
          if (k?.startsWith(prefix)) {
            if (count === index) return k.slice(prefix.length);
            count++;
          }
        }
        return null;
      },
      get length() {
        let count = 0;
        for (let i = 0; i < orig.length; i++) {
          if (orig.key(i)?.startsWith(prefix)) count++;
        }
        return count;
      },
    };
  }

  getContext(): Record<string, any> {
    return this.context;
  }
  hasPermission(permission: string): boolean {
    return !!this.permissions.get(permission);
  }
  checkPermission(permission: string): void {
    if (!this.hasPermission(permission)) throw new Error(`Permission denied: ${permission}`);
  }
}

export function createPluginSandbox(manifest: any, permissions: Map<string, any>): PluginSandbox {
  return new PluginSandbox(manifest, permissions);
}
