// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * THOTH manifest v2 - declarative contract for plugin-provided tools.
 *
 * A manifest declares WHAT a plugin needs; it can never grant itself runtime
 * capability. The broker in kernel.js stays the only authority, and external
 * tool code is loaded out of band (P2+), never by this module.
 */

import { CLASS_ORDER } from './kernel.js';

const ID_RE = /^[a-z][a-z0-9._-]{1,62}$/;

/**
 * Validate a THOTH manifest object.
 * @returns {{ok:boolean, errors:string[], manifest:object|null}}
 */
export function validateManifest(input) {
  const errors = [];
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
  if (!raw) return { ok: false, errors: ['manifest must be an object'], manifest: null };

  if (!ID_RE.test(String(raw.id || ''))) errors.push('id: lowercase slug required');
  if (!/^\d+\.\d+\.\d+$/.test(String(raw.version || '')))
    errors.push('version: semver required');

  const perms = Array.isArray(raw.permissions) ? raw.permissions : [];
  for (const p of perms) {
    if (!CLASS_ORDER.includes(p)) errors.push(`permissions: unknown class ${String(p).slice(0, 16)}`);
  }

  const tools = Array.isArray(raw.tools) ? raw.tools : [];
  if (!tools.length) errors.push('tools: at least one tool required');
  const seen = new Set();
  for (const t of tools) {
    const id = String(t?.id || '');
    if (!ID_RE.test(id)) errors.push(`tools: bad id ${id.slice(0, 24)}`);
    if (seen.has(id)) errors.push(`tools: duplicate id ${id}`);
    seen.add(id);
    if (!CLASS_ORDER.includes(t?.permissionClass))
      errors.push(`tools.${id}: permissionClass must be L0|L1|L2`);
    // Declared permissions must cover every tool class actually used.
    if (CLASS_ORDER.includes(t?.permissionClass) && !perms.includes(t.permissionClass))
      errors.push(`tools.${id}: class ${t.permissionClass} missing from manifest.permissions`);
    if (typeof t?.entry !== 'string' || !/^[a-z0-9_$]{1,64}$/.test(t.entry || ''))
      errors.push(`tools.${id}: entry export name required`);
  }

  const routines = Array.isArray(raw.routines) ? raw.routines : [];
  for (const r of routines) {
    if (!ID_RE.test(String(r?.id || ''))) errors.push('routines: bad id');
    if (!Array.isArray(r?.steps) || !r.steps.length || r.steps.length > 24)
      errors.push(`routines.${String(r?.id || '').slice(0, 16)}: steps must be 1..24`);
  }

  if (errors.length) return { ok: false, errors, manifest: null };

  return {
    ok: true,
    errors: [],
    manifest: {
      id: String(raw.id),
      version: String(raw.version),
      summary: String(raw.summary || '').slice(0, 280),
      permissions: perms.slice(),
      tools: tools.map((t) => ({
        id: String(t.id),
        title: String(t.title || t.id).slice(0, 80),
        permissionClass: t.permissionClass,
        entry: String(t.entry),
        intents: Array.isArray(t.intents)
          ? t.intents.map((s) => String(s).toLowerCase().trim()).filter(Boolean).slice(0, 8)
          : [],
      })),
      routines: routines.map((r) => ({ id: String(r.id), steps: r.steps.length })),
    },
  };
}
