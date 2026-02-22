# TKT-004: Migrate Deployment from Netlify (Functions) to Vercel (Fullstack)

## Summary

Move the application from Netlify-hosted frontend + Netlify Functions to a Vercel fullstack deployment model, while preserving checkout/admin/card generation behavior.

## Why

- Simplify hosting topology and align app/server runtime under one platform.
- Reduce platform-specific coupling (Netlify function paths, `netlify.toml`, Netlify env assumptions).

## Scope

- Replace Netlify deployment configuration with Vercel configuration.
- Migrate serverless endpoints under `/.netlify/functions/*` to Vercel-compatible handlers (or React Router server endpoints, depending on chosen runtime architecture).
- Update frontend fetch paths to new API routes.
- Update local dev workflow docs and env variable names as needed.
- Verify Stripe webhook/checkout callback URLs and auth flows in Vercel.

## Out of Scope

- Re-architecting core business logic beyond runtime adaptation.
- Changing Supabase/AWS S3 providers (unless required by deployment constraints).

## Key Risks

- Many frontend routes hardcode `/.netlify/functions/*` fetch URLs.
- Netlify-specific runtime assumptions exist in functions (`process.env.NETLIFY` checks).
- File upload and binary handling differences may break asset generation flows.
- Auth0 callback/allowed origin changes required.

## Likely Files

- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify.toml`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/netlify/functions/*`
- frontend routes/loaders that call `/.netlify/functions/*` (admin/shop/checkout)
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/README.md`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/doc/DEPLOYMENT.md`
- new Vercel config (`vercel.json`) and runtime entrypoints as needed

## Acceptance Criteria

- App deploys and serves on Vercel.
- Shop, checkout, admin list/detail pages, and card generation paths work end-to-end in Vercel env.
- No frontend requests to `/.netlify/functions/*` remain.
- Deployment docs updated for local and production workflows.

## Suggested Rollout Plan

1. Create compatibility API layer on Vercel with identical response shapes.
2. Migrate frontend fetch paths behind a single API client abstraction.
3. Cut over staging.
4. Validate Stripe/Auth0 callbacks.
5. Cut over production and decommission Netlify.

## Dependencies

- Can run in parallel with TKT-001.
- Coordinate with TKT-003 if product pricing/copy moves to DB at the same time.
