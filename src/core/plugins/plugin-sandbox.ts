// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Plugin Sandbox
 * Provides isolated execution environment for plugins with explicit permission controls
 */

import { PluginPermission, PluginManifest } from './plugin-manifest.js';

export interface SandboxGlobals {
  console: Console;
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  fetch: typeof fetch;
  crypto: Crypto;
  JSON: JSON;
  Math: Math;
  Date: DateConstructor;
  Object: ObjectConstructor;
  Array: ArrayConstructor;
  String: StringConstructor;
  Number: NumberConstructor;
  Boolean: BooleanConstructor;
  Promise: PromiseConstructor;
  Map: MapConstructor;
  Set: SetConstructor;
  WeakMap: WeakMapConstructor;
  WeakSet: WeakSetConstructor;
  Promise: PromiseConstructor;
  Symbol: SymbolConstructor;
  Error: ErrorConstructor;
  TypeError: TypeErrorConstructor;
  ReferenceError: ReferenceErrorConstructor;
  SyntaxError: SyntaxErrorConstructor;
  RangeError: RangeErrorConstructor;
  URIError: URIErrorConstructor;
  EvalError: EvalErrorConstructor;
  ArrayBuffer: ArrayBufferConstructor;
  DataView: DataViewConstructor;
  Int8Array: Int8ArrayConstructor;
  Uint8Array: Uint8ArrayConstructor;
  Uint8ClampedArray: Uint8ClampedArrayConstructor;
  Int16Array: Int16ArrayConstructor;
  Uint16Array: Uint16ArrayConstructor;
  Int32Array: Int32ArrayConstructor;
  Uint32Array: Uint32ArrayConstructor;
  Float32Array: Float32ArrayConstructor;
  Float64Array: Float64ArrayConstructor;
  BigInt64Array: BigInt64ArrayConstructor;
  BigUint64Array: BigUint64ArrayConstructor;
  TextEncoder: TextEncoderConstructor;
  TextDecoder: TextDecoderConstructor;
  URL: URLConstructor;
  URLSearchParams: URLSearchParamsConstructor;
  FormData: FormDataConstructor;
  Blob: BlobConstructor;
  File: FileConstructor;
  FileReader: FileReaderConstructor;
  URLSearchParams: URLSearchParamsConstructor;
  ReadableStream: ReadableStreamConstructor;
  WritableStream: WritableStreamConstructor;
  TransformStream: TransformStreamConstructor;
  Response: ResponseConstructor;
  Request: RequestConstructor;
  Headers: HeadersConstructor;
  AbortController: AbortControllerConstructor;
  AbortSignal: AbortSignalConstructor;
  Event: EventConstructor;
  CustomEvent: CustomEventConstructor;
  EventTarget: EventTargetConstructor;
  DOMException: DOMExceptionConstructor;
  crypto: Crypto;
  atob: typeof atob;
  btoa: typeof btoa;
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  queueMicrotask: typeof queueMicrotask;
  structuredClone: typeof structuredClone;
  performance: Performance;
  navigator: Navigator;
  location: Location;
  localStorage: Storage;
  sessionStorage: Storage;
  indexedDB: IDBFactory;
  caches: CacheStorage;
  fetch: typeof fetch;
  crypto: Crypto;
}

export interface SandboxExports {
  [key: string]: any;
}

export class PluginSandbox {
  private permissions: Map<string, boolean>;
  private allowedGlobals: Set<string>;
  private deniedGlobals: Set<string>;
  private context: Record<string, any>;
  private moduleCache: Map<string, any>;
  private fetchWrapper: typeof fetch;

  constructor(private manifest: any, private permissions: Map<string, boolean>) {
    this.permissions = permissions;
    this.allowedGlobals = new Set([
      'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
      'fetch', 'crypto', 'JSON', 'Math', 'Date', 'Object', 'Array', 'String',
      'Number', 'Boolean', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
      'Symbol', 'Error', 'TypeError', 'ReferenceError', 'SyntaxError',
      'RangeError', 'URIError', 'EvalError', 'ArrayBuffer', 'DataView',
      'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array',
      'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array',
      'Float64Array', 'BigInt64Array', 'BigUint64Array',
      'TextEncoder', 'TextDecoder', 'URL', 'URLSearchParams',
      'FormData', 'Blob', 'File', 'FileReader', 'URLSearchParams',
      'ReadableStream', 'WritableStream', 'TransformStream',
      'Response', 'Request', 'Headers', 'AbortController', 'AbortSignal',
      'Event', 'CustomEvent', 'EventTarget', 'DOMException',
      'crypto', 'atob', 'btoa', 'setTimeout', 'clearTimeout',
      'setInterval', 'clearInterval', 'queueMicrotask',
      'structuredClone', 'performance', 'navigator', 'location',
      'localStorage', 'sessionStorage', 'indexedDB', 'caches',
      'fetch', 'crypto', 'performance', 'navigator', 'location',
      'localStorage', 'sessionStorage', 'indexedDB', 'caches'
    ]);
    this.deniedGlobals = new Set([
      'eval', 'Function', 'FunctionConstructor', 'eval',
      'require', 'import', 'importScripts',
      'process', 'global', 'globalThis', 'window', 'self',
      'document', 'documentElement', 'documentFragment',
      'Node', 'Element', 'HTMLElement', 'HTMLDocument',
      'XMLHttpRequest', 'fetch', 'WebSocket', 'Worker',
      'SharedWorker', 'ServiceWorker', 'BroadcastChannel',
      'MessageChannel', 'MessagePort', 'postMessage',
      'localStorage', 'sessionStorage', 'indexedDB',
      'open', 'openDatabase', 'indexedDB', 'caches',
      'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
      'FileReader', 'FileReaderSync', 'File', 'Blob',
      'URL', 'URLSearchParams', 'FormData', 'Blob',
      'File', 'FileReader', 'FileReaderSync',
      'Worker', 'SharedWorker', 'ServiceWorker',
      'BroadcastChannel', 'MessageChannel', 'MessagePort',
      'postMessage', 'importScripts', 'close',
      'crypto', 'crypto', 'subtle', 'getRandomValues',
      'webkitRequestFileSystem', 'webkitResolveLocalFileSystemURL',
      'webkitStorageInfo', 'webkitRequestFileSystem',
      'webkitResolveLocalFileSystemURL', 'webkitStorageInfo',
      'webkitRequestFileSystem', 'webkitResolveLocalFileSystemURL',
      'webkitStorageInfo', 'webkitRequestFileSystem',
      'webkitResolveLocalFileSystemURL', 'webkitStorageInfo'
    ]);
    this.moduleCache = new Map();
    this.context = {};
    this.initContext();
  }

  private initContext() {
    this.context = {
      console: this.createSafeConsole(),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      fetch: this.createFetchWrapper(),
      crypto: this.createSafeCrypto(),
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
      WeakSet: globalThis.WeakSet,
      Promise: globalThis.Promise,
      Symbol: globalThis.Symbol,
      Error: globalThis.Error,
      TypeError: globalThis.TypeError,
      ReferenceError: globalThis.ReferenceError,
      SyntaxError: globalThis.SyntaxError,
      RangeError: globalThis.RangeError,
      URIError: globalThis.URIError,
      EvalError: globalThis.EvalError,
      ArrayBuffer: globalThis.ArrayBuffer,
      DataView: globalThis.DataView,
      Int8Array: globalThis.Int8Array,
      Uint8Array: globalThis.Uint8Array,
      Uint8ClampedArray: globalThis.Uint8ClampedArray,
      Int16Array: globalThis.Int16Array,
      Uint16Array: globalThis.Uint16Array,
      Int32Array: globalThis.Int32Array,
      Uint32Array: globalThis.Uint32Array,
      Float32Array: globalThis.Float32Array,
      Float64Array: globalThis.Float64Array,
      BigInt64Array: globalThis.BigInt64Array,
      BigUint64Array: globalThis.BigUint64Array,
      TextEncoder: globalThis.TextEncoder,
      TextDecoder: globalThis.TextDecoder,
      URL: globalThis.URL,
      URLSearchParams: globalThis.URLSearchParams,
      FormData: globalThis.FormData,
      Blob: globalThis.Blob,
      File: globalThis.File,
      FileReader: globalThis.FileReader,
      URLSearchParams: globalThis.URLSearchParams,
      ReadableStream: globalThis.ReadableStream,
      WritableStream: globalThis.WritableStream,
      TransformStream: globalThis.TransformStream,
      Response: globalThis.Response,
      Request: globalThis.Request,
      Headers: globalThis.Headers,
      AbortController: globalThis.AbortController,
      AbortSignal: globalThis.AbortSignal,
      Event: globalThis.Event,
      CustomEvent: globalThis.CustomEvent,
      EventTarget: globalThis.EventTarget,
      DOMException: globalThis.DOMException,
      crypto: this.createSafeCrypto(),
      atob: globalThis.atob.bind(globalThis),
      btoa: globalThis.btoa.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      setInterval: globalThis.setInterval.bind(globalThis),
      clearInterval: globalThis.clearInterval.bind(globalThis),
      queueMicrotask: globalThis.queueMicrotask.bind(globalThis),
      structuredClone: globalThis.structuredClone.bind(globalThis),
      performance: globalThis.performance,
      navigator: this.createSafeNavigator(),
      location: this.createSafeLocation(),
      localStorage: this.createSafeStorage('localStorage'),
      sessionStorage: this.createSafeStorage('sessionStorage'),
      indexedDB: this.createSafeIndexedDB(),
      caches: this.createSafeCaches(),
      fetch: this.createFetchWrapper(),
      crypto: this.createSafeCrypto()
    };
  }

  private createSafeConsole(): Console {
    const originalConsole = globalThis.console;
    const safeMethods = ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'time', 'timeEnd', 'group', 'groupEnd', 'groupCollapsed'];
    const safeConsole: any = {};
    for (const method of safeMethods) {
      if (typeof originalConsole[method] === 'function') {
        safeConsole[method] = (...args: any[]) => {
          originalConsole[method].call(originalConsole, '[Plugin]', ...args);
        };
      } else {
        safeConsole[method] = () => {};
      }
    }
    return safeConsole;
  }

  private createSafeCrypto(): Crypto {
    const originalCrypto = globalThis.crypto;
    return {
      getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
      randomUUID: originalCrypto.randomUUID.bind(originalCrypto),
      subtle: originalCrypto.subtle
    };
  }

  private createSafeNavigator(): Navigator {
    const originalNavigator = globalThis.navigator;
    return {
      userAgent: originalNavigator.userAgent,
      language: originalNavigator.language,
      languages: originalNavigator.languages,
      platform: originalNavigator.platform,
      userAgentData: originalNavigator.userAgentData,
      onLine: originalNavigator.onLine,
      cookieEnabled: originalNavigator.cookieEnabled,
      doNotTrack: originalNavigator.doNotTrack,
      hardwareConcurrency: originalNavigator.hardwareConcurrency,
      deviceMemory: originalNavigator.deviceMemory,
      maxTouchPoints: originalNavigator.maxTouchPoints,
      pdfViewerEnabled: originalNavigator.pdfViewerEnabled,
      userActivation: originalNavigator.userActivation,
      clipboard: originalNavigator.clipboard,
      credentials: originalNavigator.credentials,
      keyboard: originalNavigator.keyboard,
      locks: originalNavigator.locks,
      mediaCapabilities: originalNavigator.mediaCapabilities,
      mediaDevices: originalNavigator.mediaDevices,
      mediaSession: originalNavigator.mediaSession,
      permissions: originalNavigator.permissions,
      presentation: originalNavigator.presentation,
      scheduling: originalNavigator.scheduling,
      serviceWorker: originalNavigator.serviceWorker,
      storage: originalNavigator.storage,
      usb: originalNavigator.usb,
      virtualKeyboard: originalNavigator.virtualKeyboard,
      wakeLock: originalNavigator.wakeLock,
      xr: originalNavigator.xr,
      geolocation: originalNavigator.geolocation,
      hid: originalNavigator.hid,
      keyboard: originalNavigator.keyboard,
      managed: originalNavigator.managed,
      mediaCapabilities: originalNavigator.mediaCapabilities,
      mediaDevices: originalNavigator.mediaDevices,
      mediaSession: originalNavigator.mediaSession,
      permissions: originalNavigator.permissions,
      serial: originalNavigator.serial,
      storage: originalNavigator.storage,
      bluetooth: originalNavigator.bluetooth,
      contacts: originalNavigator.contacts,
      gpu: originalNavigator.gpu,
      ink: originalNavigator.ink,
      nativeIO: originalNavigator.nativeIO,
      presentation: originalNavigator.presentation,
      scheduling: originalNavigator.scheduling,
      storage: originalNavigator.storage,
      wakeLock: originalNavigator.wakeLock,
      windowControlsOverlay: originalNavigator.windowControlsOverlay
    };
  }

  private createSafeLocation(): Location {
    const originalLocation = globalThis.location;
    return {
      href: originalLocation.href,
      origin: originalLocation.origin,
      protocol: originalLocation.protocol,
      host: originalLocation.host,
      hostname: originalLocation.hostname,
      port: originalLocation.port,
      pathname: originalLocation.pathname,
      search: originalLocation.search,
      hash: originalLocation.hash,
      toString: () => originalLocation.toString(),
      assign: () => { throw new Error('Location.assign not allowed in plugin sandbox'); },
      replace: () => { throw new Error('Location.replace not allowed in plugin sandbox'); },
      reload: () => { throw new Error('Location.reload not allowed in plugin sandbox'); },
      toString: () => originalLocation.toString()
    };
  }

  private createSafeStorage(type: 'localStorage' | 'sessionStorage'): Storage {
    const originalStorage = globalThis[type];
    const prefix = 'plugin_';
    return {
      length: originalStorage.length,
      clear: () => {
        for (let i = originalStorage.length - 1; i >= 0; i--) {
          const key = originalStorage.key(i);
          if (key?.startsWith('plugin_')) {
            originalStorage.removeItem(key);
          }
        }
      },
      getItem: (key: string) => {
        return originalStorage.getItem(prefix + key);
      },
      setItem: (key: string, value: string) => {
        originalStorage.setItem(prefix + key, value);
      },
      removeItem: (key: string) => {
        originalStorage.removeItem(prefix + key);
      },
      key: (index: number) => {
        let count = 0;
        for (let i = 0; i < originalStorage.length; i++) {
          const key = originalStorage.key(i);
          if (key?.startsWith(prefix)) {
            if (count === index) return key.slice(prefix.length);
            count++;
          }
        }
        return null;
      },
      get length() {
        let count = 0;
        for (let i = 0; i < originalStorage.length; i++) {
          if (originalStorage.key(i)?.startsWith(prefix)) count++;
        }
        return count;
      }
    };
  }

  private createSafeIndexedDB(): IDBFactory {
    const originalIDB = globalThis.indexedDB;
    return {
      open: (name: string, version?: number) => {
        const pluginName = 'plugin_';
        return originalIDB.open(pluginName + name, version);
      },
      deleteDatabase: (name: string) => {
        return originalIDB.deleteDatabase('plugin_' + name);
      },
      databases: () => {
        return originalIDB.databases?.().then((dbs: any[]) => 
          dbs.filter((db: any) => db.name?.startsWith('plugin_'))
        );
      },
      cmp: originalIDB.cmp.bind(originalIDB)
    };
  }

  private createSafeCaches(): CacheStorage {
    const originalCaches = globalThis.caches;
    return {
      open: (name: string) => originalCaches.open('plugin_' + name),
      delete: (name: string) => originalCaches.delete('plugin_' + name),
      has: (name: string) => originalCaches.has('plugin_' + name),
      keys: () => originalCaches.keys().then(keys => keys.filter(k => k.startsWith('plugin_')))
    };
  }

  private createFetchWrapper(): typeof fetch {
    const originalFetch = globalThis.fetch;
    const allowedDomains = new Set(this.getAllowedDomains());
    
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const urlObj = new URL(url);
      
      if (!this.hasPermission('network')) {
        throw new Error('Network access not permitted for this plugin');
      }
      
      if (!allowedDomains.size || allowedDomains.has(urlObj.hostname)) {
        return originalFetch(input, init);
      }
      
      throw new Error(`Network access to ${urlObj.hostname} not permitted`);
    };
  }

  private getAllowedDomains(): string[] {
    const networkPerm = this.permissions.get('network');
    if (networkPerm && Array.isArray(networkPerm)) {
      return networkPerm;
    }
    return [];
  }

  private createSafeLocation(): Location {
    const originalLocation = globalThis.location;
    return {
      href: 'https://eidovara.org/',
      origin: 'https://eidovara.org',
      protocol: 'https:',
      host: 'eidovara.org',
      hostname: 'eidovara.org',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      toString: () => 'https://eidovara.org/',
      assign: () => { throw new Error('Location.assign not allowed'); },
      replace: () => { throw new Error('Location.replace not allowed'); },
      reload: () => { throw new Error('Location.reload not allowed'); },
      toString: () => 'https://eidovara.org/',
      assign: () => { throw new Error('Location.assign not allowed'); },
      replace: () => { throw new Error('Location.replace not allowed'); },
      reload: () => { throw new Error('Location.reload not allowed'); },
      toString: () => 'https://eidovara.org/'
    };
  }

  getContext(): Record<string, any> {
    return this.context;
  }

  getModuleCache(): Map<string, any> {
    return this.moduleCache;
  }

  require(moduleName: string): any {
    if (this.moduleCache.has(moduleName)) {
      return this.moduleCache.get(moduleName);
    }

    const allowedModules = [
      'crypto', 'crypto/subtle', 'crypto/webcrypto',
      'url', 'url-pattern', 'path', 'path/posix', 'path/win32',
      'util', 'util/types', 'assert', 'assert/strict',
      'buffer', 'buffer/buffer', 'buffer/constants',
      'events', 'stream', 'stream/consumers', 'stream/promises',
      'stream/web', 'string_decoder', 'querystring',
      'punycode', 'querystring', 'url', 'url-pattern',
      'zlib', 'zlib/constants', 'zlib/cjs'
    ];

    const moduleName = arguments[0] as string;
    if (!allowedModules.includes(moduleName)) {
      throw new Error(`Module "${moduleName}" not allowed in plugin sandbox`);
    }

    // In a real implementation, this would load from a bundled module
    // For now, return a mock or the actual Node.js module if available
    return {};
  }

  getContext(): Record<string, any> {
    return this.context;
  }

  getModuleCache(): Map<string, any> {
    return this.moduleCache;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.get(permission) === true;
  }

  checkPermission(permission: string): void {
    if (!this.hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  getAllowedDomains(): string[] {
    const networkPerm = this.getAllowedDomains();
    return networkPerm;
  }
}

export function createPluginSandbox(manifest: any, permissions: Map<string, boolean>): PluginSandbox {
  return new PluginSandbox(manifest, permissions);
}

export default PluginSandbox;