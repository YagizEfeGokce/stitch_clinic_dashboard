-- ============================================================================
-- ADD MISSING COLUMNS (Fixing Onboarding & Config Issues)
-- ============================================================================

-- 1. Add 'has_completed_onboarding' to 'profiles'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- 2. Add 'branding_config', 'settings_config', 'updated_at' to 'clinics'
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS settings_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 3. Update RLS policies if necessary (Optional checking)
-- Existing policies on clinics and profiles allow update by owner/self, 
-- which should cover these new columns automatically.
