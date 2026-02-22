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

## Local Onboarding (Makefile)

This repo uses a `Makefile` for the standard local workflow.

### 1. Install Prerequisites

- Node.js 18+ (includes `npm`)
- Supabase CLI
- Docker Desktop (running)
- Netlify CLI (optional if you use `npx`; recommended global install)

macOS (Homebrew) example:

```bash
brew install nvm supabase/tap/supabase
# install/start Docker Desktop separately:
# https://www.docker.com/products/docker-desktop/

# then install Node (via nvm)
nvm install --lts
nvm use --lts

# optional: global Netlify CLI
npm install -g netlify-cli
```

### 2. Install Project Dependencies

```bash
npm install
```

### 3. Configure Environment

If you do not already have a `.env`, copy the template and fill in any non-local secrets you need:

```bash
cp .env.example .env
```

`make up` will create/update `.env.local` with local Supabase and local S3 (Supabase Storage S3 API) values automatically.

See `ENVIRONMENT_VARIABLES.md` for variable descriptions.

### 4. Start Local Services

```bash
make up
```

What `make up` does:

- verifies prerequisites (`node`, `npm`, `supabase`, `docker`) and prints install hints if missing
- starts the local Supabase stack
- updates `.env.local` with local Supabase URLs/keys and local S3 credentials
- ensures DB schema exists (applies migrations if needed)
- seeds the DB if empty
- seeds local S3 assets

### 5. Run the App (Netlify Dev)

```bash
make dev
```

The app will be available at `http://127.0.0.1:8888`.

### 6. Common Commands

```bash
make status   # ports + health checks
make down     # stop local Supabase stack
make nuke     # remove local Supabase containers/volumes/temp state
make db-logs  # tail Supabase Postgres logs (useful when startup hangs)
```

### Troubleshooting

- If `make up` hangs at `Starting database...`, run `make db-logs` in another terminal.
- If the DB container reports `No space left on device`, free Docker Desktop space (image/build cache), then rerun:
  1. `make nuke`
  2. `make up`
- If `make dev` says port `8888` is in use, stop the existing process using that port and retry.

## Documentation Index

- [Onboarding](ONBOARDING.md) – local setup with Supabase CLI
- [Tech Stack](TECH_STACK.md) – infrastructure, SaaS services, and data flows
- [Deployment](DEPLOYMENT.md) – step-by-step instructions to launch from scratch

## Additional Resources

- Database migrations live in `supabase/migrations/`
- Component styling follows the Tailwind CSS conventions defined in `tailwind.config.js`
- Netlify Functions reside in `netlify/functions/`

For troubleshooting, common commands, and deep dives into specific features, consult the linked guides above. Built with love for the Connie team.
