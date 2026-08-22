// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { test, expect, _electron as electron, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

let app: Awaited<ReturnType<typeof electron.launch>>;
let page: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      EIDOVARA_AGE_GATE_ACCEPTED: 'true',
      NODE_ENV: 'test',
    } as Record<string, string>,
  });
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app?.close();
});

test.describe('Eidovara shell', () => {
  test('window presents the Eidovara brand', async () => {
    await expect(page.locator('.brand')).toContainText('Eidovara');
  });

  test('primary navigation renders all workspace entries', async () => {
    for (const label of ['Dashboard', 'Research', 'Apps & Gaming', 'Entertainment', 'Memory', 'Settings']) {
      await expect(page.locator(`.sidebar-footer .nav-btn:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('Soul dock exposes its composer', async () => {
    await expect(page.locator('#soulDock')).toBeVisible();
    await expect(page.locator('#companionInput')).toBeVisible();
    await expect(page.locator('#companionSendBtn')).toBeVisible();
  });

  test('command palette shortcut button is reachable', async () => {
    await expect(page.locator('#paletteBtn')).toBeVisible();
  });

  test('accessibility scan reports no critical or serious violations @a11y', async () => {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    const summary = blocking.map((v) => `${v.id}(${v.nodes.length})`);
    assert.equal(summary.length, 0, `a11y violations: ${summary.join(', ')}`);
  });
});
