// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH GATED REPAIRS.
 *
 * Repairs are the only mutation path Thoth owns, and every gate must hold:
 *
 *   1. SESSION  - an active, unexpired operator session (admin-gate bound)
 *   2. SCOPE    - the exact finding id must appear in authorizedFindings,
 *                 a list the CALLER builds from the operator's own words;
 *                 conversation content can never mint entries here
 *   3. BOUND    - handlers touch only the paths their finding named
 *   4. PROOF    - the matching audit re-runs after repair; failure to
 *                 confirm is reported honestly, never papered over
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { auditBomFree, auditKnowledgeVersionSync, auditSingleLockfile } from './auditor.js';

const REPAIRABLE_DIRS = ['src', 'scripts', 'tests'];

function safeJoin(root, rel) {
  const abs = path.resolve(root, rel);
  const relNorm = path.relative(root, abs);
  if (relNorm.startsWith('..') || path.isAbsolute(relNorm)) return null;
  const top = relNorm.split(path.sep)[0];
  if (!REPAIRABLE_DIRS.includes(top)) return null;
  return abs;
}

const HANDLERS = {
  'encoding.bom': {
    title: 'Strip UTF-8 BOMs',
    run(root, payload = {}) {
      const changed = [];
      for (const rel of payload.files || []) {
        const abs = safeJoin(root, rel);
        if (!abs) continue;
        const buf = fs.readFileSync(abs);
        if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
          fs.writeFileSync(abs, buf.subarray(3));
          changed.push(rel.split(path.sep).join('/'));
        }
      }
      return { ok: true, changed, detail: `${changed.length} file(s) stripped.` };
    },
  },
  'lockfile.stray': {
    title: 'Remove stray npm lockfile',
    run(root) {
      const pnpm = path.join(root, 'pnpm-lock.yaml');
      const npm = path.join(root, 'package-lock.json');
      if (!fs.existsSync(pnpm)) return { ok: false, changed: [], detail: 'Refusing: no canonical pnpm-lock.yaml.' };
      if (!fs.existsSync(npm)) return { ok: true, changed: [], detail: 'Already clean.' };
      fs.unlinkSync(npm);
      return { ok: true, changed: ['package-lock.json'], detail: 'Stray npm lockfile removed.' };
    },
  },
  'knowledge.sync': {
    title: 'Regenerate Thoth knowledge pack',
    // Bounded, deterministic local tooling - same repo policy as scribe/probes.
    run(root) {
      execFileSync(process.execPath, [path.join('scripts', 'build-thoth-knowledge.js')], {
        cwd: root,
        stdio: 'pipe',
      });
      return { ok: true, changed: ['src/core/thoth-knowledge.js'], detail: 'Knowledge pack regenerated.' };
    },
  },
};

export const REPAIR_IDS = Object.freeze(Object.keys(HANDLERS));

function sessionValid(session, at) {
  if (!session || session.active !== true) return { ok: false, code: 'no-operator-session' };
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.parse(at)) return { ok: false, code: 'session-expired' };
  return { ok: true };
}

/**
 * Execute one gated repair.
 * @param {string} findingId e.g. "encoding.bom"
 * @param {object} opts { root, session, authorizedFindings:[findingId...], at?, payload? }
 */
export function executeRepair(findingId, { root, session, authorizedFindings = [], at, payload } = {}) {
  const stamp = at || new Date().toISOString();
  const handler = HANDLERS[findingId];
  const deny = (code, reason) => ({
    ok: false,
    code,
    reason,
    changed: [],
    audit: { at: stamp, type: `thoth.repair.deny`, details: { findingId, code } },
  });

  if (!handler) return deny('unknown-repair', 'No such repair exists in the catalog.');
  const sess = sessionValid(session, stamp);
  if (!sess.ok) return deny(sess.code, 'Valid operator session required.');
  if (!authorizedFindings.includes(findingId)) {
    return deny('not-authorized-for-finding',
      'This specific repair was not named by the operator command.');
  }

  let outcome;
  try {
    outcome = handler.run(root, payload);
  } catch (error) {
    outcome = { ok: false, changed: [], detail: String(error?.message || error).slice(0, 160) };
  }

  let confirmed = null;
  try {
    if (findingId === 'encoding.bom') confirmed = auditBomFree(root);
    else if (findingId === 'lockfile.stray') confirmed = auditSingleLockfile(root);
    else if (findingId === 'knowledge.sync') confirmed = auditKnowledgeVersionSync(root);
  } catch {}

  const audit = {
    at: stamp,
    type: 'thoth.repair.allow',
    details: {
      findingId,
      changed: outcome.changed || [],
      detail: outcome.detail || '',
      reconfirmed: confirmed ? confirmed.severity === 'ok' : null,
    },
  };
  return { ok: outcome.ok !== false, code: 'ok', changed: outcome.changed || [], detail: outcome.detail || '', confirmed, audit };
}

export function describeRepairs() {
  return REPAIR_IDS.map(id => `${id} (${HANDLERS[id].title})`).join(', ');
}
