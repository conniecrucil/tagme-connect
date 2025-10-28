-- ============================================================================
-- Initial Database Schema for TagMe Connect
-- ============================================================================
-- This migration creates the complete database schema from scratch.
-- Run this entire file in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- Part 1: Enable Extensions and Set Up Roles
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create anon role for PostgREST (read-only access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;

-- Create service_role for backend operations (full access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;

-- ============================================================================
-- Part 2: Orders Table
-- ============================================================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_info JSONB NOT NULL,
    cart_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    shipped BOOLEAN DEFAULT FALSE,
    fulfilled BOOLEAN DEFAULT FALSE,
    stripe_receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_shipped ON orders(shipped);
CREATE INDEX IF NOT EXISTS idx_orders_fulfilled ON orders(fulfilled);

-- Add trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for orders table
COMMENT ON TABLE orders IS 'Customer orders from the shopping cart and checkout process';
COMMENT ON COLUMN orders.stripe_session_id IS 'Unique Stripe checkout session identifier';
COMMENT ON COLUMN orders.customer_info IS 'Customer contact and shipping information';
COMMENT ON COLUMN orders.cart_data IS 'Items in the cart when order was placed';
COMMENT ON COLUMN orders.status IS 'Order status: pending, completed, cancelled, etc.';
COMMENT ON COLUMN orders.shipped IS 'Whether the order has been shipped';
COMMENT ON COLUMN orders.fulfilled IS 'Whether the order has been fulfilled';
COMMENT ON COLUMN orders.stripe_receipt_url IS 'URL to the Stripe receipt';

-- ============================================================================
-- Part 3: Customers Table
-- ============================================================================

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    stripe_customer_id TEXT UNIQUE,
    shipping_address JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Add trigger for updated_at on customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for customers table
COMMENT ON TABLE customers IS 'Customer information including Stripe integration and shipping details';
COMMENT ON COLUMN customers.email IS 'Primary customer identifier, must be unique';
COMMENT ON COLUMN customers.stripe_customer_id IS 'Stripe customer ID for payment tracking';
COMMENT ON COLUMN customers.shipping_address IS 'JSON object with street, city, state, postal, country';
COMMENT ON COLUMN customers.metadata IS 'Flexible storage for additional customer data';

-- ============================================================================
-- Part 4: Cards Table
-- ============================================================================

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    uuid TEXT UNIQUE NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'core' CHECK (card_type IN ('basic', 'core')),
    card_data JSONB NOT NULL,
    website_url TEXT,
    design_file_url TEXT,
    primary_actions JSONB DEFAULT '[]'::jsonb,
    secondary_actions JSONB DEFAULT '[]'::jsonb,
    logo_or_header BOOLEAN DEFAULT FALSE,
    has_logo BOOLEAN DEFAULT FALSE,
    has_photo BOOLEAN DEFAULT FALSE,
    has_cover BOOLEAN DEFAULT FALSE,
    s3_base_url TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    generation_status JSONB DEFAULT '{"status": "pending", "timestamp": ""}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cards
CREATE INDEX IF NOT EXISTS idx_cards_customer_id ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_order_id ON cards(order_id);
CREATE INDEX IF NOT EXISTS idx_cards_uuid ON cards(uuid);
CREATE INDEX IF NOT EXISTS idx_cards_card_type ON cards(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_website_url ON cards(website_url) WHERE website_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at);
CREATE INDEX IF NOT EXISTS idx_cards_generation_status ON cards USING GIN(generation_status);
CREATE INDEX IF NOT EXISTS idx_cards_card_data ON cards USING GIN(card_data);

-- Add trigger for updated_at on cards
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for cards table
COMMENT ON TABLE cards IS 'Contact cards with all form data and generation status tracking';
COMMENT ON COLUMN cards.customer_id IS 'Links card to customer who owns it';
COMMENT ON COLUMN cards.order_id IS 'Links card to the order it was purchased in';
COMMENT ON COLUMN cards.uuid IS 'Folder ID used in S3 storage, must be unique';
COMMENT ON COLUMN cards.card_type IS 'Type of card: basic (website redirect only) or core (full contact information)';
COMMENT ON COLUMN cards.card_data IS 'All form fields: name, title, company, phone, email, website, description, address fields, pronouns, prefix';
COMMENT ON COLUMN cards.website_url IS 'URL for basic card redirects';
COMMENT ON COLUMN cards.design_file_url IS 'Location of design file for the card';
COMMENT ON COLUMN cards.primary_actions IS 'Ordered array of primary action objects';
COMMENT ON COLUMN cards.secondary_actions IS 'Ordered array of secondary action objects';
COMMENT ON COLUMN cards.logo_or_header IS 'TRUE for cover photo header, FALSE for logo header';
COMMENT ON COLUMN cards.generation_status IS 'JSON object with status (success/error/pending), error message, and timestamp';
COMMENT ON COLUMN cards.s3_base_url IS 'Base URL for accessing card assets in S3';

-- ============================================================================
-- Part 5: Card Assets Table
-- ============================================================================

-- Create card_assets table for detailed asset tracking
CREATE TABLE IF NOT EXISTS card_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'photo', 'cover', 'html', 'vcf')),
    s3_key TEXT NOT NULL,
    s3_url TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for card_assets
CREATE INDEX IF NOT EXISTS idx_card_assets_card_id ON card_assets(card_id);
CREATE INDEX IF NOT EXISTS idx_card_assets_asset_type ON card_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_card_assets_created_at ON card_assets(created_at);

-- Add comments for card_assets table
COMMENT ON TABLE card_assets IS 'Individual assets (images, HTML, VCF) associated with each card';
COMMENT ON COLUMN card_assets.asset_type IS 'Type of asset: logo implies cover photo header, logo header, or cover photo';
COMMENT ON COLUMN card_assets.s3_key IS 'Full S3 key/path for the asset';
COMMENT ON COLUMN card_assets.s3_url IS 'Public URL for accessing the asset';

-- ============================================================================
-- Part 6: Admin Users Auth0 Table
-- ============================================================================

-- Create admin_users_auth0 table
CREATE TABLE IF NOT EXISTS admin_users_auth0 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_users_auth0
CREATE INDEX IF NOT EXISTS idx_admin_users_auth0_email ON admin_users_auth0(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth0_created_at ON admin_users_auth0(created_at);

-- Add trigger for updated_at on admin_users_auth0
CREATE TRIGGER update_admin_users_auth0_updated_at
    BEFORE UPDATE ON admin_users_auth0
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for admin_users_auth0 table
COMMENT ON TABLE admin_users_auth0 IS 'Authorized admin users based on email addresses for Auth0 authentication';
COMMENT ON COLUMN admin_users_auth0.email IS 'Email address of authorized admin user (must match Auth0 email)';

-- ============================================================================
-- Part 7: Grant Permissions
-- ============================================================================

-- Grant permissions to anon role (read-only)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON orders TO anon;
GRANT SELECT ON customers TO anon;
GRANT SELECT ON cards TO anon;
GRANT SELECT ON card_assets TO anon;
GRANT SELECT ON admin_users_auth0 TO anon;

-- Grant permissions to service_role (full access)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON orders TO service_role;
GRANT ALL ON customers TO service_role;
GRANT ALL ON cards TO service_role;
GRANT ALL ON card_assets TO service_role;
GRANT ALL ON admin_users_auth0 TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration creates all tables, indexes, triggers, and permissions
-- needed for the TagMe Connect application.
-- ============================================================================
