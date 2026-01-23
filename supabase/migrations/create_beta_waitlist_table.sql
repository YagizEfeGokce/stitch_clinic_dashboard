-- Beta Waitlist Table for Dermdesk
-- Run this in Supabase SQL Editor

-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS public.beta_waitlist CASCADE;

-- Create beta_waitlist table
CREATE TABLE public.beta_waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Clinic info
    clinic_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    current_system TEXT,
    
    -- Referral system
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    approved_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Metadata
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- Enable RLS
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (public signup - most important!)
CREATE POLICY "Anyone can signup for beta"
ON public.beta_waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Anyone can SELECT (needed for counting position)
CREATE POLICY "Anyone can view waitlist count"
ON public.beta_waitlist FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Super admin can update (for approving/rejecting)
CREATE POLICY "Super admin can update waitlist"
ON public.beta_waitlist FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Policy: Super admin can delete
CREATE POLICY "Super admin can delete from waitlist"
ON public.beta_waitlist FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_email ON public.beta_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_referral_code ON public.beta_waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_referred_by ON public.beta_waitlist(referred_by);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_created_at ON public.beta_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_status ON public.beta_waitlist(status);

-- Function to count referrals for a given code
CREATE OR REPLACE FUNCTION get_referral_count(ref_code TEXT)
RETURNS INT AS $$
    SELECT COUNT(*)::INT
    FROM public.beta_waitlist
    WHERE referred_by = ref_code;
$$ LANGUAGE sql STABLE;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.beta_waitlist TO anon;
GRANT ALL ON public.beta_waitlist TO authenticated;
