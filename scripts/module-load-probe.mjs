// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
/**
 * Import-graph probe: loads every first-party core module.
 * Catches broken imports / load-time crashes before they reach CI.
 */
import { pathToFileURL } from 'node:url';
const ROOT = pathToFileURL('./').href;
const modules = [
  'src/core/engine.js','src/core/kernel.js','src/core/schema.js','src/core/store.js',
  'src/core/telemetry.js','src/core/memory.js','src/core/modules.js','src/core/presence.js',
  'src/core/policy.js','src/core/relationship.js','src/core/growth.js','src/core/learning.js',
  'src/core/registry.js','src/core/layers.js','src/core/capabilities.js','src/core/workspace.js',
  'src/core/companion.js','src/core/entertainment.js','src/core/knowledge.js','src/core/voices.js',
  'src/core/guest-overlay.js','src/core/desktop-chrome.js','src/core/media-protocol.js',
  'src/core/now-playing.js','src/core/overlays.js','src/core/log-redact.js',
  'src/core/runtime-engines.js','src/core/service.js','src/core/soul-online.js',
  'src/core/updater.js','src/core/release.js','src/core/bounded-read.js',
  'src/core/guards/index.js','src/providers/offline.js','src/providers/http.js',
  'src/providers/internet.js','src/providers/context.js','src/config/release-channel.js',
];
let ok = 0;
let failed = 0;
for (const m of modules) {
  try { await import(ROOT + m); console.log("OK   " + m); ok++; }
  catch (e) { console.error("FAIL " + m + " :: " + String(e.message || e).slice(0, 120)); failed++; }
}
console.log(`modules loaded: ${ok} | failed: ${failed}`);
process.exit(failed ? 1 : 0);