-- ============================================================================
-- FIX: Service Materials & Appointment Materials RLS Permissions
-- ============================================================================
-- Run this in Supabase SQL Editor to fix "permission denied" errors
-- ============================================================================

-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Service Materials SELECT" ON public.service_materials;
DROP POLICY IF EXISTS "Service Materials INSERT" ON public.service_materials;
DROP POLICY IF EXISTS "Service Materials UPDATE" ON public.service_materials;
DROP POLICY IF EXISTS "Service Materials DELETE" ON public.service_materials;

DROP POLICY IF EXISTS "Appointment Materials SELECT" ON public.appointment_materials;
DROP POLICY IF EXISTS "Appointment Materials INSERT" ON public.appointment_materials;
DROP POLICY IF EXISTS "Appointment Materials UPDATE" ON public.appointment_materials;
DROP POLICY IF EXISTS "Appointment Materials DELETE" ON public.appointment_materials;

-- ============================================================================
-- First, let's check if get_my_clinic_id() is working correctly
-- If not, we'll use a direct subquery approach
-- ============================================================================

-- SERVICE_MATERIALS - Using direct profile lookup instead of function
CREATE POLICY "Service Materials SELECT" ON public.service_materials
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Service Materials INSERT" ON public.service_materials
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR clinic_id IS NULL
    );

CREATE POLICY "Service Materials UPDATE" ON public.service_materials
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Service Materials DELETE" ON public.service_materials
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- APPOINTMENT_MATERIALS - Using direct profile lookup instead of function
CREATE POLICY "Appointment Materials SELECT" ON public.appointment_materials
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Appointment Materials INSERT" ON public.appointment_materials
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR clinic_id IS NULL
    );

CREATE POLICY "Appointment Materials UPDATE" ON public.appointment_materials
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Appointment Materials DELETE" ON public.appointment_materials
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- Grant table permissions to authenticated users
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_materials TO authenticated;

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================

ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE - Refresh the page and try again
-- ============================================================================
