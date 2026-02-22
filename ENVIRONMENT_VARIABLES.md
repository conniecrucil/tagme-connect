# Environment Variables Configuration

This document outlines environment variables required for the TagMe Connect app (Vercel + React Router fullstack runtime).

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

### AWS S3 Configuration
- `APP_AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `APP_AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `APP_AWS_REGION` - AWS region for your S3 bucket (e.g., us-east-1)
- `VITE_AWS_S3_BUCKET_NAME` - Name of your S3 bucket for storing contact cards (used for SDK operations)
- `VITE_AWS_S3_BUCKET_URL` - Public URL base for accessing S3 bucket content (e.g., `https://cards.yourdomain.com` or CloudFront URL like `https://d1234567890.cloudfront.net`)
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` - CloudFront distribution ID used to invalidate cached card assets after updates



### Auth0 Configuration
- `VITE_AUTH0_DOMAIN` - Your Auth0 tenant domain (e.g., `your-tenant.us.auth0.com`)
- `VITE_AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret (server-side only, not exposed to client)
- `AUTH0_AUDIENCE` - Optional Auth0 API identifier (defaults to Auth0 Management API)

### Deployment Configuration
- `APP_BASE_URL` - Canonical public app URL (e.g., https://app.example.com)
- `VERCEL_URL` - Vercel deployment URL (usually auto-injected by Vercel)
- `NETLIFY_SITE_URL` - Legacy fallback during migration (optional)

### Supabase Configuration (SaaS - Server-side only)
- `PROJECT_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
  - Get from your Supabase project settings under "Project Settings" → "API"
- `SUPABASE_KEY` - Supabase service role key for server-side operations
  - Get from your Supabase project settings under "Project Settings" → "API" → "Service role key"
  - **Keep secret!** This key has full access to your database

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
VITE_AWS_S3_BUCKET_URL=https://cards.yourdomain.com
AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

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

# Supabase (SaaS - Server-side only for Netlify functions)
PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_service_role_key_here
```

### For Netlify Deployment
Set these variables in your Netlify dashboard under Site Settings > Environment Variables.

## S3 Bucket Setup
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

### Setting up Custom Domain or CloudFront (Recommended)
For better performance and branding, you can use a custom domain or CloudFront distribution:

- **Option 1 - CloudFront**: Create a CloudFront distribution pointing to your S3 bucket and use that URL in `VITE_AWS_S3_BUCKET_URL`
- **Option 2 - Custom Domain**: Configure a custom domain with DNS CNAME pointing to your S3 bucket or CloudFront distribution

## Security Notes

- Never commit your `.env` file to version control
- Use IAM roles with minimal required permissions for production
- Consider using AWS Secrets Manager for production deployments
- Regularly rotate your API keys and access credentials
