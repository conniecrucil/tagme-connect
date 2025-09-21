import { test, expect } from '@playwright/test';

test.describe('Admin Modify Card Workflow', () => {
  test('Admin can modify existing card', async ({ page }) => {
    // First, create a card as admin (reuse the create workflow)
    await page.goto('/admin');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to create contact page
    await page.goto('/admin/create');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in initial basic information
    await page.fill('input[id="fname"]', 'John');
    await page.fill('input[id="lname"]', 'Doe');
    await page.fill('input[id="title"]', 'Software Engineer');
    await page.fill('input[id="biz"]', 'Test Company');
    await page.fill('input[id="email"]', 'connectme-customer@mailinator.com');
    await page.fill('input[id="phone"]', '555-123-4567');
    await page.fill('input[id="website"]', 'https://bancroft.io');
    await page.fill('textarea[id="desc"]', 'Initial bio text');
    
    // Upload placeholder images
    const imageInputs = page.locator('input[type="file"]');
    const imageCount = await imageInputs.count();
    
    for (let i = 0; i < imageCount; i++) {
      const input = imageInputs.nth(i);
      await input.setInputFiles('/Users/brianbancroft/programming/side-hustle/connie/smartvcard/netlify-poc/app/assets/300x300.png');
    }
    
    // Create the initial card
    const createButton = page.locator('button[type="submit"]');
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Wait for success page
    await page.waitForURL('**/admin/success**', { timeout: 30000 });
    
    // Get the generated website URL
    const websiteUrlElement = page.locator('text=https://bancroft.io').first();
    const websiteUrl = await websiteUrlElement.textContent();
    const uuidMatch = websiteUrl?.match(/demo\.bancroft\.io\/([a-f0-9-]+)/);
    
    if (uuidMatch) {
      const uuid = uuidMatch[1];
      
      // Navigate to the update page for this contact
      await page.goto(`/admin/update/${uuid}`);
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle');
      
      // Modify some attributes
      await page.fill('input[id="fname"]', 'Jane');
      await page.fill('input[id="lname"]', 'Smith');
      await page.fill('input[id="biz"]', 'Updated Company');
      await page.fill('input[id="title"]', 'Senior Software Engineer');
      await page.fill('textarea[id="desc"]', 'Updated bio with more experience and skills');
      
      // Upload different images
      const updateImageInputs = page.locator('input[type="file"]');
      const updateImageCount = await updateImageInputs.count();
      
      for (let i = 0; i < updateImageCount; i++) {
        const input = updateImageInputs.nth(i);
        await input.setInputFiles('/Users/brianbancroft/programming/side-hustle/connie/smartvcard/netlify-poc/app/assets/350x100.png');
      }
      
      // Submit the update
      const updateButton = page.locator('button[type="submit"]');
      await expect(updateButton).toBeVisible();
      await updateButton.click();
      
      // Wait for success page
      await page.waitForURL('**/admin/success**', { timeout: 30000 });
      
      // Verify we're on the success page
      await expect(page.locator('h1')).toContainText('Contact Updated Successfully');
      
      // Navigate to the updated website
      await page.goto(`https://demo.bancroft.io/${uuid}`);
      
      // Verify the website loads
      await page.waitForLoadState('networkidle');
      
      // Verify the changes are reflected
      await expect(page.locator('text=Jane Smith')).toBeVisible();
      await expect(page.locator('text=Updated Company')).toBeVisible();
      await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
      await expect(page.locator('text=Updated bio with more experience and skills')).toBeVisible();
      await expect(page.locator('text=New York, NY')).toBeVisible();
      
      // Verify social media links are updated
      const linkedinLink = page.locator('a[href*="linkedin.com/in/janesmith"]');
      await expect(linkedinLink).toBeVisible();
      
      const twitterLink = page.locator('a[href*="twitter.com/janesmith"]');
      await expect(twitterLink).toBeVisible();
      
      // Verify images are updated (check for different image sources)
      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
      
      // Verify vCard download still works
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
