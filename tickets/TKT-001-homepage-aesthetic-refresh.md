# TKT-001: Homepage Aesthetic Refresh (React Bits Evaluation)

## Summary

Evaluate [React Bits](https://www.reactbits.dev/) patterns/components and refresh the homepage aesthetic while preserving existing messaging and conversion path to `/shop`.

## Why

- Current homepage sections are functional but visually inconsistent (mixed animation intensity, repeated gray backgrounds, limited hierarchy polish).
- Marketing page should better showcase the product and feel more premium.

## Scope

- Review React Bits for reusable hero/background/section treatments that fit the existing stack.
- Refresh homepage composition and styling for:
  - Hero section
  - Feature callout section
  - TAG Me cards section
  - Story section
- Preserve mobile usability and CTA visibility.
- Respect reduced-motion preferences.

## Out of Scope

- Full brand rewrite or new photography/video production.
- Shop/product detail page redesign.

## Likely Files

- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/routes/_index.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/components/HeroSection.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/components/FeaturesSection.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/components/TagMeCardsSection.tsx`
- `/Users/brianbancroft/programming/side-hustle/connie/tagme-connect/app/components/StorySection.tsx`
- shared styles/theme tokens as needed

## Acceptance Criteria

- Homepage has a clearly upgraded visual direction (intentional typography, spacing, and backgrounds).
- CTA to `/shop` remains prominent above the fold on mobile and desktop.
- Animations do not create layout shift and respect `prefers-reduced-motion`.
- Lighthouse/perf regression is minimal (no large image/JS regressions from added effects).

## Implementation Notes

- Prefer composable patterns over importing heavy animation dependencies unless justified.
- If React Bits components are adopted, document which ones and why.
- Keep copy mostly intact for this pass unless specific content issues block layout.

## Dependencies

- None (can proceed independently).
