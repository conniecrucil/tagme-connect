# User Purchase Workflow - Netlify POC

## Overview
This document outlines the complete user journey for purchasing smart business cards through the Netlify POC application. The workflow includes product selection, configuration, cart management, validation, payment processing, and post-purchase notifications.

## Workflow Steps

### 1. Product Selection (`/shop`)
- **Entry Point**: User navigates to the shop page
- **Available Products**:
  - TAG Basic Card ($40.00) - One custom NFC card with personalized smart link
  - TAG Core Card ($47.00) - Complete digital profile with automatic contact saving
- **User Action**: User clicks "View Details" on desired product

### 2. Product Details (`/shop/{productId}`)
- **Page**: Individual product detail page
- **Features**:
  - Product image, description, and features
  - Detailed use cases and benefits
  - Quantity selector (1-5 cards)
- **User Action**: User selects quantity and clicks "Add To Cart"

### 3. Configuration (`/configure/{productId}`)
- **Functionality**: Similar to vue-standalone-app configuration
- **User Details Collection**:
  - Personal information (name, email, phone)
  - Business information (company, title, website)
  - Social media links
  - Logo/image uploads
  - Custom messaging or branding preferences
- **State Management**: All configuration data stored in application state
- **User Action**: User fills out details and clicks "Confirm Configuration"

### 4. Cart Management (`/cart`)
- **Cart Contents**: 
  - Product type (TAG Basic Card or TAG Core Card)
  - Quantity selected
  - Complete configuration data for each card
- **Cart Features**:
  - Review configured items
  - Edit quantities
  - Remove items
  - Update configurations
- **User Action**: User reviews cart and clicks "Proceed to Checkout"

### 5. Checkout Validation (`/checkout`)
- **Client-Side Validation**:
  - Form field validation
  - Required field checks
  - Email format validation
  - Phone number validation
- **Server-Side Validation** (Netlify Function):
  - **VCard Generation**: Attempt to convert each card configuration into proper vCard format
  - **Validation Process**:
    - Parse user configuration data
    - Generate vCard file (.vcf format)
    - Validate vCard structure and required fields
    - Test vCard compatibility with standard readers
  - **Security**: Client does not gain access to generated vCard files
  - **User Feedback**: 
    - Success: "Configuration validated successfully"
    - Failure: "Please check your configuration details"
- **User Action**: User reviews validation results and clicks "Continue to Payment"

### 6. Payment Processing (`/payment`)
- **Payment Provider**: Stripe Checkout
- **Payment Flow**:
  - Create Stripe Checkout Session with order details
  - Redirect to Stripe hosted checkout page
  - User enters payment information (card, billing address)
  - Stripe processes payment securely
  - Redirect to confirmation page with session_id
- **Security**: No sensitive payment data stored locally, PCI compliant via Stripe
- **User Action**: User completes payment on Stripe checkout page

### 7. Payment Success (`/confirmation`)
- **Redirect**: Automatic redirect after successful payment
- **Order Details Display**:
  - Order number
  - Product details
  - Configuration summary
  - Estimated shipping timeline (15-20 business days)
  - Contact information for support
- **Email Trigger**: Automatically triggers purchase emails on page load
- **User Action**: User reviews order details

### 8. Email Notifications (via Resend)

#### 8.1 Customer Confirmation Email
- **Email Provider**: Resend API
- **Recipient**: Customer's email address
- **From Address**: `noreply@yourcompany.com` (configured in Resend)
- **Content**:
  - Order confirmation with order number
  - Product summary and configuration details
  - Shipping timeline (15-20 business days)
  - Support contact information
  - Company branding and professional styling
- **Trigger**: Sent automatically when confirmation page loads via `/api/send-purchase-emails`
- **Template**: Professional HTML email template with company branding

#### 8.2 Admin Notification Emails
- **Email Provider**: Resend API
- **Recipient**: Admin email (from `ADMIN_EMAIL` environment variable)
- **From Address**: `orders@yourcompany.com` (configured in Resend)
- **Frequency**: One email per card instance
- **Content**:
  - Customer mailing details (name, address, contact info)
  - Card particulars in text format
  - Order summary and payment details
  - Attached files:
    - Customer-uploaded images/logos
    - Generated vCard file (.vcf)
- **Trigger**: Sent for each card in the order when confirmation page loads via `/api/send-purchase-emails`
- **Template**: Admin-focused template with order processing details

## Technical Implementation Notes

### State Management
- Configuration data stored in React state during user session
- Cart data persisted in localStorage for session continuity
- Order data stored in database after payment confirmation

### Security Considerations
- vCard generation happens server-side only
- No sensitive configuration data exposed to client
- Payment processing handled entirely by Stripe (PCI compliant)
- Stripe webhook signatures verified for payment confirmation
- Resend API key stored securely in environment variables
- Admin email addresses stored as environment variables
- All email communications use verified domain in Resend

### Error Handling
- Validation failures redirect back to configuration step
- Payment failures redirect to error page with retry option
- Network errors show appropriate user-friendly messages

### File Attachments
- Customer images: Stored securely, attached to admin emails
- Generated vCards: Created server-side, attached to admin emails
- File size limits enforced for uploads

### Resend Email Configuration
- **Domain Setup**: Verify your domain in Resend dashboard
- **From Addresses**: Configure `noreply@yourdomain.com` and `orders@yourdomain.com`
- **Email Templates**: Use HTML templates with company branding
- **Delivery Tracking**: Monitor email delivery and bounce rates
- **Compliance**: Resend handles SPF, DKIM, and DMARC automatically

### Stripe Payment Configuration
- **Checkout Sessions**: Use Stripe Checkout for secure payment processing
- **Webhook Setup**: Configure webhook endpoint in Stripe dashboard
- **Payment Methods**: Accept cards, digital wallets (Apple Pay, Google Pay)
- **Security**: PCI compliance handled by Stripe
- **Testing**: Use Stripe test mode during development

## Environment Variables Required
See `.env.example` for complete configuration template.

### Stripe Configuration
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key for client-side checkout
- `STRIPE_SECRET_KEY`: Stripe secret key for server-side operations
- `STRIPE_WEBHOOK_SECRET`: Webhook secret for payment confirmation

### Resend Email Configuration
- `RESEND_API_KEY`: Resend API key for sending transactional emails
- `ADMIN_EMAIL`: Email address for admin order notifications
- `SUPPORT_EMAIL`: Email address for customer support inquiries

### Company Configuration
- `COMPANY_NAME`: Company name for email templates and branding
- `COMPANY_WEBSITE`: Company website URL
- `NETLIFY_SITE_URL`: Full URL of the deployed Netlify site

## API Endpoints (Netlify Functions)

### Core Workflow Endpoints
- `/api/validate-card`: Validates card configuration and generates vCard
- `/api/create-checkout-session`: Creates Stripe Checkout Session with order details
- `/api/send-purchase-emails`: Sends all purchase-related emails (customer confirmation and admin notifications)

### Implementation Details
- All endpoints use Netlify Functions (serverless)
- Stripe integration uses official Stripe SDK
- Resend integration uses official Resend SDK
- Email function triggered by confirmation page load (not webhook)
- Email templates support HTML formatting and attachments

## Database Schema
```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_type VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  configuration JSONB NOT NULL,
  vcard_file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## User Experience Considerations
- Clear progress indicators throughout the workflow
- Ability to save and return to configuration later
- Mobile-responsive design for all steps
- Clear error messages with actionable guidance
- Confirmation steps before irreversible actions
- Loading states during processing steps
