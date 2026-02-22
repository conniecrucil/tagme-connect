# TKT-003: Admin-Editable Product Catalog (Price, Bullets, Description)

## Summary

Create admin tooling to manage the three storefront products (Basic, Core, Website Builder), including price, bullet points, and description. Requires a database migration and replacement of current hardcoded product metadata in app/routes/providers/functions.

## Why

- Product catalog content and pricing are duplicated and hardcoded across frontend and serverless functions.
- Non-dev admins need to change pricing/copy without code deploys.

## Current State (Observed)

- Product metadata is hardcoded in:
  - `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop._index.tsx`
  - `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop.$productId.tsx`
  - `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/providers/configuration-provider.tsx`
- Checkout/email logic also hardcodes price/type branching in Netlify functions.

## Proposed Data Model

Add a `product_catalog` table (or similarly named) with fields such as:

- `id` (uuid)
- `slug` (unique text, e.g. `tag-basic-card`)
- `display_name`
- `product_type` / `fulfillment_mode` (physical-basic / physical-core / digital-only)
- `price_cents`
- `short_description`
- `description`
- `bullet_points` (jsonb text array)
- `image_url`
- `is_active`
- timestamps

## Scope

- DB migration to create `product_catalog`.
- Seed/update script to insert the three products.
- Read product catalog in shop/product routes instead of hardcoded arrays.
- Admin UI to list/edit product `price`, `bullet_points`, and `description`.
- Backend endpoint/function for admin product updates with auth checks.

## Out of Scope

- Rich text editor.
- Promotions/discount rules.
- Multi-currency pricing.

## Likely Files

- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/supabase/migrations/` (new migration, e.g. `002_product_catalog.sql`)
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/supabase/seed.sql`
- new admin route(s), e.g. `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/admin.products._index.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify/functions/` (new product catalog CRUD functions)
- shared product access utility module(s)

## Acceptance Criteria

- Admin can view all 3 products and update price, bullets, and description.
- Changes persist in Supabase and appear on storefront without code edits.
- Checkout uses DB price (not hardcoded values) for all products.
- Validation prevents negative price and malformed bullet arrays.
- Migration + seed scripts run cleanly in local setup.

## Implementation Notes

- Store price as integer cents and format in UI.
- Introduce a shared product service to remove duplicated product definitions.
- Consider feature flag or fallback to hardcoded catalog during rollout.

## Dependencies

- Foundation for TKT-002.
- Should land before/with TKT-004 to avoid migrating hardcoded behavior twice.
