-- ============================================================================
-- SAAS SUBSCRIPTION SETUP
-- Description: Adds subscription fields to clinics table and updates new user trigger
-- ============================================================================

-- 1. Add Subscription Columns to Clinics Table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE_TRIAL', -- FREE_TRIAL, STARTER, PRO, ENTERPRISE
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',   -- active, past_due, canceled, trialing
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- 2. Update the 'handle_new_user' generic function to ensure new clinics get a trial
-- Note: The existing handle_new_user in master_schema_v2 might need this logic explicitly if not using defaults.
-- Since we added DEFAULTs above, the existing function will automatically pick them up.
-- However, let's be explicit in case logic changes.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
BEGIN
    -- Create a new clinic for the user
    INSERT INTO public.clinics (name, subscription_tier, subscription_status, trial_ends_at) 
    VALUES (
        COALESCE(new.raw_user_meta_data->>'clinic_name', 'My New Clinic'),
        'FREE_TRIAL',
        'trialing',
        now() + interval '14 days'
    )
    RETURNING id INTO new_clinic_id;

    -- Add user as owner
    INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        new_clinic_id,
        new.raw_user_meta_data->>'full_name', 
        'owner',
        new.raw_user_meta_data->>'avatar_url'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
