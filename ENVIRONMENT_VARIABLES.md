# Environment Variables Configuration

This document outlines all the environment variables required for the Netlify POC application.

## Required Environment Variables

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with sk_)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with pk_)

### Email Configuration
- `RESEND_API_KEY` - Your Resend API key for sending emails
- `EMAIL_FROM` - The email address to send emails from (must be verified in Resend)
- `ADMIN_EMAIL` - Email address to receive admin notifications
- `SUPPORT_EMAIL` - Support email address for customer inquiries

### Company Information
- `COMPANY_NAME` - Your company name
- `COMPANY_WEBSITE` - Your company website URL

### AWS S3 Configuration (Production)
- `APP_AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `APP_AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `APP_AWS_REGION` - AWS region for your S3 bucket (e.g., us-east-1)
- `VITE_AWS_S3_BUCKET_NAME` - Name of your S3 bucket for storing contact cards

### MinIO/S3 Configuration (Development/Test)
- `S3_ENDPOINT` - MinIO endpoint URL (automatically set by Docker)
- `S3_ACCESS_KEY` - MinIO access key (automatically set by Docker)
- `S3_SECRET_KEY` - MinIO secret key (automatically set by Docker)
- `S3_BUCKET_NAME` - MinIO bucket name (default: `tagme-dev` for dev, `tagme-test` for test)
- `S3_FORCE_PATH_STYLE` - Set to `true` for MinIO compatibility (automatically set by Docker)
- `S3_WEBSITE_ENDPOINT` - MinIO website hosting endpoint (automatically set by Docker)

### MinIO Root Credentials (Docker Compose only)
- `MINIO_ROOT_USER` - MinIO root username (default: `minioadmin`)
- `MINIO_ROOT_PASSWORD` - MinIO root password (default: `minioadmin123`)
- `MINIO_TEST_ROOT_USER` - MinIO test root username (default: `miniotest`)
- `MINIO_TEST_ROOT_PASSWORD` - MinIO test root password (default: `miniotest123`)



### Auth0 Configuration
- `VITE_AUTH0_DOMAIN` - Your Auth0 tenant domain (e.g., `your-tenant.us.auth0.com`)
- `VITE_AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret (server-side only, not exposed to client)
- `AUTH0_AUDIENCE` - Optional Auth0 API identifier (defaults to Auth0 Management API)

### Netlify Configuration
- `NETLIFY_SITE_URL` - Your Netlify site URL (e.g., https://your-site.netlify.app)

### Supabase Configuration
- `SUPABASE_URL` - Supabase API URL
  - Local development: `http://localhost:54321`
  - Local test: `http://localhost:54421`
  - Production: Your hosted Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_ANON_KEY` - Supabase anonymous key for client-side operations
  - Local development/test: Use the default key from `.env.example`
  - Production: Get from your Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side operations
  - Local development/test: Use the default key from `.env.example`
  - Production: Get from your Supabase project settings (keep secret!)
- `DATABASE_URL` - Direct PostgreSQL connection string
  - Local development: `postgres://postgres:postgres@localhost:54322/postgres`
  - Local test: `postgres://postgres:postgres@localhost:54422/postgres_test`
  - Production: Get from your Supabase project settings

### PostgreSQL Configuration (Docker Compose only)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: `postgres`)
- `POSTGRES_DB` - PostgreSQL database name (default: `postgres` for dev, `postgres_test` for test)
- `POSTGRES_USER` - PostgreSQL username (default: `postgres`)
- `JWT_SECRET` - JWT secret for local PostgREST authentication (minimum 32 characters)

## Setting Environment Variables

### For Local Development
Create a `.env` file in the root directory with the above variables:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Email (Resend)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=hello@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Company Info
COMPANY_NAME=Your Company Name
COMPANY_WEBSITE=https://yourdomain.com

# AWS S3
APP_AWS_ACCESS_KEY_ID=your_aws_access_key_id
APP_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
APP_AWS_REGION=us-east-1
VITE_AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Admin Auth (Legacy - Deprecated)
ADMIN_USER=admin
ADMIN_PASS=your_secure_admin_password

# Auth0 (Google-only OAuth)
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_AUDIENCE=https://your-tenant.us.auth0.com/api/v2/

# Netlify
NETLIFY_SITE_URL=https://your-site.netlify.app

# Supabase (Local Development)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres

# PostgreSQL (Docker Compose)
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

### For Netlify Deployment
Set these variables in your Netlify dashboard under Site Settings > Environment Variables.

## S3/MinIO Setup

### Production S3 Bucket Setup
1. Create an S3 bucket in your AWS account
2. Configure the bucket for public read access on uploaded objects:
   - Go to bucket permissions → Block public access settings
   - Uncheck "Block all public access" 
   - Check "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"
3. Set up bucket policy for public read access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
       }
     ]
   }
   ```
4. Configure the bucket for website hosting (optional but recommended):
   - Go to Properties → Static website hosting
   - Enable static website hosting
   - Set index document to `index.html`
5. Set up CORS configuration for cross-origin requests:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
6. Ensure your AWS credentials have the following permissions:
   - `s3:PutObject`
   - `s3:PutObjectAcl`
   - `s3:GetObject` (for verification)

### Local Development with MinIO
MinIO containers are automatically configured with:
- **Dev Environment**: 
  - API: `http://localhost:9000`
  - Web Console: `http://localhost:9001`
  - Website Hosting: `http://localhost:9010`
  - Bucket: `tagme-dev`
- **Test Environment**:
  - API: `http://localhost:9002`
  - Web Console: `http://localhost:9003`
  - Website Hosting: `http://localhost:9011`
  - Bucket: `tagme-test`

#### Accessing Generated Websites
When contact cards are generated, they create static websites that can be accessed at:
- **Dev**: `http://localhost:9010/{uuid}/index.html`
- **Test**: `http://localhost:9011/{uuid}/index.html`

#### MinIO Web Console Access
- **Dev Console**: http://localhost:9001 (username: `minioadmin`, password: `minioadmin123`)
- **Test Console**: http://localhost:9003 (username: `miniotest`, password: `miniotest123`)

## Security Notes

- Never commit your `.env` file to version control
- Use IAM roles with minimal required permissions for production
- Consider using AWS Secrets Manager for production deployments
- Regularly rotate your API keys and access credentials
