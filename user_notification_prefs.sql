-- ============================================================
-- BorlaWura: User Notification Preferences Table Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the user_notification_prefs table
CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    order_updates BOOLEAN DEFAULT true,
    rider_arrival BOOLEAN DEFAULT true,
    rider_nearby BOOLEAN DEFAULT true,
    pickup_confirmed BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Setup Security (Row Level Security - RLS)
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

-- Users can only select and manage their own preferences
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.user_notification_prefs;
CREATE POLICY "Users can manage their own notification preferences" 
ON public.user_notification_prefs 
FOR ALL 
USING (auth.uid() = user_id);

-- 3. Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on the table
DROP TRIGGER IF EXISTS update_user_notification_prefs_updated_at ON public.user_notification_prefs;
CREATE TRIGGER update_user_notification_prefs_updated_at
    BEFORE UPDATE ON public.user_notification_prefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
