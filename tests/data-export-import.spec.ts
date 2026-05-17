import { test, expect, request as apiRequest } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BASE_URL = 'http://localhost:8888';

// ─── API-level helpers ───────────────────────────────────────────────────────

test.describe('Data Export/Import — API', () => {
  test('GET /export-data returns valid structure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    expect(response.status()).toBe(200);

    const body = await response.json();

    // Top-level shape
    expect(body).toHaveProperty('version', '1.0');
    expect(body).toHaveProperty('exported_at');
    expect(body).toHaveProperty('counts');
    expect(body).toHaveProperty('data');

    // counts shape
    const { counts } = body;
    expect(typeof counts.customers).toBe('number');
    expect(typeof counts.orders).toBe('number');
    expect(typeof counts.cards).toBe('number');
    expect(typeof counts.card_assets).toBe('number');
    expect(typeof counts.admin_users).toBe('number');

    // data arrays exist
    const { data } = body;
    expect(Array.isArray(data.customers)).toBe(true);
    expect(Array.isArray(data.orders)).toBe(true);
    expect(Array.isArray(data.cards)).toBe(true);
    expect(Array.isArray(data.card_assets)).toBe(true);
    expect(Array.isArray(data.admin_users_auth0)).toBe(true);

    // counts match array lengths
    expect(data.customers.length).toBe(counts.customers);
    expect(data.orders.length).toBe(counts.orders);
    expect(data.cards.length).toBe(counts.cards);
    expect(data.card_assets.length).toBe(counts.card_assets);
    expect(data.admin_users_auth0.length).toBe(counts.admin_users);
  });

  test('POST /import-data rejects missing body', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/.netlify/functions/import-data`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('Full round-trip: export then re-import (upsert mode preserves data)', async ({ request }) => {
    // Step 1: export
    const exportResponse = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    expect(exportResponse.status()).toBe(200);
    const exportedData = await exportResponse.json();

    const initialCounts = exportedData.counts;

    // Step 2: import the same data back (upsert — should be idempotent)
    const importResponse = await request.post(
      `${BASE_URL}/.netlify/functions/import-data?mode=upsert`,
      {
        data: exportedData,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(importResponse.status()).toBe(200);

    const importResult = await importResponse.json();
    expect(importResult.success).toBe(true);
    expect(importResult.mode).toBe('upsert');
    expect(importResult).toHaveProperty('imported_at');
    expect(importResult).toHaveProperty('counts');

    // Step 3: export again and verify counts are unchanged
    const reExportResponse = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    expect(reExportResponse.status()).toBe(200);
    const reExportedData = await reExportResponse.json();

    expect(reExportedData.counts.customers).toBe(initialCounts.customers);
    expect(reExportedData.counts.orders).toBe(initialCounts.orders);
    expect(reExportedData.counts.cards).toBe(initialCounts.cards);
    expect(reExportedData.counts.card_assets).toBe(initialCounts.card_assets);
    expect(reExportedData.counts.admin_users).toBe(initialCounts.admin_users);
  });

  test('Exported customer records have required fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    const { data } = await response.json();

    for (const customer of data.customers) {
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('created_at');
      expect(customer).toHaveProperty('updated_at');
    }
  });

  test('Exported order records have required fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    const { data } = await response.json();

    for (const order of data.orders) {
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('stripe_session_id');
      expect(order).toHaveProperty('customer_info');
      expect(order).toHaveProperty('cart_data');
      expect(order).toHaveProperty('status');
    }
  });

  test('Exported card records have required fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/.netlify/functions/export-data`);
    const { data } = await response.json();

    for (const card of data.cards) {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('uuid');
      expect(card).toHaveProperty('card_type');
      expect(card).toHaveProperty('card_data');
    }
  });
});

// ─── UI-level tests ──────────────────────────────────────────────────────────

test.describe('Data Management — Admin UI', () => {
  test('Page loads with export and import sections', async ({ page }) => {
    await page.goto('/admin/data-management');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Data Management');
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-file-input"]')).toBeVisible();
  });

  test('Export button triggers download and shows success message', async ({ page }) => {
    await page.goto('/admin/data-management');
    await page.waitForLoadState('networkidle');

    // Intercept the download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-button"]').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^tagme-export-.+\.json$/);

    // Save to temp and verify it's valid JSON with the expected structure
    const tmpPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(tmpPath);

    const content = fs.readFileSync(tmpPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty('version', '1.0');
    expect(parsed).toHaveProperty('data');
    expect(parsed).toHaveProperty('counts');

    fs.unlinkSync(tmpPath);

    // Success message should appear
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('Import with a valid export file shows success message', async ({ page }) => {
    // First, fetch the export via API and write it to a temp file
    const ctx = await apiRequest.newContext({ baseURL: BASE_URL });
    const exportResponse = await ctx.get('/.netlify/functions/export-data');
    const exportData = await exportResponse.json();
    await ctx.dispose();

    const tmpFile = path.join(os.tmpdir(), `tagme-test-import-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(exportData));

    await page.goto('/admin/data-management');
    await page.waitForLoadState('networkidle');

    // Upload the file
    await page.locator('[data-testid="import-file-input"]').setInputFiles(tmpFile);

    // Submit
    await page.locator('[data-testid="import-button"]').click();

    // Wait for success
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible({ timeout: 30_000 });

    fs.unlinkSync(tmpFile);
  });

  test('Import with invalid JSON shows error message', async ({ page }) => {
    const tmpFile = path.join(os.tmpdir(), `tagme-bad-import-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, 'this is not json { }}}');

    await page.goto('/admin/data-management');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="import-file-input"]').setInputFiles(tmpFile);
    await page.locator('[data-testid="import-button"]').click();

    await expect(page.locator('[data-testid="import-error"]')).toBeVisible({ timeout: 10_000 });

    fs.unlinkSync(tmpFile);
  });

  test('Data management link appears in admin sidebar', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const link = page.locator('a[href="/admin/data-management"]');
    await expect(link).toBeVisible();
  });
});
