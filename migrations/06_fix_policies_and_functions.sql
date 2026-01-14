-- ============================================================================
-- FIX POLICIES & FUNCTIONS (v3)
-- Ensures helper functions exist and policies are non-recursive.
-- ============================================================================

-- 1. Helper Function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  -- Access profiles directly; effectively bypasses RLS due to SECURITY DEFINER
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Profiles Policies (Avoid Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of own clinic" ON public.profiles;
-- We use a direct subquery instead of the function here to be explicit, 
-- or we can use the function since it is SECURITY DEFINER.
-- Let's use the function for consistency, assuming it works as intended.
CREATE POLICY "Users can view members of own clinic" ON public.profiles
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- 3. Clients Policies (Fix for reported 42601 error and ensure access)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant View Clients" ON public.clients;
CREATE POLICY "Tenant View Clients" ON public.clients
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Clients" ON public.clients;
CREATE POLICY "Tenant Manage Clients" ON public.clients
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 4. Appointments Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant View Appointments" ON public.appointments;
CREATE POLICY "Tenant View Appointments" ON public.appointments
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Appointments" ON public.appointments;
CREATE POLICY "Tenant Manage Appointments" ON public.appointments
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 5. Services Policies (Ensure table exists first just in case)
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

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant View Services" ON public.services;
CREATE POLICY "Tenant View Services" ON public.services
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Services" ON public.services;
CREATE POLICY "Tenant Manage Services" ON public.services
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 6. Reload Config
NOTIFY pgrst, 'reload config';
