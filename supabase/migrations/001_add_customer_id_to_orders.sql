-- Add customer_id to orders table to link to customers table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Create index for customer_id
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Add comment
COMMENT ON COLUMN orders.customer_id IS 'References the customers table to get shipping address and other customer data';

