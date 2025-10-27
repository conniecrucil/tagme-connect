-- ============================================================================
-- Complete Database Schema Migration
-- ============================================================================
-- This migration creates the complete database schema for TagMe Connect.
-- Run this entire file in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- Part 1: Initial Schema (orders, contact_cards, admin_users)
-- ============================================================================

-- Enable UUID extension (using postgres superuser)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_info JSONB NOT NULL,
    cart_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_cards table
CREATE TABLE IF NOT EXISTS contact_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    card_data JSONB,
    s3_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_cards_uuid ON contact_cards(uuid);
CREATE INDEX IF NOT EXISTS idx_contact_cards_order_id ON contact_cards(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create anon role for PostgREST
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;

-- Grant permissions to anon role (read-only for now)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON orders TO anon;
GRANT SELECT ON contact_cards TO anon;

-- Create service_role for backend operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;

-- Grant full permissions to service_role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON orders TO service_role;
GRANT ALL ON contact_cards TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- Part 2: Customer and Card Models
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

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    uuid TEXT UNIQUE NOT NULL,
    card_data JSONB NOT NULL,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_cards_customer_id ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_cards_uuid ON cards(uuid);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at);
CREATE INDEX IF NOT EXISTS idx_cards_generation_status ON cards USING GIN(generation_status);
CREATE INDEX IF NOT EXISTS idx_cards_card_data ON cards USING GIN(card_data);

CREATE INDEX IF NOT EXISTS idx_card_assets_card_id ON card_assets(card_id);
CREATE INDEX IF NOT EXISTS idx_card_assets_asset_type ON card_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_card_assets_created_at ON card_assets(created_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to existing roles
GRANT ALL ON customers TO service_role;
GRANT ALL ON cards TO service_role;
GRANT ALL ON card_assets TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant read-only permissions to anon role
GRANT SELECT ON customers TO anon;
GRANT SELECT ON cards TO anon;
GRANT SELECT ON card_assets TO anon;

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer information including Stripe integration and shipping details';
COMMENT ON TABLE cards IS 'Contact cards with all form data and generation status tracking';
COMMENT ON TABLE card_assets IS 'Individual assets (images, HTML, VCF) associated with each card';

COMMENT ON COLUMN customers.email IS 'Primary customer identifier, must be unique';
COMMENT ON COLUMN customers.stripe_customer_id IS 'Stripe customer ID for payment tracking';
COMMENT ON COLUMN customers.shipping_address IS 'JSON object with street, city, state, postal, country';
COMMENT ON COLUMN customers.metadata IS 'Flexible storage for additional customer data';

COMMENT ON COLUMN cards.uuid IS 'Folder ID used in S3 storage, must be unique';
COMMENT ON COLUMN cards.card_data IS 'All form fields: name, title, company, phone, email, website, description, address fields, pronouns, prefix';
COMMENT ON COLUMN cards.primary_actions IS 'Ordered array of primary action objects';
COMMENT ON COLUMN cards.secondary_actions IS 'Ordered array of secondary action objects';
COMMENT ON COLUMN cards.logo_or_header IS 'TRUE for cover photo header, FALSE for logo header';
COMMENT ON COLUMN cards.generation_status IS 'JSON object with status (success/error/pending), error message, and timestamp';
COMMENT ON COLUMN cards.s3_base_url IS 'Base URL for accessing card assets in S3';

COMMENT ON COLUMN card_assets.asset_type IS 'Type of asset: logo, photo, cover, html, or vcf';
COMMENT ON COLUMN card_assets.s3_key IS 'Full S3 key/path for the asset';
COMMENT ON COLUMN card_assets.s3_url IS 'Public URL for accessing the asset';

-- ============================================================================
-- Part 3: Admin Users Auth0
-- ============================================================================

-- Create admin_users_auth0 table
CREATE TABLE IF NOT EXISTS admin_users_auth0 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_auth0_email ON admin_users_auth0(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth0_created_at ON admin_users_auth0(created_at);

-- Add trigger for updated_at column
CREATE TRIGGER update_admin_users_auth0_updated_at
    BEFORE UPDATE ON admin_users_auth0
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON admin_users_auth0 TO service_role;
GRANT SELECT ON admin_users_auth0 TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Add comments for documentation
COMMENT ON TABLE admin_users_auth0 IS 'Authorized admin users based on email addresses for Auth0 authentication';
COMMENT ON COLUMN admin_users_auth0.email IS 'Email address of authorized admin user (must match Auth0 email)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration creates all tables, indexes, triggers, and permissions
-- needed for the TagMe Connect application.
-- ============================================================================
