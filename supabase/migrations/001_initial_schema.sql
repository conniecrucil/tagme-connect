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

-- Create admin_users table (for future OTP implementation)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    otp_secret TEXT,
    otp_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_cards_uuid ON contact_cards(uuid);
CREATE INDEX IF NOT EXISTS idx_contact_cards_order_id ON contact_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

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

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
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
GRANT ALL ON admin_users TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;


