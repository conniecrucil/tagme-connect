# Deployment Guide

Use this document to launch TagMe Connect from scratch. It covers provisioning managed services, configuring infrastructure, and deploying with Netlify.

## 1. Prerequisites

- Netlify account with permission to create sites and environment variables
- Supabase account with project quota for production
- AWS account with IAM access to S3 and CloudFront
- Squarespace domain (or equivalent DNS provider) with access to manage records
- GitHub (or Git provider) repository containing the application code

## 2. Provision Core Services

### 2.1 Supabase Project

1. Create a new project in the Supabase dashboard.
2. Record the **Project URL**, **anon key**, and **service role key**.
3. Configure authentication providers if required.
4. Open the SQL editor and run migrations:
   - Upload and execute each file in `supabase/migrations/` in order, or
   - Use the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
5. Set up database secrets (if any) via `Secrets` panel.

### 2.2 AWS S3 Bucket

1. Create an S3 bucket (e.g., `tagme-connect-assets-prod`).
2. Enable default encryption.
3. Configure a bucket policy allowing CloudFront origin access, as well as public access.

### 2.3 CloudFront Distribution

1. Create a distribution with the S3 bucket as the origin.
2. Enable HTTPS using ACM-issued certificate for your custom domain (e.g., `assets.connie.com`).
3. Set appropriate cache policies (static asset TTLs, forwarding headers if needed).
4. Note the distribution domain (e.g., `d123.cloudfront.net`).

### 2.4 IAM Credentials

1. Create an IAM user with programmatic access.
2. Attach an inline policy granting least-privilege access to the S3 bucket and CloudFront invalidations.
3. Store the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` securely for Netlify environment variables.

## 3. Configure Netlify

1. Connect the Git repository to Netlify (via GitHub/GitLab/Bitbucket).
2. Set build command to `npm run build` and publish directory to `build/client` (or `netlify` output if using adapters).
3. Add the following environment variables:

   | Variable | Source |
   | --- | --- |
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (functions only; mark as sensitive) |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM credentials |
   | `AWS_S3_BUCKET` | S3 bucket name |
   | `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID for invalidations |
   | `NETLIFY_SITE_URL` | Netlify-provided site domain |
   | Any third-party integration keys | Stripe, email services, etc. |

4. Enable Netlify Functions build directory if not default (usually `netlify/functions`).
5. Optional: Configure deploy previews and branch environment overrides.

## 4. Squarespace DNS

> This can be done with any DNS, and ideally, it would be better done with AWS Route 53. 

1. Determine domain strategy (e.g., `app.connie.com` for the app, `assets.connie.com` for CloudFront).
2. In Squarespace DNS settings, add records:
   - `CNAME app` → Netlify `app-name.netlify.app`
   - `CNAME assets` → CloudFront distribution domain
   - `TXT` records required by Netlify for domain verification
3. Complete Netlify custom domain setup and enforce HTTPS.

## 5. Prepare the Repository

1. Ensure `.env.example` contains placeholders for every required environment variable.
2. Commit any final configuration changes (e.g., Supabase project ref in `supabase/config.toml`).
3. Tag a release candidate if desired.

## 6. First Deployment

1. Push to the main branch to trigger Netlify build.
2. Monitor the build logs in Netlify:
   - Dependency install
   - Build output in `build/client` and server bundle (if applicable)
   - Netlify Functions bundling
3. Once deployed, hit the public URL to verify the app loads and API calls succeed.
4. Run smoke tests:
   - Sign up / log in (if applicable)
   - Create a sample order and ensure records appear in Supabase
   - Confirm assets save to S3 and are delivered via CloudFront

## 7. Post-Deployment Tasks

- Configure Supabase database backups and point-in-time recovery.
- Set up monitoring alerts (Netlify deploy notifications, Supabase usage limits, CloudFront metrics).
- Document runbooks for incident response and data migrations.

## 8. Promotion & Maintenance

- Use feature branches and Netlify deploy previews for testing.
- Promote changes via PR review; merge to main for production deploy.
- For migrations: run `supabase db push` against staging first, then production.
- Rotate IAM keys on a regular cadence and update Netlify environment variables accordingly.

You now have a production-ready deployment of TagMe Connect with managed services wired together for reliability and scale.
