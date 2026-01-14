-- ============================================================================
-- FIX SCHEMA MISMATCHES (Sync DB with Code)
-- ============================================================================

-- 1. Rename PATIENTS -> CLIENTS
-- Code consistently uses 'clients', database has 'patients'.
ALTER TABLE public.patients RENAME TO clients;

-- Rename indexes for consistency
ALTER INDEX IF EXISTS idx_patients_clinic_id RENAME TO idx_clients_clinic_id;

-- 2. Rename Columns in Related Tables
-- appointments: patient_id -> client_id
ALTER TABLE public.appointments 
RENAME COLUMN patient_id TO client_id;

-- transactions: related_patient_id -> client_id
ALTER TABLE public.transactions 
RENAME COLUMN related_patient_id TO client_id;

-- Rename indexes for consistency
ALTER INDEX IF EXISTS idx_appointments_patient_id RENAME TO idx_appointments_client_id;


-- 3. Create SERVICES Table
-- Code expects this table for appointments
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0,
    color TEXT DEFAULT '#3b82f6', -- Blue-500 default
    active BOOLEAN DEFAULT TRUE
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant View Services" ON public.services
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Tenant Manage Services" ON public.services
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON public.services(clinic_id);


-- 4. Link Appointments to Services
-- Add service_id to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);

-- 5. Fix Policies on 'clients' (was patients)
-- The table rename might preserve policies, but we should verify names if we want to be clean.
-- Postgres usually handles the table rename in policies automatically, so strictly speaking
-- we don't NEED to drop and recreate unless we want to rename the policy strings themselves.
-- We will leave them as is to minimize risk, they will just refer to 'clients' now.

