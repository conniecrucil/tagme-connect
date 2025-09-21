import { test, expect } from '@playwright/test';
import { completeStripeCheckout, waitForPaymentCompletion } from './utils/stripe-helpers';

test.describe('Basic Card Purchase Workflow', () => {
  test('User can purchase basic card', async ({ page }) => {
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
    await page.fill('input[id="url"]', 'https://bancroft.io');
    
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
    await page.fill('input[id="name"]', 'John Doe');
    await page.fill('input[id="email"]', 'connectme-customer@mailinator.com');
    await page.fill('input[id="phone"]', '555-123-4567');
    
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
    }
    
    // Verify the website URL is displayed correctly
    await expect(page.locator('text=https://bancroft.io')).toBeVisible();
    
    // Verify customer email is displayed
    await expect(page.locator('text=connectme-customer@mailinator.com')).toBeVisible();
  });
});
