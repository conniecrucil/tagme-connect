import { test, expect } from '@playwright/test';

test.describe('Admin Create TAG Core Card Workflow', () => {
  test('Admin can create TAG Core Card', async ({ page }) => {
    // Navigate to admin dashboard (authentication is bypassed in development)
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to create contact page
    await page.goto('/admin/create');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in basic information
    await page.fill('input[id="fname"]', 'John');
    await page.fill('input[id="lname"]', 'Doe');
    await page.fill('input[id="title"]', 'Software Engineer');
    await page.fill('input[id="biz"]', 'Test Company');
    await page.fill('input[id="email"]', 'connectme-customer@mailinator.com');
    await page.fill('input[id="phone"]', '555-123-4567');
    await page.fill('input[id="website"]', 'https://bancroft.io');
    await page.fill('textarea[id="desc"]', 'Experienced software engineer with a passion for creating innovative solutions.');
    
    // Upload placeholder images from app/assets
    const imageInputs = page.locator('input[type="file"]');
    const imageCount = await imageInputs.count();
    
    for (let i = 0; i < imageCount; i++) {
      const input = imageInputs.nth(i);
      await input.setInputFiles('/Users/brianbancroft/programming/side-hustle/connie/smartvcard/netlify-poc/app/assets/300x300.png');
    }
    
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
    const createButton = page.locator('button[type="submit"]');
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Wait for success page
    await page.waitForURL('**/admin/success**', { timeout: 30000 });
    
    // Verify we're on the success page
    await expect(page.locator('h1')).toContainText('Contact Created Successfully');
    
    // Verify the website URL is displayed correctly
    await expect(page.locator('text=https://bancroft.io')).toBeVisible();
    
    // Verify customer email is displayed
    await expect(page.locator('text=connectme-customer@mailinator.com')).toBeVisible();
    
    // Get the generated website URL from the success page
    const websiteUrlElement = page.locator('text=https://bancroft.io').first();
    const websiteUrl = await websiteUrlElement.textContent();
    
    // Extract UUID from the URL if it's a generated URL
    const uuidMatch = websiteUrl?.match(/demo\.bancroft\.io\/([a-f0-9-]+)/);
    if (uuidMatch) {
      const uuid = uuidMatch[1];
      
      // Navigate to the generated website
      await page.goto(`https://demo.bancroft.io/${uuid}`);
      
      // Verify the website loads
      await page.waitForLoadState('networkidle');
      
      // Verify images are displayed
      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
      
      // Verify vCard download link exists
      const vcardLink = page.locator('a[href*=".vcf"]');
      await expect(vcardLink).toBeVisible();
      
      // Test vCard download
      const downloadPromise = page.waitForEvent('download');
      await vcardLink.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.vcf$/);
    }
  });
});
