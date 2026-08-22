// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { _electron as electron } from '@playwright/test';

let electronApp: Awaited<ReturnType<typeof electron.launch>>;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    executablePath: require('electron'),
    args: ['.', '--no-sandbox', '--disable-gpu'],
    env: {
      EIDOVARA_AGE_GATE_ACCEPTED: 'true',
      NODE_ENV: 'test',
    },
  });
});

test.afterAll(async () => {
  await electronApp?.close();
});

test.describe('Eidovara Core User Flows', () => {
  let page: Awaited<ReturnType<typeof electronApp.firstWindow>>;

  test.beforeEach(async () => {
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await injectAxe(page);
  });

  test('Age gate appears and can be accepted', async () => {
    // Check age gate modal is present
    await expect(page.locator('#eidovara-age-gate-modal, [data-testid="age-gate"]')).toBeVisible({ timeout: 15000 });
    
    // Accept age gate
    await page.click('button:has-text("I confirm I am 18+")');
    
    // Verify dashboard loads
    await expect(page.locator('text=Your Eidovara workspace')).toBeVisible({ timeout: 10000 });
  });

  test('Dashboard loads with all navigation elements', async () => {
    // Accept age gate if needed
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    // Check main navigation
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Research')).toBeVisible();
    await expect(page.locator('text=Apps & Gaming')).toBeVisible();
    await expect(page.locator('text=Entertainment')).toBeVisible();
    await expect(page.locator('text=Memory')).toBeVisible();
    await expect(page.locator('text=Identity')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('Soul companion dock is present and functional', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    // Check companion dock
    await expect(page.locator('#soulDock, [data-testid="soul-dock"]')).toBeVisible();
    await expect(page.locator('text=Soul companion')).toBeVisible();
    await expect(page.locator('#companionInput')).toBeVisible();
    await expect(page.locator('#companionSendBtn')).toBeVisible();
  });

  test('Settings page accessible and has all sections', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    // Navigate to settings
    await page.click('text=Settings');
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Check settings sections
    await expect(page.locator('text=Models, language')).toBeVisible();
    await expect(page.locator('text=Voices')).toBeVisible();
    await expect(page.locator('text=Modules')).toBeVisible();
    await expect(page.locator('text=Behavior')).toBeVisible();
    await expect(page.locator('text=Updates')).toBeVisible();
    await expect(page.locator('text=Backups')).toBeVisible();
    await expect(page.locator('text=Desktop')).toBeVisible();
  });

  test('Apps & Gaming page loads with discover button', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await page.click('text=Apps & Gaming');
    await expect(page.locator('text=Apps & Gaming Hub')).toBeVisible();
    await expect(page.locator('text=Discover installed apps')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('Entertainment page loads with mood mix button', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await page.click('text=Entertainment');
    await expect(page.locator('text=Entertainment')).toBeVisible();
    await expect(page.locator('text=Mood mix')).toBeVisible();
    await expect(page.locator('text=From favorites')).toBeVisible();
  });

  test('Memory page accessible', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await page.click('text=Memory');
    await expect(page.locator('text=Memory')).toBeVisible();
    await expect(page.locator('text=Add something Soul should remember')).toBeVisible();
  });

  test('Research page loads with query input', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await page.click('text=Research');
    await expect(page.locator('text=Research')).toBeVisible();
    await expect(page.locator('#researchQuery')).toBeVisible();
    await expect(page.locator('text=Look up')).toBeVisible();
  });

  test('Identity page shows protected identity section', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await page.click('text=Identity');
    await expect(page.locator('text=Identity & continuity')).toBeVisible();
    await expect(page.locator('text=Protected identity')).toBeVisible();
    await expect(page.locator('text=Adaptive personality')).toBeVisible();
  });

  test('Command palette opens with Ctrl+K', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    // Press Ctrl+K
    await page.keyboard.press('Control+K');
    
    // Check palette opens (implementation dependent)
    await expect(page.locator('[data-testid="command-palette"], .palette-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('Accessibility: no critical violations on main pages', async () => {
    const ageGate = page.locator('button:has-text("I confirm I am 18+")');
    if (await ageGate.isVisible({ timeout: 2000 })) {
      await ageGate.click();
    }
    
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      includedImpacts: ['critical', 'serious'],
    });
  });
});