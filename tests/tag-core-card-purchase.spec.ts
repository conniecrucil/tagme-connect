import { test, expect } from '@playwright/test';
import { completeStripeCheckout, waitForPaymentCompletion } from './utils/stripe-helpers';
import {
  assertMailpitPurchaseEmails,
  assertMinioObjectsExist,
  createTestIdentity,
  getSessionIdFromPageUrl,
  uploadGeneratedPngViaButton,
  waitForCoreCardArtifactsByEmail,
} from './utils/e2e-helpers';

test.describe('TAG Core Card Purchase Workflow', () => {
  test('User can create TAG Core Card', async ({ page }) => {
    const identity = createTestIdentity('core');
    const testStartMs = Date.now();

    // Navigate directly to the TAG Core Card configure page
    await page.goto('/shop/tag-core-card/configure');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in basic information (minimum required for core card)
    await page.fill('input[id="fname"]', identity.firstName);
    await page.fill('input[id="lname"]', identity.lastName);
    await page.fill('input[id="email"]', identity.email);
    await page.fill('input[id="phone"]', identity.phone);
    await page.fill('input[id="website"]', identity.websiteUrl);

    // Upload generated images sized to the UI recommendations.
    await uploadGeneratedPngViaButton(page, 'Upload Header Image', `cover-${identity.suffix}.png`, 960, 640, '#0ea5e9');
    await expect(page.getByAltText('Cover image')).toBeVisible();
    await uploadGeneratedPngViaButton(page, 'Upload Card Design', `card-design-${identity.suffix}.png`, 1050, 600, '#16a34a');
    await expect(page.getByAltText('Card design preview')).toBeVisible();
    await uploadGeneratedPngViaButton(page, 'Upload Photo', `photo-${identity.suffix}.png`, 300, 300, '#f97316');
    await expect(page.getByAltText('Photo')).toBeVisible();
    
    // Click the "Add to Cart" button
    const addToCartButton = page.locator('button[type="submit"]').filter({ hasText: 'Add to Cart' });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Wait for redirect to cart page
    await page.waitForURL('**/cart**', { timeout: 20000 });
    
    // Proceed to checkout
    const checkoutButton = page.locator('button').filter({ hasText: 'Proceed to Checkout' });
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
    
    // Wait for checkout page to load
    await page.waitForURL('**/checkout**', { timeout: 10000 });
    
    // Fill in customer information on checkout page
    await page.fill('input[id="name"]', identity.fullName);
    await page.fill('input[id="email"]', identity.email);
    await page.fill('input[id="phone"]', identity.phone);
    
    // Click the payment button
    const purchaseButton = page.locator('button').filter({ hasText: 'Pay $47.00' });
    await expect(purchaseButton).toBeVisible();
    await purchaseButton.click();
    
    // Complete the Stripe checkout process
    await completeStripeCheckout(page);

    // Wait for payment processing to complete
    const paymentSuccess = await waitForPaymentCompletion(page);

    if (!paymentSuccess) {
      // Payment failed, check for error message
      const errorMessage = page.locator('.Error').or(page.locator('[role="alert"]'));
      await expect(errorMessage).toBeVisible();
      console.log('Payment failed - check Stripe error messages');
    } else {
      // Payment succeeded, we're back on the site
      console.log('Payment processing completed - back on site');
    }
    
    // Wait for payment processing and redirect
    await page.waitForURL('**/confirmation**', { timeout: 30000 });
    
    // Verify we're on the confirmation page
    await expect(page.locator('h1')).toContainText('Order Confirmed');
    
    // Verify the website URL is displayed correctly
    await expect(page.locator(`text=${identity.websiteUrl}`)).toBeVisible();
    
    // Verify customer email is displayed
    await expect(page.locator(`text=${identity.email}`)).toBeVisible();

    const sessionId = getSessionIdFromPageUrl(page.url());
    const emailAssertions = await assertMailpitPurchaseEmails({
      sessionId,
      customerEmail: identity.email,
      customerName: identity.fullName,
      websiteUrl: identity.websiteUrl,
      productLabel: 'TAG Core Card',
      requireWebsiteInAdminBody: false,
    });
    expect(emailAssertions.adminBody).toContain('download zip');

    const artifacts = await waitForCoreCardArtifactsByEmail(identity.email, testStartMs, ['cover', 'photo']);
    const requiredKeys = artifacts.assets
      .filter((asset) => ['html', 'vcf', 'cover', 'photo'].includes(asset.asset_type))
      .map((asset) => asset.s3_key);
    const zipKeyMatch = emailAssertions.adminBody.match(/user-logos\/[a-f0-9-]+\.zip/);
    if (zipKeyMatch) {
      requiredKeys.push(zipKeyMatch[0]);
    }
    await assertMinioObjectsExist(requiredKeys);
    
    // Get the generated website URL from the confirmation page
    const websiteUrlElement = page.locator(`text=${identity.websiteUrl}`).first();
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
