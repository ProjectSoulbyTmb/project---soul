// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * @module core/telemetry
 * @description Lightweight observability hooks for performance monitoring
 * No external dependencies - uses native Performance API
 */

const metrics = new Map();
const spans = new Map();
let enabled = false;

/**
 * Enable/disable telemetry collection
 * @param {boolean} state
 */
export function setTelemetryEnabled(state) {
  enabled = Boolean(state);
}

/**
 * Check if telemetry is enabled
 * @returns {boolean}
 */
export function isTelemetryEnabled() {
  return enabled;
}

/**
 * Start a named span for timing
 * @param {string} name - Span name (e.g., 'provider.call', 'ipc.respond')
 * @param {Object} [attributes] - Additional attributes
 * @returns {string} Span ID
 */
export function startSpan(name, attributes = {}) {
  if (!enabled) return '';
  const spanId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  spans.set(spanId, {
    name,
    startTime: performance.now(),
    attributes: { ...attributes, 'span.type': 'internal' },
    endTime: null,
  });
  return spanId;
}

/**
 * End a span and record duration
 * @param {string} spanId
 * @param {Object} [extraAttributes]
 * @returns {number|null} Duration in ms, or null if not found
 */
export function endSpan(spanId, extraAttributes = {}) {
  if (!enabled || !spanId || !spans.has(spanId)) return null;
  const span = spans.get(spanId);
  span.endTime = performance.now();
  span.duration = span.endTime - span.startTime;
  span.attributes = { ...span.attributes, ...extraAttributes };
  
  // Store completed span for aggregation
  const key = span.name;
  if (!metrics.has(key)) metrics.set(key, []);
  metrics.get(key).push({ ...span, timestamp: Date.now() });
  
  // Keep only last 1000 per metric
  const arr = metrics.get(key);
  if (arr.length > 1000) arr.shift();
  
  spans.delete(spanId);
  return span.duration;
}

/**
 * Record a simple metric value
 * @param {string} name - Metric name
 * @param {number} value - Numeric value
 * @param {Object} [attributes]
 */
export function recordMetric(name, value, attributes = {}) {
  if (!enabled) return;
  const key = `metric.${name}`;
  if (!metrics.has(key)) metrics.set(key, []);
  metrics.get(key).push({ value, attributes, timestamp: Date.now() });
  const arr = metrics.get(key);
  if (arr.length > 1000) arr.shift();
}

/**
 * Record a counter increment
 * @param {string} name
 * @param {number} [delta=1]
 * @param {Object} [attributes]
 */
export function incrementCounter(name, delta = 1, attributes = {}) {
  if (!enabled) return;
  const key = `counter.${name}`;
  if (!metrics.has(key)) metrics.set(key, []);
  metrics.get(key).push({ delta, attributes, timestamp: Date.now() });
  const arr = metrics.get(key);
  if (arr.length > 1000) arr.shift();
}

/**
 * Get aggregated metrics for a name
 * @param {string} name
 * @returns {Object} Aggregated stats
 */
export function getMetrics(name) {
  const key = name.startsWith('metric.') || name.startsWith('counter.') ? name : `metric.${name}`;
  const data = metrics.get(key) || [];
  if (!data.length) return { count: 0 };
  
  const values = data.map(d => d.value ?? d.delta ?? 0).filter(v => typeof v === 'number');
  if (!values.length) return { count: data.length };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / values.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    latest: values[values.length - 1],
  };
}

/**
 * Get all metric names
 * @returns {string[]}
 */
export function getMetricNames() {
  return [...metrics.keys()].filter(k => k.startsWith('metric.') || k.startsWith('counter.'));
}

/**
 * Get span statistics for a name
 * @param {string} name
 * @returns {Object}
 */
export function getSpanStats(name) {
  const data = metrics.get(name) || [];
  if (!data.length) return { count: 0 };
  
  const durations = data.map(d => d.duration).filter(d => typeof d === 'number');
  if (!durations.length) return { count: data.length };
  
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = durations.reduce((a, b) => a + b, 0);
  return {
    count: durations.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / durations.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

/**
 * Get all span names
 * @returns {string[]}
 */
export function getSpanNames() {
  return [...metrics.keys()].filter(k => !k.startsWith('metric.') && !k.startsWith('counter.'));
}

/**
 * Export all metrics as JSON
 * @returns {Object}
 */
export function exportMetrics() {
  const result = {};
  for (const [key, data] of metrics.entries()) {
    if (key.startsWith('metric.') || key.startsWith('counter.')) {
      result[key] = getMetrics(key);
    } else {
      result[key] = getSpanStats(key);
    }
  }
  return result;
}

/**
 * Clear all metrics
 */
export function clearMetrics() {
  metrics.clear();
  spans.clear();
}

/**
 * Convenience wrapper for timing async functions
 * @template T
 * @param {string} name
 * @param {() => Promise<T>} fn
 * @param {Object} [attributes]
 * @returns {Promise<T>}
 */
export async function timeAsync(name, fn, attributes = {}) {
  const spanId = startSpan(name, attributes);
  try {
    return await fn();
  } finally {
    endSpan(spanId);
  }
}

/**
 * Convenience wrapper for timing sync functions
 * @template T
 * @param {string} name
 * @param {() => T} fn
 * @param {Object} [attributes]
 * @returns {T}
 */
export function timeSync(name, fn, attributes = {}) {
  const spanId = startSpan(name, attributes);
  try {
    return fn();
  } finally {
    endSpan(spanId);
  }
}

/**
 * IPC-specific timing helpers
 */
export const ipcTelemetry = {
  /**
   * @param {string} channel - IPC channel name
   * @param {() => Promise<any>} handler
   * @returns {any} synchronous result of fn
   */
  async handle(channel, handler) {
    return timeAsync(`ipc.${channel}`, handler, { 'ipc.channel': channel });
  },
  
  /**
   * @param {string} channel
   * @param {number} durationMs
   * @param {boolean} success
   */
  record(channel, durationMs, success = true) {
    recordMetric(`ipc.${channel}.duration`, durationMs, { 'ipc.channel': channel });
    incrementCounter(`ipc.${channel}.${success ? 'success' : 'error'}`, 1, { 'ipc.channel': channel });
  },
};

/**
 * Provider-specific timing helpers
 */
export const providerTelemetry = {
  /**
   * @param {string} provider - Provider name (offline, local, compatible)
   * @param {() => Promise<string>} call
   * @returns {Promise<string>}
   */
  async call(provider, call) {
    return timeAsync(`provider.${provider}.call`, call, { 'provider': provider });
  },
  
  /**
   * @param {string} provider
   * @param {number} durationMs
   * @param {boolean} success
   * @param {number} [tokens]
   */
  record(provider, durationMs, success = true, tokens) {
    recordMetric(`provider.${provider}.latency`, durationMs, { provider });
    incrementCounter(`provider.${provider}.${success ? 'success' : 'error'}`, 1, { provider });
    if (tokens) recordMetric(`provider.${provider}.tokens`, tokens, { provider });
  },
};

/**
 * Store operation timing
 */
export const storeTelemetry = {
  /**
   * Times a synchronous store operation and returns its result.
   * The engine consumes load()/reset()/restoreBackup() synchronously, so this
   * wrapper MUST stay synchronous — returning a Promise here silently replaces
   * engine state with telemetry metadata.
   * @param {string} op - Operation (load, save, backup, restore)
   * @param {() => any} fn
   * @returns {any} the result of fn()
   */
  op(op, fn) {
    const startedAt = Date.now();
    try {
      const result = fn();
      this.record(op, Date.now() - startedAt, true);
      return result;
    } catch (error) {
      this.record(op, Date.now() - startedAt, false);
      throw error;
    }
  },
  
  record(op, durationMs, success = true, size) {
    recordMetric(`store.${op}.latency`, durationMs, { op });
    incrementCounter(`store.${op}.${success ? 'success' : 'error'}`, 1, { op });
    if (size) recordMetric(`store.${op}.size`, size, { op });
  },
};

/**
 * Get telemetry snapshot for diagnostics
 * @returns {Object}
 */
export function getTelemetrySnapshot() {
  return {
    enabled,
    spans: getSpanNames().map(name => ({ name, ...getSpanStats(name) })),
    metrics: getMetricNames().map(name => ({ name, ...getMetrics(name) })),
    timestamp: Date.now(),
  };
}

export default {
  setTelemetryEnabled,
  isTelemetryEnabled,
  startSpan,
  endSpan,
  recordMetric,
  incrementCounter,
  getMetrics,
  getSpanStats,
  exportMetrics,
  clearMetrics,
  timeAsync,
  timeSync,
  ipcTelemetry,
  providerTelemetry,
  storeTelemetry,
  getTelemetrySnapshot,
};