-- Add payment fields to the orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR,
ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2);

-- Note: 
-- Valid payment_status values: 'pending', 'paid', 'failed'
-- Valid payment_method values: 'cash', 'momo', 'card'
