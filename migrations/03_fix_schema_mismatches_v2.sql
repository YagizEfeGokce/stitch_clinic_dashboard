-- ============================================================================
-- FIX SCHEMA MISMATCHES V2 (Safe/Idempotent)
-- ============================================================================

-- 1. Handle PATIENTS conflict
-- If 'patients' exists, we want to rename it to 'clients'. 
-- BUT if 'clients' already exists, we assume 'patients' is redundant or the rename already happened partially.
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
            -- Conflict: Both exist. We drop 'patients' to avoid confusion, assuming 'clients' is the desired state.
            DROP TABLE public.patients CASCADE;
        ELSE
            -- Clean rename
            ALTER TABLE public.patients RENAME TO clients;
        END IF;
    END IF;
END $$;

-- Fix indexes if they didn't rename automatically or if we dropped patients
ALTER INDEX IF EXISTS idx_patients_clinic_id RENAME TO idx_clients_clinic_id;

-- 2. Rename Columns in Appointments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id') THEN
        ALTER TABLE public.appointments RENAME COLUMN patient_id TO client_id;
    END IF;
END $$;

-- 3. Rename Columns in Transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'related_patient_id') THEN
        ALTER TABLE public.transactions RENAME COLUMN related_patient_id TO client_id;
    END IF;
END $$;

-- 4. Create SERVICES Table
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

DROP POLICY IF EXISTS "Tenant View Services" ON public.services;
CREATE POLICY "Tenant View Services" ON public.services
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Services" ON public.services;
CREATE POLICY "Tenant Manage Services" ON public.services
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON public.services(clinic_id);

-- 5. Link Appointments to Services
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'service_id') THEN
        ALTER TABLE public.appointments ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
