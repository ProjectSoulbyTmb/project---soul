// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH graduate program: software + network engineering tools.
 *
 * Software tier (L0): pure static analysis over caller-supplied source text -
 * deterministic heuristics, no filesystem, no execution of the analyzed code.
 *
 * Network tier (L1): tightly fenced diagnostics. HTTPS-only for HTTP probes,
 * hostname-shaped inputs for DNS, hard timeouts, and bodies are never returned
 * (only byte counts). All calls still pass the deny-by-default broker.
 *
 * Network handlers receive ctx.services so tests inject fakes and stay
 * fully offline; production wiring supplies node:dns + global fetch.
 */

const SMELL_PATTERNS = [
  ['dynamic-eval', /\beval\s*\(/],
  ['dynamic-function', /\bnew\s+Function\s*\(/],
  ['raw-html-sink', /\.innerHTML\s*=/],
  ['shell-string', /\.(exec|execSync)\s*\(\s*[`'"][^'"`]*\$\{/],
  ['broad-catch', /catch\s*\(\s*\)\s*\{\s*\}/],
];

function countFunctions(src) {
  return (
    (src.match(/function\s+[A-Za-z_$][\w$]*/g) || []).length +
    (src.match(/(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/g) || []).length +
    (src.match(/\b(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/g) || []).length
  );
}

/** L0 - deterministic static snapshot of a source string. */
export function codeMetricsHandler(args) {
  const src = String(args?.source ?? args?._rest ?? '');
  if (!src.trim()) return { ok: false, error: 'empty-source' };
  if (src.length > 200_000) return { ok: false, error: 'source-too-large' };

  const lines = src.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const commentLines = lines.filter((l) => /^\s*(\/\/|\/\*|\*)/.test(l)).length;
  let depth = 0;
  let maxDepth = 0;
  for (const ch of src) {
    if (ch === '{') {
      depth += 1;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === '}') depth = Math.max(0, depth - 1);
  }
  const smells = SMELL_PATTERNS.filter(([, re]) => re.test(src)).map(([name]) => name);
  const todos = (src.match(/\b(TODO|FIXME|HACK)\b/g) || []).length;

  return {
    ok: true,
    data: {
      lines: lines.length,
      sloc: nonEmpty.length,
      commentLines,
      commentRatio: Number((commentLines / Math.max(1, nonEmpty.length)).toFixed(3)),
      maxLineLength: Math.max(...lines.map((l) => l.length), 0),
      functions: countFunctions(src),
      maxBraceDepth: maxDepth,
      todosFixmes: todos,
      smells,
      note: 'heuristic metrics - not a parser-grade analysis',
    },
  };
}

/* --------------------------- network tier (L1) --------------------------- */

const HOSTNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export function makeDnsLookupHandler(services) {
  return async (args) => {
    const host = String(args?.host ?? args?._rest ?? '').trim().slice(0, 253);
    if (!HOSTNAME_RE.test(host)) return { ok: false, error: 'invalid-hostname' };
    const started = Date.now();
    const [a, aaaa, cname] = await Promise.allSettled([
      services.resolve4(host),
      services.resolve6(host),
      services.resolveCname(host),
    ]);
    const pick = (r) => (r.status === 'fulfilled' ? r.value : null);
    const records = { A: pick(a), AAAA: pick(aaaa), CNAME: pick(cname) };
    if (!records.A && !records.AAAA && !records.CNAME)
      return { ok: false, error: 'no-records', host };
    return {
      ok: true,
      data: { host, records, resolvedInMs: Date.now() - started },
    };
  };
}

export function makeHttpProbeHandler(services) {
  return async (args) => {
    const raw = String(args?.url ?? args?._rest ?? '').trim().slice(0, 500);
    let url;
    try {
      url = new URL(raw);
    } catch {
      return { ok: false, error: 'invalid-url' };
    }
    // House rule mirrors httpsOnlyUrl: HTTPS everywhere, credentials never.
    if (url.protocol !== 'https:') return { ok: false, error: 'https-required' };
    if (url.username || url.password) return { ok: false, error: 'credentials-not-allowed' };

    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4_000);
    try {
      const res = await services.fetch(url.toString(), {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
        headers: { accept: 'application/json, text/html;q=0.8, */*;q=0.1' },
      });
      // Drain a bounded slice so sockets close; never surface body content.
      let bytes = 0;
      try {
        const reader = res.body?.getReader?.();
        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > 65_536) break;
          }
          await reader.cancel?.();
        }
      } catch {
        /* body drain best-effort */
      }
      return {
        ok: true,
        data: {
          url: url.toString(),
          status: res.status,
          okStatus: res.ok === true,
          contentType: String(res.headers.get('content-type') || '').slice(0, 80),
          server: String(res.headers.get('server') || '').slice(0, 60),
          bytesSeen: bytes,
          probedInMs: Date.now() - startedAt,
          redirected: false, // redirect:'error' means we never follow
        },
      };
    } catch (err) {
      const aborted = err?.name === 'AbortError';
      return { ok: false, error: aborted ? 'timeout' : 'unreachable' };
    } finally {
      clearTimeout(timer);
    }
  };
}

/* Real-network wiring used in production (tests inject fakes instead).
 * DNS loads lazily and memoized: a failed load (sandboxed renderer) resolves
 * to null and handlers report an error instead of crashing the host. */
let dnsPromise;
function loadDns() {
  if (!dnsPromise) dnsPromise = import('node:dns/promises').catch(() => null);
  return dnsPromise;
}

async function withDns(run) {
  const dns = await loadDns();
  if (!dns) throw Object.assign(new Error('no-dns'), { code: 'NO_DNS' });
  return run({
    resolve4: (h) => dns.resolve4(h),
    resolve6: (h) => dns.resolve6(h),
    resolveCname: (h) => dns.resolveCname(h),
  });
}

export const defaultNetworkServices = {
  resolve4: (h) => withDns((d) => d.resolve4(h)),
  resolve6: (h) => withDns((d) => d.resolve6(h)),
  resolveCname: (h) => withDns((d) => d.resolveCname(h)),
  fetch: (...a) => globalThis.fetch(...a),
};

export const SOFTWARE_TOOLS = [
  {
    id: 'code.metrics',
    title: 'Static code metrics',
    summary: 'Heuristic size/complexity/smell snapshot of supplied source text.',
    permissionClass: 'L0',
    intents: ['metrics', 'smells'],
    handler: codeMetricsHandler,
  },
  {
    id: 'net.dns',
    title: 'DNS lookup',
    summary: 'Resolves A/AAAA/CNAME for a hostname. Network egress, L1 gated.',
    permissionClass: 'L1',
    intents: ['dns'],
    handler: makeDnsLookupHandler(defaultNetworkServices),
  },
  {
    id: 'net.http-probe',
    title: 'HTTPS health probe',
    summary: 'HTTPS-only GET that reports status, timing, and byte counts - never body content.',
    permissionClass: 'L1',
    intents: ['http', 'probe'],
    handler: makeHttpProbeHandler(defaultNetworkServices),
  },
];
