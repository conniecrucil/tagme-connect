-- Migration: Add admin_users_auth0 table for Auth0-based admin management
-- This table stores which email addresses are authorized to access the admin panel

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
