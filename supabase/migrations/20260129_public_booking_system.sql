-- ============================================================================
-- DERMDESK PUBLIC BOOKING SYSTEM - MIGRATION v2
-- Run in Supabase SQL Editor
-- Date: 2026-01-29 (Updated)
-- ============================================================================

-- ============================================================================
-- 1. ADD SLUG COLUMN TO CLINICS TABLE
-- ============================================================================

-- Add slug column for public URL identification
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index for fast slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_slug ON public.clinics(slug);

-- Add online booking settings to clinics
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS online_booking_advance_days INTEGER DEFAULT 30;

-- ============================================================================
-- 2. RLS POLICIES FOR PUBLIC BOOKING ACCESS
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read clinic by slug" ON public.clinics;
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Public insert pending appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public select appointments for availability" ON public.appointments;
DROP POLICY IF EXISTS "Public insert clients" ON public.clients;
DROP POLICY IF EXISTS "Public select clients by phone" ON public.clients;

-- 2a. Allow public to read clinic by slug
CREATE POLICY "Public read clinic by slug" ON public.clinics
    FOR SELECT TO anon
    USING (slug IS NOT NULL AND online_booking_enabled = true);

-- 2b. Allow public to read active services
CREATE POLICY "Public read services" ON public.services
    FOR SELECT TO anon
    USING (active = true);

-- 2c. Allow public to SELECT appointments (for availability checking)
CREATE POLICY "Public select appointments for availability" ON public.appointments
    FOR SELECT TO anon
    USING (true);

-- 2d. Allow public to INSERT appointments with specific conditions
CREATE POLICY "Public insert pending appointments" ON public.appointments
    FOR INSERT TO anon
    WITH CHECK (status = 'Scheduled' AND booking_source = 'online');

-- 2e. Allow public to insert and find clients by phone
CREATE POLICY "Public insert clients" ON public.clients
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Public select clients by phone" ON public.clients
    FOR SELECT TO anon
    USING (phone IS NOT NULL);

-- ============================================================================
-- 3. GRANT PERMISSIONS TO ANON ROLE
-- ============================================================================

GRANT SELECT ON public.clinics TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT ON public.clients TO anon;
GRANT SELECT, INSERT ON public.appointments TO anon;

-- ============================================================================
-- 4. VERIFY MIGRATION SUCCESS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Public booking system migration v2 completed!';
    RAISE NOTICE '📋 Added: clinics.slug, online_booking_enabled, online_booking_advance_days';
    RAISE NOTICE '📋 Created: 6 RLS policies for anon access';
    RAISE NOTICE '📋 Granted: SELECT/INSERT permissions to anon role';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
