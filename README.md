# TagMe Connect

| [Onboarding](./doc/ONBOARDING.md) | [Architecture](./doc/TECH_STACK.md) | [Deployment](./doc/DEPLOYMENT.md) |





TagMe Connect is an e-commerce site for purchasing NFC-enabled business cards, and generating simple websites for any enhanced card, allowing those who lack their own website.




## Product Overview

TagMe Connect powers Connie’s NFC business pipeline end to end:

- Customers purchase cards, upload assets, and track order status.
- Operations teams review submissions and trigger card production.
- Netlify functions integrate with Supabase to orchestrate card asset generation and fulfillment.

## Architecture Snapshot

- React Router (Framework) handles routing, server rendering, and data loading.
- Netlify Functions provide serverless business logic and third-party integrations.
- Supabase stores customer, order, and card metadata while exposing real-time APIs.
- AWS S3 stores the auto-generated websites

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` (if present) to `.env` and fill required values (see `ENVIRONMENT_VARIABLES.md`)
3. Follow the [Onboarding](ONBOARDING.md) guide to configure Supabase CLI and start local services
4. Launch the Netlify dev server: `netlify dev` (serves the app at `http://localhost:8888`)

## Documentation Index

- [Onboarding](ONBOARDING.md) – local setup with Supabase CLI
- [Tech Stack](TECH_STACK.md) – infrastructure, SaaS services, and data flows
- [Deployment](DEPLOYMENT.md) – step-by-step instructions to launch from scratch

## Additional Resources

- Database migrations live in `supabase/migrations/`
- Component styling follows the Tailwind CSS conventions defined in `tailwind.config.js`
- Netlify Functions reside in `netlify/functions/`

For troubleshooting, common commands, and deep dives into specific features, consult the linked guides above. Built with love for the Connie team.
