-- ============================================================================
-- FORCE SYNC: Apply Master Schema Changes Safely
-- This script applies the changes from 00_master_schema.sql to an existing DB.
-- ============================================================================

-- 1. FIX TABLE NAMES (Patients -> Clients)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
            ALTER TABLE public.patients RENAME TO clients;
        END IF;
    END IF;
END $$;

-- 2. CREATE MISSING TABLES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    active BOOLEAN DEFAULT TRUE
);

-- 3. ADD MISSING COLUMNS
-- Clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS settings_config JSONB DEFAULT '{}';

-- Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
-- Fix: Rename patient_id to client_id if needed
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id') THEN
        ALTER TABLE public.appointments RENAME COLUMN patient_id TO client_id;
    END IF;
END $$;

-- Transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'related_patient_id') THEN
        ALTER TABLE public.transactions RENAME COLUMN related_patient_id TO client_id;
    END IF;
END $$;

-- 4. FIX POLICIES (Drop and Recreate to be sure)
-- Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant View Patients" ON public.clients;
DROP POLICY IF EXISTS "Tenant View Clients" ON public.clients;
CREATE POLICY "Tenant View Clients" ON public.clients FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Patients" ON public.clients; 
DROP POLICY IF EXISTS "Tenant Manage Clients" ON public.clients;
CREATE POLICY "Tenant Manage Clients" ON public.clients FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant View Services" ON public.services;
CREATE POLICY "Tenant View Services" ON public.services FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Services" ON public.services;
CREATE POLICY "Tenant Manage Services" ON public.services FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- Appointments (Drop old patient policies)
DROP POLICY IF EXISTS "Tenant View/Edit Appointments" ON public.appointments; -- Old name
DROP POLICY IF EXISTS "Tenant Add Appointments" ON public.appointments; -- Old name
DROP POLICY IF EXISTS "Tenant Update Appointments" ON public.appointments; -- Old name
DROP POLICY IF EXISTS "Owner Delete Appointments" ON public.appointments; -- Old name

CREATE POLICY "Tenant View Appointments" ON public.appointments FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Appointments" ON public.appointments FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 5. RELOAD CONFIG
NOTIFY pgrst, 'reload config';
