import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';

test.describe('SANAD Portals e2e Smoke Test', () => {
  test('Citizen Portal Login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="text"]', 'citizen_demo');
    await page.fill('input[type="password"]', 'Citizen@2026');
    await page.click('button[type="submit"]');
    
    // Wait for URL to change to /citizen
    await page.waitForURL('**/citizen*');
    await expect(page.locator('text=Mohammed Al-Ghamdi').first()).toBeVisible({ timeout: 10000 });
  });

  test('Doctor Portal Login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="text"]', 'dr.rashidi');
    await page.fill('input[type="password"]', 'Doctor@2026');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/doctor*');
    await expect(page.locator('text=Dr. Khalid Al-Rashidi').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin Portal Login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="text"]', 'admin.saad');
    await page.fill('input[type="password"]', 'Admin@2026');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin*');
    await expect(page.locator('text=National Health Intelligence').first()).toBeVisible({ timeout: 10000 });
  });

  test('Supply Chain Portal Login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="text"]', 'supply.ibrahim');
    await page.fill('input[type="password"]', 'Supply@2026');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/supply-chain*');
    await expect(page.locator('text=Inventory Status').first()).toBeVisible({ timeout: 10000 });
  });
});
