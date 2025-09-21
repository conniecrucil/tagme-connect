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

### AWS S3 Configuration (NEW)
- `APP_AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `APP_AWS_SECRET_ACCESS_KEY` - Your AWS secret access key
- `APP_AWS_REGION` - AWS region for your S3 bucket (e.g., us-east-1)
- `APP_AWS_S3_BUCKET_NAME` - Name of your S3 bucket for storing contact cards

### Admin Authentication
- `ADMIN_USER` - Username for admin access
- `ADMIN_PASS` - Password for admin access

### Netlify Configuration
- `NETLIFY_SITE_URL` - Your Netlify site URL (e.g., https://your-site.netlify.app)

## Setting Environment Variables

### For Local Development
Create a `.env` file in the root directory with the above variables:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=hello@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
COMPANY_NAME=Your Company Name
COMPANY_WEBSITE=https://yourdomain.com
APP_AWS_ACCESS_KEY_ID=your_aws_access_key_id
APP_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
APP_AWS_REGION=us-east-1
APP_AWS_S3_BUCKET_NAME=your-s3-bucket-name
ADMIN_USER=admin
ADMIN_PASS=your_secure_admin_password
NETLIFY_SITE_URL=https://your-site.netlify.app
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

## Security Notes

- Never commit your `.env` file to version control
- Use IAM roles with minimal required permissions for production
- Consider using AWS Secrets Manager for production deployments
- Regularly rotate your API keys and access credentials
