-- Seed data for development environment
-- This file provides sample data for testing

-- Insert sample order
INSERT INTO orders (
    id,
    stripe_session_id,
    customer_info,
    cart_data,
    status,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'cs_test_sample_session_id',
    '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"}'::jsonb,
    '[{"productType": "core", "quantity": 2, "price": 47.00}]'::jsonb,
    'completed',
    NOW() - INTERVAL '7 days'
);

-- Insert sample contact card
INSERT INTO contact_cards (
    id,
    uuid,
    order_id,
    card_data,
    s3_url,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'sample-uuid-1234',
    '00000000-0000-0000-0000-000000000001',
    '{"name": "John Doe", "email": "john@example.com", "title": "CEO", "company": "Example Corp"}'::jsonb,
    'https://example-bucket.s3.amazonaws.com/sample-uuid-1234/index.html',
    NOW() - INTERVAL '7 days'
);

-- Insert sample admin user (password: admin123)
-- Note: This is a bcrypt hash for "admin123" - DO NOT use in production
INSERT INTO admin_users (
    id,
    email,
    password_hash,
    otp_enabled,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    'admin@tagme.test',
    '$2b$10$rBV2Ifq7bFVWKbNQw8xTCOqNpjYJvF.dXFgp5i7TLLvNqR7ULmEly',
    false,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Add more sample orders for variety
INSERT INTO orders (
    stripe_session_id,
    customer_info,
    cart_data,
    status,
    created_at
) VALUES 
(
    'cs_test_sample_session_id_2',
    '{"name": "Jane Smith", "email": "jane@example.com"}'::jsonb,
    '[{"productType": "basic", "quantity": 1, "price": 40.00}]'::jsonb,
    'pending',
    NOW() - INTERVAL '2 days'
),
(
    'cs_test_sample_session_id_3',
    '{"name": "Bob Johnson", "email": "bob@example.com"}'::jsonb,
    '[{"productType": "core", "quantity": 5, "price": 47.00}, {"productType": "basic", "quantity": 3, "price": 40.00}]'::jsonb,
    'completed',
    NOW() - INTERVAL '14 days'
);

-- Insert 4 customers for initial seeding
INSERT INTO customers (
    id,
    email,
    name,
    phone,
    stripe_customer_id,
    shipping_address,
    metadata,
    created_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'alex.chen@techcorp.com',
    'Alex Chen',
    '+1-555-0101',
    'cus_alex_chen_001',
    '{"street": "123 Tech Street", "city": "San Francisco", "state": "CA", "postal": "94105", "country": "US"}'::jsonb,
    '{"company": "TechCorp", "industry": "Technology", "notes": "Early adopter"}'::jsonb,
    NOW() - INTERVAL '30 days'
),
(
    '22222222-2222-2222-2222-222222222222',
    'sarah.williams@designstudio.com',
    'Sarah Williams',
    '+1-555-0102',
    'cus_sarah_williams_002',
    '{"street": "456 Design Ave", "city": "New York", "state": "NY", "postal": "10001", "country": "US"}'::jsonb,
    '{"company": "Design Studio", "industry": "Creative", "notes": "Frequent customer"}'::jsonb,
    NOW() - INTERVAL '25 days'
),
(
    '33333333-3333-3333-3333-333333333333',
    'mike.rodriguez@consulting.com',
    'Mike Rodriguez',
    '+1-555-0103',
    'cus_mike_rodriguez_003',
    '{"street": "789 Business Blvd", "city": "Chicago", "state": "IL", "postal": "60601", "country": "US"}'::jsonb,
    '{"company": "Rodriguez Consulting", "industry": "Consulting", "notes": "Premium customer"}'::jsonb,
    NOW() - INTERVAL '20 days'
),
(
    '44444444-4444-4444-4444-444444444444',
    'emma.davis@startup.io',
    'Emma Davis',
    '+1-555-0104',
    'cus_emma_davis_004',
    '{"street": "321 Innovation Lane", "city": "Austin", "state": "TX", "postal": "73301", "country": "US"}'::jsonb,
    '{"company": "StartupIO", "industry": "Startup", "notes": "New customer"}'::jsonb,
    NOW() - INTERVAL '15 days'
);

-- Insert 2 contact cards for some customers
INSERT INTO cards (
    id,
    customer_id,
    uuid,
    card_data,
    primary_actions,
    secondary_actions,
    logo_or_header,
    has_logo,
    has_photo,
    has_cover,
    s3_base_url,
    generated_at,
    generation_status,
    created_at
) VALUES 
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'alex-chen-techcorp-001',
    '{"name": "Alex Chen", "email": "alex.chen@techcorp.com", "phone": "+1-555-0101", "title": "CTO", "company": "TechCorp", "website": "https://techcorp.com", "description": "Leading technology innovation and digital transformation initiatives.", "street": "123 Tech Street", "city": "San Francisco", "state": "CA", "postal": "94105", "country": "US", "pronouns": "he/him", "prefix": "Mr."}'::jsonb,
    '[{"name": "Email", "value": "alex.chen@techcorp.com", "color": "#007bff"}, {"name": "Call", "value": "+1-555-0101", "color": "#28a745"}, {"name": "Website", "value": "https://techcorp.com", "color": "#6f42c1"}]'::jsonb,
    '[{"name": "LinkedIn", "value": "https://linkedin.com/in/alexchen", "color": "#0077b5"}, {"name": "Twitter", "value": "https://twitter.com/alexchen", "color": "#1da1f2"}]'::jsonb,
    false,
    true,
    true,
    false,
    'http://localhost:9010/alex-chen-techcorp-001',
    NOW() - INTERVAL '25 days',
    '{"status": "success", "timestamp": "' || (NOW() - INTERVAL '25 days')::text || '"}'::jsonb,
    NOW() - INTERVAL '25 days'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'sarah-williams-design-002',
    '{"name": "Sarah Williams", "email": "sarah.williams@designstudio.com", "phone": "+1-555-0102", "title": "Creative Director", "company": "Design Studio", "website": "https://designstudio.com", "description": "Passionate about creating beautiful, functional designs that tell compelling stories.", "street": "456 Design Ave", "city": "New York", "state": "NY", "postal": "10001", "country": "US", "pronouns": "she/her", "prefix": "Ms."}'::jsonb,
    '[{"name": "Email", "value": "sarah.williams@designstudio.com", "color": "#007bff"}, {"name": "Portfolio", "value": "https://sarahwilliams.design", "color": "#e83e8c"}, {"name": "Call", "value": "+1-555-0102", "color": "#28a745"}]'::jsonb,
    '[{"name": "Instagram", "value": "https://instagram.com/sarahdesigns", "color": "#e4405f"}, {"name": "Behance", "value": "https://behance.net/sarahwilliams", "color": "#1769ff"}]'::jsonb,
    true,
    false,
    true,
    true,
    'http://localhost:9010/sarah-williams-design-002',
    NOW() - INTERVAL '20 days',
    '{"status": "success", "timestamp": "' || (NOW() - INTERVAL '20 days')::text || '"}'::jsonb,
    NOW() - INTERVAL '20 days'
);

-- Insert card assets for the generated cards
INSERT INTO card_assets (
    card_id,
    asset_type,
    s3_key,
    s3_url,
    mime_type,
    file_size,
    created_at
) VALUES 
-- Alex Chen's assets
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'html', 'alex-chen-techcorp-001/index.html', 'http://localhost:9010/alex-chen-techcorp-001/index.html', 'text/html', 15420, NOW() - INTERVAL '25 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vcf', 'alex-chen-techcorp-001/contact.vcf', 'http://localhost:9010/alex-chen-techcorp-001/contact.vcf', 'text/vcard', 1024, NOW() - INTERVAL '25 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'logo', 'alex-chen-techcorp-001/logo.png', 'http://localhost:9010/alex-chen-techcorp-001/logo.png', 'image/png', 25600, NOW() - INTERVAL '25 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'photo', 'alex-chen-techcorp-001/photo.jpg', 'http://localhost:9010/alex-chen-techcorp-001/photo.jpg', 'image/jpeg', 128000, NOW() - INTERVAL '25 days'),
-- Sarah Williams' assets
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'html', 'sarah-williams-design-002/index.html', 'http://localhost:9010/sarah-williams-design-002/index.html', 'text/html', 18240, NOW() - INTERVAL '20 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vcf', 'sarah-williams-design-002/contact.vcf', 'http://localhost:9010/sarah-williams-design-002/contact.vcf', 'text/vcard', 1156, NOW() - INTERVAL '20 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cover', 'sarah-williams-design-002/cover.jpg', 'http://localhost:9010/sarah-williams-design-002/cover.jpg', 'image/jpeg', 245760, NOW() - INTERVAL '20 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'photo', 'sarah-williams-design-002/photo.jpg', 'http://localhost:9010/sarah-williams-design-002/photo.jpg', 'image/jpeg', 156000, NOW() - INTERVAL '20 days');

-- Insert authorized admin users for Auth0 authentication
INSERT INTO admin_users_auth0 (email) VALUES 
('conniecrucil@gmail.com'),
('hello@brianbancroft.ca')
ON CONFLICT (email) DO NOTHING;
