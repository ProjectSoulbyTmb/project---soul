// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
// Boot smoke test (ERROR_PREVENTION_ROADMAP 2.2).
// Catches the 2026-08-21 class of failure: app exits at startup or renderer
// never renders while unit tests stay green. Requires NO special env vars -
// that is the point (plain `npm start` must work).
// Run: npm run test:e2e -- boot-smoke.spec.js   (tagged @smoke)
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test.describe('boot smoke', () => {
  let app;

  test.beforeEach(async () => {
    test.setTimeout(45_000);
    app = await electron.launch({
      args: ['.'],
      cwd: process.cwd(),
      env: { ...process.env }, // deliberately no EIDOVARA_AGE_GATE_ACCEPTED
    });
  });

  test.afterEach(async () => {
    await app?.close();
  });

  test('main process survives startup without exit(1)', async () => {
    const win = await app.firstWindow();
    expect(win).toBeTruthy();
  });

  test('renderer entry script parsed and UI mounted', async () => {
    const win = await app.firstWindow();
    // renderer.js defines the view map on load; if it failed to parse,
    // none of these mount points exist.
    await expect(win.locator('#chatView')).toBeVisible({ timeout: 15_000 });
  });

  test('no fatal errors in main-process console', async () => {
    const errors = [];
    app.process().stderr?.on('data', d => {
      const line = String(d);
      if (/Guard initialization failed|process\.exit|SyntaxError|ReferenceError/.test(line)) {
        errors.push(line);
      }
    });
    await app.firstWindow();
    await new Promise(r => setTimeout(r, 5_000));
    expect(errors).toEqual([]);
  });
});
