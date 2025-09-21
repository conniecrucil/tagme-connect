import { Page } from '@playwright/test';

export interface StripeTestCard {
  number: string;
  expiry: string;
  cvc: string;
}

export interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

/**
 * Default test credit card information
 */
export const TEST_CREDIT_CARD: StripeTestCard = {
  number: '4242424242424242',
  expiry: '12/34',
  cvc: '123'
};

/**
 * Default shipping information for testing
 */
export const TEST_SHIPPING_INFO: ShippingInfo = {
  name: 'John Doe',
  address: '123 Test Street',
  city: 'Vancouver',
  province: 'BC',
  postalCode: 'V6B 1A1',
  country: 'CA'
};

/**
 * Fills out the complete Stripe checkout form including shipping and payment information
 * @param page - Playwright page object
 * @param shippingInfo - Shipping information (defaults to TEST_SHIPPING_INFO)
 * @param cardInfo - Credit card information (defaults to TEST_CREDIT_CARD)
 */
export async function fillStripeCheckoutForm(
  page: Page,
  shippingInfo: ShippingInfo = TEST_SHIPPING_INFO,
  cardInfo: StripeTestCard = TEST_CREDIT_CARD
): Promise<void> {
  // Wait for Stripe checkout to load
  await page.waitForLoadState('networkidle');

  // Fill in shipping information first
  await page.selectOption('select[id="shippingCountry"]', shippingInfo.country);
  await page.fill('input[id="shippingName"]', shippingInfo.name);

  // Click "Enter address manually"
  await page.click('button:has-text("Enter address manually")');

  // Fill in address details
  await page.fill('input[id="shippingAddressLine1"]', shippingInfo.address);
  await page.fill('input[id="shippingLocality"]', shippingInfo.city);
  await page.selectOption('select[id="shippingAdministrativeArea"]', shippingInfo.province);
  await page.fill('input[id="shippingPostalCode"]', shippingInfo.postalCode);

  // Fill in credit card details
  await page.fill('input[id="cardNumber"]', cardInfo.number);
  await page.fill('input[id="cardExpiry"]', cardInfo.expiry);
  await page.fill('input[id="cardCvc"]', cardInfo.cvc);
}

/**
 * Submits the Stripe checkout form
 * @param page - Playwright page object
 */
export async function submitStripePayment(page: Page): Promise<void> {
  const payButton = page.locator('button[data-testid="hosted-payment-submit-button"]');
  await payButton.waitFor({ state: 'visible' });
  await payButton.click();
}

/**
 * Complete Stripe checkout process
 * @param page - Playwright page object
 * @param shippingInfo - Shipping information (defaults to TEST_SHIPPING_INFO)
 * @param cardInfo - Credit card information (defaults to TEST_CREDIT_CARD)
 */
export async function completeStripeCheckout(
  page: Page,
  shippingInfo: ShippingInfo = TEST_SHIPPING_INFO,
  cardInfo: StripeTestCard = TEST_CREDIT_CARD
): Promise<void> {
  await fillStripeCheckoutForm(page, shippingInfo, cardInfo);
  await submitStripePayment(page);
}

/**
 * Waits for payment completion and checks result
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise<boolean> - true if payment succeeded, false if still on Stripe page
 */
export async function waitForPaymentCompletion(page: Page, timeout: number = 10000): Promise<boolean> {
  try {
    await page.waitForLoadState('networkidle', { timeout });

    const currentUrl = page.url();
    return !currentUrl.includes('checkout.stripe.com');
  } catch (error) {
    // If we timeout waiting for network idle, check if we're still on Stripe
    const currentUrl = page.url();
    return !currentUrl.includes('checkout.stripe.com');
  }
}
