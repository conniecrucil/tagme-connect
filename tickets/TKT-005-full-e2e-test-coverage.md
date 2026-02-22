# TKT-005: Full End-to-End Test Coverage Expansion

## Summary

Expand Playwright coverage to include all major customer and admin flows, including the new website-builder product and product-catalog admin editing.

## Why

- Existing E2E tests cover selected flows only.
- Upcoming catalog/runtime changes create high regression risk across checkout, admin, and fulfillment logic.

## Current Coverage (Observed)

- Existing specs under `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/` include basic/core purchase flows and some admin flows.
- Coverage is not yet full for product catalog editing, deployment migration behavior, or all error states.

## Scope

- Define test matrix for:
  - Homepage -> shop -> product details
  - Basic card purchase
  - Core card purchase
  - Personalized website builder purchase (new)
  - Admin product catalog edit (price/description/bullets)
  - Admin cards and orders smoke checks
  - Failure paths (validation + API failures) for critical forms
- Add stable fixtures/mocks for Stripe and backend APIs where needed.
- Run tests in CI and document local e2e workflow.

## Out of Scope

- Visual regression snapshots (unless explicitly added later).
- Load/performance testing.

## Likely Files

- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/playwright.config.ts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/*.spec.ts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/setup.ts`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/test-utils.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/tests/utils/*`
- CI workflow config (if present / to be added)

## Acceptance Criteria

- Critical customer and admin flows have E2E coverage with clear test names.
- Tests pass locally with documented setup and env requirements.
- CI runs E2E suite (or smoke subset + nightly full suite) and reports failures.
- New product/admin catalog features are covered before release.

## Implementation Notes

- Prefer deterministic API mocking over live third-party calls for CI stability.
- Split suite into smoke vs full to keep PR feedback fast.
- Add helper abstractions to avoid repeating product selection and checkout setup logic.

## Dependencies

- Best completed after TKT-002, TKT-003, and TKT-004 stabilize.
