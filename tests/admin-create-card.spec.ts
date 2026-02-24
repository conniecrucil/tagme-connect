import { test, expect } from '@playwright/test';
import { createTestIdentity, uploadGeneratedPngViaButton } from './utils/e2e-helpers';

test.describe('Admin Create TAG Core Card Workflow', () => {
  test('Admin can create TAG Core Card', async ({ page }) => {
    const identity = createTestIdentity('core');

    // Navigate to admin dashboard (authentication is bypassed in development)
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to create contact page
    await page.goto('/admin/create');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in basic information
    await page.fill('input[id="fname"]', identity.firstName);
    await page.fill('input[id="lname"]', identity.lastName);
    await page.fill('input[id="title"]', 'Software Engineer');
    await page.fill('input[id="biz"]', 'Test Company');
    await page.fill('input[id="email"]', identity.email);
    await page.fill('input[id="phone"]', identity.phone);
    await page.fill('input[id="website"]', identity.websiteUrl);
    await page.fill('textarea[id="desc"]', 'Experienced software engineer with a passion for creating innovative solutions.');
    
    // Upload generated images (no filesystem dependency)
    await uploadGeneratedPngViaButton(page, 'Upload Cover Photo', `admin-cover-${identity.suffix}.png`, 960, 640, '#2563eb');
    await expect(page.getByAltText('Cover image')).toBeVisible();
    await uploadGeneratedPngViaButton(page, 'Upload Photo', `admin-photo-${identity.suffix}.png`, 300, 300, '#ea580c');
    await expect(page.getByAltText('Photo')).toBeVisible();
    
    // Add social media actions
    const linkedinButton = page.locator('button').filter({ hasText: 'linkedin' });
    if (await linkedinButton.isVisible()) {
      await linkedinButton.click();
      // Fill in LinkedIn URL
      const linkedinInput = page.locator('input[placeholder*="linkedin"]').first();
      if (await linkedinInput.isVisible()) {
        await linkedinInput.fill('https://linkedin.com/in/johndoe');
      }
    }
    
    const twitterButton = page.locator('button').filter({ hasText: 'twitter' });
    if (await twitterButton.isVisible()) {
      await twitterButton.click();
      // Fill in Twitter URL
      const twitterInput = page.locator('input[placeholder*="twitter"]').first();
      if (await twitterInput.isVisible()) {
        await twitterInput.fill('https://twitter.com/johndoe');
      }
    }
    
    // Click the create button
    const createButton = page.getByRole('button', { name: 'Create Contact' });
    await expect(createButton).toBeVisible();
    const adminCreateResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin-create-contact') &&
        response.request().method() === 'POST',
      { timeout: 15000 },
    );
    await createButton.click();
    const adminCreateResponse = await adminCreateResponsePromise;
    expect(adminCreateResponse.ok()).toBeTruthy();
    
    // Wait for success page
    await page.waitForURL('**/admin/success**', { timeout: 30000 });
    
    // Verify we're on the success page
    await expect(page.getByRole('heading', { name: /contact created successfully/i })).toBeVisible();
    
    // Verify customer email is displayed
    await expect(page.locator(`text=${identity.email}`)).toBeVisible();
    
    // Get the generated website URL from the success page (Online Contact Page textbox)
    const onlineContactInput = page.locator('input[readonly]').first();
    await expect(onlineContactInput).toBeVisible();
    const websiteUrl = await onlineContactInput.inputValue();
    expect(websiteUrl).toContain('/storage/v1/');
    
    // Verify success page includes a vCard URL and download action
    const vcardUrlInput = page.locator('input[readonly]').nth(1);
    await expect(vcardUrlInput).toBeVisible();
    await expect(vcardUrlInput).toHaveValue(/contact\.vcf/);
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();
  });
});
