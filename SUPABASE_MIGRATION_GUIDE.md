# Supabase Database Migration Guide

This guide explains how to manually apply the database schema to your SaaS Supabase project.

## Prerequisites

- A SaaS Supabase account (sign up at https://supabase.com)
- A Supabase project created
- Your `PROJECT_URL` and `SUPABASE_KEY` credentials

## Steps to Apply Migrations

### 1. Access Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**

### 2. Apply the Complete Schema

Copy and paste the contents of `supabase/migrations/000_complete_schema.sql` into the SQL Editor and click **Run**.

This single file contains all migrations combined:
- Part 1: Initial Schema (orders, contact_cards, admin_users)
- Part 2: Customer and Card Models
- Part 3: Admin Users Auth0

#### Complete Schema File

Run `supabase/migrations/000_complete_schema.sql`:

**Note:** The complete schema file includes all tables, indexes, triggers, and permissions needed for the TagMe Connect application. Just run this one file!

### 3. Verify Migration Success

After running all migrations:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `orders`
   - `contact_cards`
   - `admin_users`
   - `customers`
   - `cards`
   - `card_assets`
   - `admin_users_auth0`

### 4. Configure Row Level Security (RLS) - Optional

If you want to enable Row Level Security:

1. Go to **Authentication** → **Policies**
2. Configure RLS policies as needed for your use case
3. For server-side operations with `SUPABASE_KEY`, RLS is bypassed

## Environment Variables

After applying migrations, make sure your `.env` file includes:

```bash
PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_service_role_key_here
```

You can find these in your Supabase project settings under **Settings** → **API**.

## Troubleshooting

### Error: "permission denied for schema public"

Supabase creates roles automatically. If you encounter permission errors, the migrations should handle role creation. If issues persist, contact Supabase support.

### Error: "relation already exists"

If tables already exist from a previous migration attempt, you can either:
1. Drop the existing tables and re-run migrations
2. Skip the migration that creates existing tables

### UUID Extension Not Available

The `uuid-ossp` extension should be available by default in Supabase. If not available, contact Supabase support.

## Next Steps

After applying migrations:

1. Test your Netlify functions to ensure they can connect to Supabase
2. Verify data can be written and read from the database
3. Configure any additional indexes or constraints as needed

## Notes

- These migrations create all necessary tables, indexes, and triggers
- The `anon` and `service_role` roles are used by Supabase's built-in authentication
- Your application uses `SUPABASE_KEY` (service role) which bypasses RLS and has full access
- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
