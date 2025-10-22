# Docker Compose Setup Summary

This document summarizes the Docker Compose setup for local Supabase development and testing.

## What Was Created

### Docker Compose Files

1. **docker-compose.dev.yml** - Development environment
   - PostgreSQL (port 54322)
   - PostgREST API (port 54321)
   - Supabase Studio UI (port 54323)
   - Netlify Dev (port 8888)

2. **docker-compose.test.yml** - Testing environment
   - PostgreSQL Test (port 54422)
   - PostgREST API Test (port 54421)
   - Netlify Test (port 8889)
   - Playwright Tests

### Database Files

1. **supabase/migrations/001_initial_schema.sql**
   - Creates `orders` table for storing order data
   - Creates `contact_cards` table for linking cards to orders
   - Creates `admin_users` table for future OTP authentication
   - Sets up indexes and triggers
   - Creates database roles (anon, service_role)

2. **supabase/seed.sql**
   - Sample data for development
   - Test admin user (email: admin@tagme.test, password: admin123)
   - Sample orders and contact cards

3. **supabase/config.toml**
   - Configuration for local Supabase services
   - API, database, and Studio settings

4. **supabase/reset-test-db.sh**
   - Script to reset test database between test runs
   - Made executable with chmod +x

### Utility Files

1. **netlify/functions/utils/supabase.ts**
   - Supabase client initialization
   - TypeScript types for database tables
   - Helper functions for common operations
   - **Note**: Not yet integrated into application (setup only)

### Configuration Updates

1. **package.json**
   - Added `@supabase/supabase-js` dependency
   - New scripts:
     - `dev:db` - Start development database
     - `dev:db:down` - Stop development database
     - `test:db` - Start test database
     - `test:db:down` - Stop test database
     - `test:docker` - Updated to use test compose file
     - `db:reset-test` - Reset test database

2. **ENVIRONMENT_VARIABLES.md**
   - Added Supabase configuration section
   - Added PostgreSQL configuration section
   - Updated example .env file

3. **README.md**
   - Added Database Setup section
   - Added Testing section
   - Added Troubleshooting section
   - Updated deployment information

## Quick Start

### First Time Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with environment variables (see ENVIRONMENT_VARIABLES.md)

3. Start the development database:
```bash
npm run dev:db
```

4. In a separate terminal, start the dev server:
```bash
npm run dev
```

5. Access services:
   - Application: http://localhost:8888
   - Supabase Studio: http://localhost:54323
   - PostgREST API: http://localhost:54321

### Daily Development Workflow

1. Start database: `npm run dev:db`
2. Start app: `npm run dev` (in separate terminal)
3. When done, stop database: `npm run dev:db:down`

### Running Tests

1. Start test database: `npm run test:db`
2. Run tests: `npm test` (in separate terminal)
3. Reset test data: `npm run db:reset-test`

## Database Schema

### Orders Table
Stores customer order information from Stripe checkout:
- `id` - UUID primary key
- `stripe_session_id` - Stripe session ID (unique)
- `customer_info` - JSONB (name, email, phone, etc.)
- `cart_data` - JSONB array of cart items
- `status` - Order status (pending, completed, failed, cancelled)
- `created_at`, `updated_at` - Timestamps

### Contact Cards Table
Links contact cards to orders with S3 storage:
- `id` - UUID primary key
- `uuid` - Card UUID (unique)
- `order_id` - Foreign key to orders table
- `card_data` - JSONB of card information
- `s3_url` - URL to card in S3
- `created_at` - Timestamp

### Admin Users Table
Admin authentication (prepared for future OTP implementation):
- `id` - UUID primary key
- `email` - Email address (unique)
- `password_hash` - Bcrypt password hash
- `otp_secret` - OTP secret (optional)
- `otp_enabled` - Boolean flag for OTP
- `last_login` - Last login timestamp
- `created_at`, `updated_at` - Timestamps

## System Status Monitoring

### Admin System Status Page

The admin dashboard includes a system status page at `/admin/system-status` that provides:

- **Environment Variable Check**: Verifies all required environment variables are configured
- **Service Health Monitoring**: Shows status of critical services (Stripe, Email, Supabase, MinIO, etc.)
- **Configuration Guidance**: Provides setup instructions for missing variables
- **Health Score**: Overall system health percentage based on configured services

### Accessing System Status

1. Start the development environment: `make dev`
2. Navigate to: http://localhost:8888/admin/system-status
3. Or access via admin dashboard: http://localhost:8888/admin → "System Status"

### Error Handling

The system now includes comprehensive error handling:

- **Card Detail Pages**: Show specific error messages with retry functionality
- **Configuration Errors**: Detect missing Supabase environment variables
- **Service Unavailable**: Handle database connection issues gracefully
- **Retry Mechanisms**: Allow users to retry failed operations

## Next Steps

### Application Integration (Future Work)

The database is set up and ready, but not yet integrated into the application. Future work includes:

1. **Migrate Netlify Functions**
   - Update `create-checkout-session.mts` to use Supabase instead of temp files
   - Update `send-purchase-emails.mts` to retrieve from Supabase
   - Import and use functions from `netlify/functions/utils/supabase.ts`

2. **Implement OTP Authentication**
   - Create admin login flow
   - Implement OTP generation and verification
   - Update admin routes to use database authentication

3. **Production Setup**
   - Create Supabase project at https://supabase.com
   - Run migrations in production Supabase
   - Update production environment variables

## Notes

- **Old docker-compose.yml**: The existing `docker-compose.yml` file is still present. You may want to rename it to `docker-compose.old.yml` or remove it to avoid confusion.
- **.env.example**: Could not be created (blocked by .gitignore). Use the example from ENVIRONMENT_VARIABLES.md instead.
- **Data Persistence**: Development database data persists in Docker volumes. To completely reset, run `docker volume rm tagme-connect_postgres-data-dev`
- **Test Isolation**: Test database uses separate volumes and ports to ensure complete isolation from development data.



