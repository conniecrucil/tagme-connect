# Test Utilities

This directory contains shared utilities and helpers for Playwright tests.

## Stripe Helpers (`stripe-helpers.ts`)

A collection of utilities for handling Stripe checkout forms in tests.

### Usage

```typescript
import { completeStripeCheckout, TEST_CREDIT_CARD, TEST_SHIPPING_INFO } from './utils/stripe-helpers';

test('My test with Stripe payment', async ({ page }) => {
  // Navigate to checkout...

  // Complete the entire Stripe checkout process
  await completeStripeCheckout(page);

  // Or use custom data
  await completeStripeCheckout(page, customShippingInfo, customCardInfo);
});
```

### Available Functions

#### `completeStripeCheckout(page, shippingInfo?, cardInfo?)`
Fills out and submits the complete Stripe checkout form.

**Parameters:**
- `page` (Page): Playwright page object
- `shippingInfo` (optional): Shipping information object
- `cardInfo` (optional): Credit card information object

**Default Values:**
- Uses `TEST_SHIPPING_INFO` and `TEST_CREDIT_CARD` if not provided

#### `fillStripeCheckoutForm(page, shippingInfo?, cardInfo?)`
Fills out the Stripe checkout form without submitting.

#### `submitStripePayment(page)`
Submits the Stripe payment form.

#### `waitForPaymentCompletion(page, timeout?)`
Waits for payment processing to complete and returns success status.

**Returns:** `Promise<boolean>` - `true` if payment succeeded, `false` if still on Stripe page

### Test Data Constants

#### `TEST_CREDIT_CARD`
```typescript
{
  number: '4242424242424242',  // Stripe test card
  expiry: '12/34',
  cvc: '123'
}
```

#### `TEST_SHIPPING_INFO`
```typescript
{
  name: 'John Doe',
  address: '123 Test Street',
  city: 'Vancouver',
  province: 'BC',
  postalCode: 'V6B 1A1',
  country: 'CA'
}
```

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { completeStripeCheckout, waitForPaymentCompletion } from './utils/stripe-helpers';

test('Purchase flow with Stripe', async ({ page }) => {
  // ... navigate to checkout and fill product details ...

  // Complete Stripe checkout
  await completeStripeCheckout(page);

  // Verify payment success
  const paymentSuccess = await waitForPaymentCompletion(page);
  expect(paymentSuccess).toBe(true);

  // Continue with post-payment verification...
});
```
