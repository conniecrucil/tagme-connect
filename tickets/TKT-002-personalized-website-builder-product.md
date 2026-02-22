# TKT-002: Add Personalized Website Builder Product (Digital-Only)

## Summary

Add a new storefront product for a personalized website builder experience that matches the "full card" build flow but does **not** include a physical card. Price should match the basic card (`$40.00`), with temporary lorem ipsum copy for product marketing text.

## Why

- Supports digital-only customers who want the hosted profile/website experience without NFC card production.
- Reuses existing builder/configuration value while widening the funnel.

## Product Requirements

- New product appears in shop listing and product routes.
- Uses the same configuration/build experience as the full/core experience where applicable.
- No physical card fulfillment steps for this product.
- Price equals TAG Basic Card price (`$40.00`).
- Temporary lorem copy is acceptable for descriptions/bullets until final marketing copy is approved.

## Scope

- Add new product ID (proposed: `tag-personal-website-builder`).
- Add shop card (name, price, description, bullets, image placeholder).
- Route product detail and configure flow to reuse core builder UI/logic where possible.
- Ensure cart/checkout line item supports new product type.
- Ensure confirmation/email/fulfillment logic does not create/expect a physical card for this product.

## Out of Scope

- Final copywriting/brand review.
- New payment provider features.
- Full pricing-admin UI (covered in TKT-003).

## Likely Files

- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop._index.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop.$productId.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop.$productId._index.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop.$productId.configure.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/providers/configuration-provider.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/lib/cartUtils.ts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify/functions/create-checkout-session.mts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify/functions/send-purchase-emails.mts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify/functions/utils/email-templates.mts`

## Acceptance Criteria

- New product is visible in `/shop` with `$40.00` price and lorem placeholder content.
- User can configure and add to cart without physical-card-only validation steps.
- Checkout creates the correct line item and total.
- Post-purchase flow completes without card manufacturing path running for this product.
- Admin/order views display the new product line item clearly.

## Technical Notes

- Current code assumes only `basic` and `core` in many branches; refactor to explicit product catalog data and fulfillment behavior flags.
- Prefer introducing a shared product config module before touching multiple routes/functions.

## Dependencies

- Recommended after TKT-003 (catalog + admin editable product data), but can start with a temporary hardcoded product and later migrate.
