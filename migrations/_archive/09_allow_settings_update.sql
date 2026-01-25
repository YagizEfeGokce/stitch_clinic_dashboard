-- ============================================================================
-- ENABLE SETTINGS UPDATES (RLS POLICY FIX)
-- ============================================================================

-- 1. Ensure RLS is active
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own clinic" ON public.clinics;
DROP POLICY IF EXISTS "users_update_own_clinic" ON public.clinics;

-- 3. Create Secure Update Policy
-- Allows update if the user is linked to the clinic via profiles
CREATE POLICY "users_update_own_clinic" ON public.clinics
FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    id IN (
        SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload config';
