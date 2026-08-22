// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

let app: Awaited<ReturnType<typeof electron.launch>>;
let page: Awaited<ReturnType<typeof app.firstWindow>>;

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      EIDOVARA_AGE_GATE_ACCEPTED: 'true',
      NODE_ENV: 'test',
    },
  });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  // Give the renderer time to mount its shell before assertions run.
  await page.waitForSelector('#main', { timeout: 30_000 }).catch(() => {});
});

test.afterAll(async () => {
  await app?.close();
});

test.describe('Eidovara shell', () => {
  test('window presents the Eidovara brand', async () => {
    const title = await page.title();
    assert.ok(/Eidovara/i.test(title), `unexpected title: ${title}`);
    const brand = page.locator('.brand').first();
    await expect(brand).toBeVisible({ timeout: 15_000 });
  });

  test('primary navigation renders workspace entries', async () => {
    for (const label of [
      'Dashboard',
      'Research',
      'Apps & Gaming',
      'Entertainment',
      'Memory',
      'Settings',
    ]) {
      await expect(
        page.locator(`.sidebar-footer .nav-btn`, { hasText: label }).first()
      ).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Soul dock exposes its composer', async () => {
    await expect(page.locator('#soulDock')).toBeVisible();
    await expect(page.locator('#companionInput')).toBeVisible();
    await expect(page.locator('#companionSendBtn')).toBeVisible();
  });
});

test.describe('accessibility @a11y', () => {
  test('no critical or serious axe-core violations on the shell', async () => {
    // Manual axe-core injection: works inside Electron where project-based
    // builders cannot resolve. axe-core ships alongside @axe-core/playwright.
    const axePath = path.resolve('node_modules/axe-core/axe.min.js');
    const axeSource = fs.readFileSync(axePath, 'utf8');
    await page.addScriptTag({ content: axeSource });

    const results = (await page.evaluate(async () => {
      // @ts-expect-error injected global
      return window.axe.run(document, { resultTypes: ['violations'] });
    })) as { violations: Array<{ id: string; impact: string | null; nodes: unknown[] }> };

    const blocking = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    const summary = blocking.map(v => `${v.id}(${v.nodes.length})`);
    expect(summary, `a11y violations: ${summary.join(', ')}`).toEqual([]);
  });
});
