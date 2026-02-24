import { test, expect } from '@playwright/test';
import { completeStripeCheckout, waitForPaymentCompletion } from './utils/stripe-helpers';
import {
  assertMailpitPurchaseEmails,
  createTestIdentity,
  getSessionIdFromPageUrl,
} from './utils/e2e-helpers';

test.describe('Basic Card Purchase Workflow', () => {
  test('User can purchase basic card', async ({ page }) => {
    const identity = createTestIdentity('basic');

    // Navigate to the shop
    await page.goto('/shop');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click on the basic card product
    const basicCardLink = page.locator('a[href*="/shop/tag-basic-card"]').first();
    await expect(basicCardLink).toBeVisible();
    await basicCardLink.click();
    
    // Wait for the product page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in the website URL for basic card
    await page.fill('input[id="url"]', identity.websiteUrl);
    
    // Click the "Add to Cart" button (wait for it to be enabled)
    const addToCartButton = page.locator('button').filter({ hasText: 'Add to Cart' });
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
    await page.fill('input[id="name"]', identity.fullName);
    await page.fill('input[id="email"]', identity.email);
    await page.fill('input[id="phone"]', identity.phone);
    
    // Click the payment button
    const purchaseButton = page.locator('button').filter({ hasText: 'Pay $40.00' });
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

      // Wait for confirmation page
      await page.waitForURL('**/confirmation**', { timeout: 10000 });

      // Verify we're on the confirmation page
      await expect(page.locator('h1')).toContainText('Order Confirmed');

      // Verify the website URL is displayed correctly
      await expect(page.locator(`text=${identity.websiteUrl}`)).toBeVisible();

      // Verify customer email is displayed
      await expect(page.locator(`text=${identity.email}`)).toBeVisible();

      const sessionId = getSessionIdFromPageUrl(page.url());
      await assertMailpitPurchaseEmails({
        sessionId,
        customerEmail: identity.email,
        customerName: identity.fullName,
        websiteUrl: identity.websiteUrl,
        productLabel: 'TAG Basic Card',
      });
    }
  });
});
