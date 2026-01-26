-- FIX: Add missing columns to feedback table
-- The previous migration used "CREATE TABLE IF NOT EXISTS", which skipped adding columns if the table already existed.
-- This script explicitly ensures all required columns are present.

ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Notify Supabase to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
