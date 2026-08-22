// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH SYSTEM AUDITOR.
 *
 * Read-only probes over repository health. Every audit returns structured
 * findings; nothing here mutates a file. Repairs live in repair.js behind
 * explicit operator authorization.
 *
 * Audits are pure-ish: they read files under `root` (default: repo root) and
 * never write. Findings carry machine-readable ids so repair.js can bind.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');

const JS_EXT = /\.(js|cjs|mjs)$/;
const SCAN_DIRS = ['src', 'scripts', 'tests'];

function readFileSafe(p) {
  try {
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

function walkJsFiles(root, relDir, out = []) {
  const abs = path.join(root, relDir);
  let entries;
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const rel = path.join(relDir, e.name);
    if (e.isDirectory()) walkJsFiles(root, rel, out);
    else if (JS_EXT.test(e.name)) out.push(rel);
  }
  return out;
}

/** Finding helper: severity ok|low|high */
const F = (id, title, severity, detail, extra = {}) => ({ id, title, severity, detail, ...extra });

export function auditGuardsPresent(root = DEFAULT_ROOT) {
  const idx = path.join(root, 'src', 'core', 'guards', 'index.js');
  const buf = readFileSafe(idx);
  if (!buf || !buf.includes('runAllStructuralGuards')) {
    return F('guards.present', 'Structural guards index intact', 'high',
      'src/core/guards/index.js missing or no longer exports runAllStructuralGuards.');
  }
  const needed = ['age-gate.js', 'license-guard.js', 'consciousness-guard.js', 'relicense-guard.js'];
  const missing = needed.filter(f => !readFileSafe(path.join(root, 'src', 'core', 'guards', f)));
  if (missing.length) {
    return F('guards.present', 'Guard modules present', 'high', `Missing guard files: ${missing.join(', ')}`);
  }
  return F('guards.present', 'Guard modules present', 'ok', 'All four structural guards and index export verified.');
}

export function auditSingleLockfile(root = DEFAULT_ROOT) {
  const pnpm = fs.existsSync(path.join(root, 'pnpm-lock.yaml'));
  const npm = fs.existsSync(path.join(root, 'package-lock.json'));
  if (pnpm && npm) {
    return F('lockfile.single', 'Exactly one lockfile', 'low',
      'Both pnpm-lock.yaml and package-lock.json present; npm lockfile must go.',
      { repairable: true, payload: { stray: 'package-lock.json' } });
  }
  if (!pnpm) {
    return F('lockfile.single', 'Canonical lockfile present', 'high', 'pnpm-lock.yaml missing entirely.');
  }
  return F('lockfile.single', 'Exactly one lockfile', 'ok', 'Only pnpm-lock.yaml present.');
}

export function auditBomFree(root = DEFAULT_ROOT) {
  const tainted = [];
  for (const rel of SCAN_DIRS.flatMap(d => walkJsFiles(root, d))) {
    const buf = readFileSafe(path.join(root, rel));
    if (buf && buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) tainted.push(rel.split(path.sep).join('/'));
  }
  if (tainted.length) {
    return F('encoding.bom', 'UTF-8 BOM-free sources', 'low',
      `${tainted.length} file(s) start with a UTF-8 BOM.`,
      { repairable: true, payload: { files: tainted } });
  }
  return F('encoding.bom', 'UTF-8 BOM-free sources', 'ok', `No BOMs in ${SCAN_DIRS.join(', ')}/.`);
}

function extractShas(text) {
  return [...new Set((String(text).match(/[a-f0-9]{64}/gi) || []).map(s => s.toLowerCase()))];
}

export function auditReleaseMetadata(root = DEFAULT_ROOT) {
  const releaseSrc = readFileSafe(path.join(root, 'src', 'config', 'release-channel.js')) ||
    readFileSafe(path.join(root, 'src', 'core', 'release.js')) || '';
  const shas = new Set(extractShas(releaseSrc.toString('utf8')));
  const workersSrc = readFileSafe(path.join(root, 'server', 'worker.js'));
  if (workersSrc) extractShas(workersSrc.toString('utf8')).forEach(s => shas.add(s));
  const downloadHtml = readFileSafe(path.join(root, 'docs', 'download.html'));
  if (downloadHtml) extractShas(downloadHtml.toString('utf8')).forEach(s => shas.add(s));

  if (shas.size === 0) {
    return F('release.drift', 'Installer digest consistency', 'low', 'No installer SHA-256 references found to cross-check.');
  }
  if (shas.size > 1) {
    return F('release.drift', 'Installer digest consistency', 'high',
      `${shas.size} distinct installer digests across release config, Worker, and download page - metadata drift.`);
  }
  return F('release.drift', 'Installer digest consistency', 'ok', 'One consistent installer digest across all surfaces.');
}

export function auditKnowledgeVersionSync(root = DEFAULT_ROOT) {
  let pkgVersion = null;
  try {
    pkgVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  } catch {}
  const gen = readFileSafe(path.join(root, 'src', 'core', 'thoth-knowledge.js'));
  const m = gen && gen.toString('utf8').match(/THOTH_KNOWLEDGE_VERSION\s*=\s*"([^"]+)"/);
  const genVersion = m ? m[1] : null;
  if (!pkgVersion || !genVersion) {
    return F('knowledge.sync', 'Thoth knowledge version sync', 'low', 'Could not compare versions (file missing?).');
  }
  if (pkgVersion !== genVersion) {
    return F('knowledge.sync', 'Thoth knowledge version sync', 'low',
      `Generated knowledge says v${genVersion} but package.json is v${pkgVersion}. Regenerate the pack after releases.`,
      { repairable: true, payload: {} });
  }
  return F('knowledge.sync', 'Thoth knowledge version sync', 'ok', `Pack matches v${pkgVersion}.`);
}

export function runAllAudits(root = DEFAULT_ROOT) {
  const at = new Date().toISOString();
  const audits = [
    auditGuardsPresent,
    auditSingleLockfile,
    auditBomFree,
    auditReleaseMetadata,
    auditKnowledgeVersionSync,
  ];
  const findings = audits.map(fn => fn(root));
  return {
    at,
    findings,
    summary: {
      total: findings.length,
      ok: findings.filter(f => f.severity === 'ok').length,
      low: findings.filter(f => f.severity === 'low').length,
      high: findings.filter(f => f.severity === 'high').length,
      repairable: findings.filter(f => f.repairable).map(f => f.id),
    },
  };
}
