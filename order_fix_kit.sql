-- EMERGENCY REPAIR KIT: Order Cancellation Support
-- Run this in your Supabase SQL Editor to enable cancellation features.

-- 1. Add missing columns to 'orders' table if they don't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sub_status TEXT;

-- 2. Update the status check constraint to allowed 'cancelled'
-- Note: We try to drop the old constraint first. Usually it's named 'orders_status_check'
DO $$ 
BEGIN 
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'accepted', 'in_progress', 'active', 'completed', 'cancelled', 'scheduled'));

-- 3. Ensure RLS allows users to cancel their own orders
-- We make sure UPDATE is allowed for the owner
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.orders.cancelled_at IS 'Timestamp when the order was cancelled by user or system';
