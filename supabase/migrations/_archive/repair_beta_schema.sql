-- COMPREHENSIVE FIX FOR BETA SCHEMA
-- Run this entire script in Supabase SQL Editor to fix the "column does not exist" error

-- 1. Add missing columns safely (Invite Token & Expiry)
DO $$
BEGIN
    -- Check and add invite_token
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beta_waitlist' AND column_name = 'invite_token') THEN
        ALTER TABLE public.beta_waitlist ADD COLUMN invite_token TEXT;
    END IF;

    -- Check and add token_expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beta_waitlist' AND column_name = 'token_expires_at') THEN
        ALTER TABLE public.beta_waitlist ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Check and add converted_at (if missing from original schema)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beta_waitlist' AND column_name = 'converted_at') THEN
        ALTER TABLE public.beta_waitlist ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Create Performance Index for Tokens
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_token ON public.beta_waitlist(invite_token);

-- 3. Reset and Fix RLS Policies
-- Access to waitlist for token validation
DROP POLICY IF EXISTS "Anon can validate invite token" ON public.beta_waitlist;
CREATE POLICY "Anon can validate invite token"
ON public.beta_waitlist
FOR SELECT
TO anon, authenticated
USING (invite_token IS NOT NULL);

-- Allow new users to update their waitlist status (mark as converted)
DROP POLICY IF EXISTS "Users can update own waitlist status" ON public.beta_waitlist;
CREATE POLICY "Users can update own waitlist status"
ON public.beta_waitlist
FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email');

-- Allow new users to insert their beta profile
DROP POLICY IF EXISTS "Users can insert own beta profile" ON public.beta_users;
CREATE POLICY "Users can insert own beta profile"
ON public.beta_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow new users to view their beta profile
DROP POLICY IF EXISTS "Users can view own beta profile" ON public.beta_users;
CREATE POLICY "Users can view own beta profile"
ON public.beta_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'beta_waitlist' 
AND column_name IN ('invite_token', 'token_expires_at');
