import { test, expect } from '@playwright/test';

test.describe('Admin Modify Card Workflow', () => {
  test('Admin can modify existing card', async ({ page }) => {
    // Seeded core card from supabase/seed.sql
    const seededCardId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const updatedFirst = 'Jane';
    const updatedLast = `Smith${suffix.slice(-4)}`;
    const updatedName = `${updatedFirst} ${updatedLast}`;
    const updatedCompany = `Updated Company ${suffix.slice(-4)}`;
    const updatedTitle = 'Senior Software Engineer';
    const updatedDesc = `Updated bio ${suffix}`;
    const updatedWebsite = `https://example.com/admin-edit-${suffix}`;

    await page.goto(`/admin/cards/${seededCardId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /admin contact editor/i })).toBeVisible();

    await page.fill('input[id="fname"]', updatedFirst);
    await page.fill('input[id="lname"]', updatedLast);
    await page.fill('input[id="biz"]', updatedCompany);
    await page.fill('input[id="title"]', updatedTitle);
    await page.fill('input[id="website"]', updatedWebsite);
    await page.fill('textarea[id="desc"]', updatedDesc);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/update-contact-data') &&
        response.request().method() === 'POST',
      { timeout: 15000 },
    );

    await page.getByRole('button', { name: 'Update Contact' }).click();

    const updateResponse = await updateResponsePromise;
    expect(updateResponse.ok()).toBeTruthy();

    await page.waitForURL(`**/admin/cards/${seededCardId}`, { timeout: 30000 });

    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
    await expect(page.locator(`text=${updatedCompany}`)).toBeVisible();
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
    await expect(page.getByText(updatedDesc, { exact: true }).last()).toBeVisible();
    await expect(page.locator(`a[href="${updatedWebsite}"]`)).toBeVisible();
  });
});
