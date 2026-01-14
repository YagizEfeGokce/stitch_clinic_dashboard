-- ============================================================================
-- FIX DB RECURSION (Timeout/Connection Unstable Fix)
-- ============================================================================

-- The previous "Connection unstable" / TIMEOUT errors are caused by an infinite loop
-- in the Database Permissions (RLS). 
-- Logic: get_my_clinic_id() reads 'profiles' -> 'profiles' policy calls get_my_clinic_id() -> Loop.

-- 1. Fix PROFILES Policies (Breaking the loop)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially recursive policies
DROP POLICY IF EXISTS "Users can view members of own clinic" ON public.profiles;
DROP POLICY IF EXISTS "View Colleagues" ON public.profiles;
DROP POLICY IF EXISTS "View Own Profile" ON public.profiles;

-- Policy A: View Own Profile (ANCHOR)
-- Allows reading your own row based solely on ID. NO recursion.
CREATE POLICY "View Own Profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- Policy B: View Colleagues
-- Uses a subquery that succeeds thanks to Policy A.
CREATE POLICY "View Colleagues" ON public.profiles
    FOR SELECT USING (
        clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    );

-- 2. Update Helper Function
-- Make it SECURITY DEFINER to be extra safe (runs with owner privileges)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Re-apply CLIENTS Policies (Using the now-safe function)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant View Clients" ON public.clients;
CREATE POLICY "Tenant View Clients" ON public.clients
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Clients" ON public.clients;
CREATE POLICY "Tenant Manage Clients" ON public.clients
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 4. Re-apply APPOINTMENTS Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant View Appointments" ON public.appointments;
CREATE POLICY "Tenant View Appointments" ON public.appointments
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

DROP POLICY IF EXISTS "Tenant Manage Appointments" ON public.appointments;
CREATE POLICY "Tenant Manage Appointments" ON public.appointments
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';
