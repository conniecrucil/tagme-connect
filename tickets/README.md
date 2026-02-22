# TagMe Connect Ticket Cards

This folder tracks planned work as markdown tickets.

## Proposed Order

1. `TKT-003-admin-manage-product-catalog.md` (foundation: data model + admin editing)
2. `TKT-002-personalized-website-builder-product.md` (new product powered by catalog)
3. `TKT-001-homepage-aesthetic-refresh.md` (marketing refresh, includes homepage updates)
4. `TKT-004-netlify-to-vercel-migration.md` (deployment/runtime migration)
5. `TKT-005-full-e2e-test-coverage.md` (expand tests after major changes settle)

## Notes

- Product metadata is currently hardcoded in multiple places (`/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop._index.tsx`, `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/shop.$productId.tsx`, `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/providers/configuration-provider.tsx`, and checkout/email functions).
- Admin currently manages cards/orders, not the storefront product catalog.
- E2E coverage exists but is partial (`/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/`).
