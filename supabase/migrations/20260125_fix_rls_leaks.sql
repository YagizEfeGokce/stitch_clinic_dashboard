-- FIX RLS LEAKS: Restrict Profiles and Clinics Access
-- Reverting the "Authenticated users can view all" policy which caused data leaks.

-- 1. Profiles Table RLS Fix
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles from their own clinic"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);

-- 2. Clinics Table RLS Fix
DROP POLICY IF EXISTS "Authenticated users can view all clinics" ON public.clinics;

CREATE POLICY "Users can view their own clinic"
ON public.clinics
FOR SELECT
TO authenticated
USING (
    id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    OR 
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);
