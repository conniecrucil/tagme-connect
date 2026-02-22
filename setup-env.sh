#!/bin/bash

# Environment Setup Script for TagMe Connect
# This script helps users create a .env file with the required environment variables

echo "🔧 TagMe Connect Environment Setup"
echo "=================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo "📝 Creating .env file with default values..."
echo "You can edit these values later as needed."
echo ""

# Create .env file with default values
cat > .env << 'EOF'
# Stripe Configuration (REQUIRED - Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Email Configuration (REQUIRED - Get from https://resend.com/api-keys)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=hello@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Company Information (REQUIRED)
COMPANY_NAME=TagMe Connect
COMPANY_WEBSITE=https://tagmeconnect.com

# AWS S3 Configuration (REQUIRED)
APP_AWS_ACCESS_KEY_ID=your_aws_access_key_id
APP_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
APP_AWS_REGION=us-east-1
VITE_AWS_S3_BUCKET_NAME=your-s3-bucket-name
VITE_AWS_S3_BUCKET_URL=https://cards.yourdomain.com

# Admin Authentication (REQUIRED)
ADMIN_USER=admin
ADMIN_PASS=admin123

# Deployment Configuration (REQUIRED for production callbacks/URLs)
APP_BASE_URL=https://app.yourdomain.com
# Optional Vercel deployment URL fallback (auto-provided in Vercel)
VERCEL_URL=your-project.vercel.app

# Supabase Configuration (Local Development - Default values work for local dev)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres

# PostgreSQL Configuration (Default values work for local dev)
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Auth0 Configuration (REQUIRED)
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_AUDIENCE=https://your-tenant.us.auth0.com/api/v2/

# Supabase Configuration (SaaS - Server-side)
PROJECT_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_service_role_key_here
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to update the following REQUIRED values:"
echo "   - STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY"
echo "   - RESEND_API_KEY"
echo "   - EMAIL_FROM (must be verified in Resend)"
echo "   - ADMIN_EMAIL and SUPPORT_EMAIL"
echo "   - COMPANY_NAME and COMPANY_WEBSITE"
echo "   - AWS credentials (for production S3)"
echo "   - ADMIN_USER and ADMIN_PASS"
echo "   - APP_BASE_URL (and optionally VERCEL_URL for deployments)"
echo ""
echo "📖 See ENVIRONMENT_VARIABLES.md for detailed setup instructions."
echo ""
echo "🚀 You can now run 'make dev' to start the development environment!"
