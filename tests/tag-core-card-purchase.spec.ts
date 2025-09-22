import { test, expect } from '@playwright/test';
import { completeStripeCheckout, waitForPaymentCompletion } from './utils/stripe-helpers';

test.describe('TAG Core Card Purchase Workflow', () => {
  test('User can create TAG Core Card', async ({ page }) => {
    // Navigate directly to the TAG Core Card configure page
    await page.goto('/shop/tag-core-card/configure');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in basic information (minimum required for core card)
    await page.fill('input[id="fname"]', 'John');
    await page.fill('input[id="lname"]', 'Doe');
    await page.fill('input[id="email"]', 'connectme-customer@mailinator.com');
    await page.fill('input[id="phone"]', '555-123-4567');
    await page.fill('input[id="website"]', 'https://bancroft.io');
    
    // Click the "Add to Cart" button
    const addToCartButton = page.locator('button[type="submit"]').filter({ hasText: 'Add to Cart' });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    
    // Wait for redirect to cart page
    await page.waitForURL('**/cart**', { timeout: 10000 });
    
    // Proceed to checkout
    const checkoutButton = page.locator('button').filter({ hasText: 'Proceed to Checkout' });
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
    
    // Wait for checkout page to load
    await page.waitForURL('**/checkout**', { timeout: 10000 });
    
    // Fill in customer information on checkout page
    await page.fill('input[id="name"]', 'John Doe');
    await page.fill('input[id="email"]', 'connectme-customer@mailinator.com');
    await page.fill('input[id="phone"]', '555-123-4567');
    
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
    await expect(page.locator('text=https://bancroft.io')).toBeVisible();
    
    // Verify customer email is displayed
    await expect(page.locator('text=connectme-customer@mailinator.com')).toBeVisible();
    
    // Get the generated website URL from the confirmation page
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
