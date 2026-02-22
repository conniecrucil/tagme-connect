# Onboarding Guide

This guide walks through reproducing the full development environment locally using the Supabase CLI and React Router's fullstack dev server. Follow it start to finish to match the team setup.

## 1. Prerequisites

- Node.js 18+ and npm
- Supabase CLI (`brew install supabase/tap/supabase` or see https://supabase.com/docs/guides/cli/installation)
- Docker Desktop (required by the Supabase CLI) running in the background
- Git, make, and a modern shell (macOS ships with the required tools)

## 2. Clone and Bootstrap

```bash
# clone the repository
git clone git@github.com:connie/tagme-connect.git
cd tagme-connect

# install dependencies
npm install
```

Copy the environment template if available and fill in required secrets:

```bash
cp .env.example .env # skip if the file already exists
```

Consult `ENVIRONMENT_VARIABLES.md` for descriptions and default values. At minimum set:

- `SUPABASE_ACCESS_TOKEN` (generated at https://app.supabase.com/account/tokens)
- Any third-party API keys used by functions (Stripe, AWS, etc.)

Export them in your shell or add them to the `.env` file.

## 3. Start Supabase Locally

The Supabase CLI hydrates a local stack that mirrors production services.

```bash
supabase start
```

This command provisions:

- PostgreSQL on `localhost:54322`
- PostgREST API on `localhost:54321`
- Supabase Studio on `http://localhost:54323`

The CLI prints the running container IDs and ports. Leave this process in the background (or run it in a dedicated terminal window).

### Apply Database Migrations

The CLI automatically seeds the database using `supabase/migrations/`. To reapply migrations manually:

```bash
supabase db reset
```

> Warning: `supabase db reset` recreates the database and drops all local data.

## 4. Seed Reference Data (Optional)

If the project includes seed scripts, run them now. Example:

```bash
npm run db:seed
```

Check the repo for available scripts inside `package.json` or `supabase/seed/`.

## 5. Run the Application

With Supabase running, start the app dev server in a separate terminal:

```bash
npm run dev
```

Run on port `3000` (same as local test/dev tooling):

```bash
npm run dev -- --port 3000
```

The React Router fullstack dev server runs the app and server loaders/actions locally.

Validate that the app loads, you can sign in, and data flows correctly against the local Supabase instance.

## 6. Develop

- Keep Supabase CLI running while you work.
- Create feature branches using `git checkout -b feature/<name>`.
- Run `npm test` for unit tests and `npm run lint` if available.

## 7. Stopping Services

When finished:

```bash
# stop the app dev server (Ctrl+C)
# stop Supabase containers
supabase stop
```

Alternatively, to tear everything down and remove volumes:

```bash
supabase stop --destroy
```

## 8. Troubleshooting

- Confirm Docker is running if `supabase start` fails.
- Use `supabase status` to inspect running services.
- Port conflicts: Supabase uses 54321-54323; the app dev server uses 3000 by default. Stop any process occupying these ports.
- Review logs with `supabase logs api` or `supabase logs db` for detailed debugging.

You are now ready to build features locally with a full replica of the Connie development environment.
