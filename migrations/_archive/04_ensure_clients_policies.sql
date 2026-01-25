-- ============================================================================
-- VERIFY AND FIX CLIENTS TABLE POLICIES & RELATIONSHIPS
-- ============================================================================

-- 1. Ensure RLS is enabled on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2. Re-create policies for clients to be sure
-- We assume clinic_id is the tenant key
DROP POLICY IF EXISTS "Tenant View Clients" ON public.clients;
CREATE POLICY "Tenant View Clients" ON public.clients
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Clients" ON public.clients
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 3. Verify Appointments FK
-- Ensure the FK exists and is named correctly for PostgREST detection
DO $$
BEGIN
    -- If constraint doesn't exist, create it
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_client_id_fkey') THEN
        ALTER TABLE public.appointments
        DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey; -- Remove old if exists
        
        ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES public.clients(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Reload Schema Cache (Not standard SQL, but Supabase functionality via UI usually handles this. 
-- Changing schema via DDL should trigger it).
NOTIFY pgrst, 'reload config';
