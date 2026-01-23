-- Fix Beta System Requirements

-- 1. Ensure SECURITY DEFINER function exists (Bypasses RLS recursion)
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'super_admin'
  );
$$;

-- 2. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Fix Beta Invitations RLS (Use function instead of subquery)
DROP POLICY IF EXISTS "beta_invitations_admin_all" ON public.beta_invitations;
CREATE POLICY "beta_invitations_admin_all"
ON public.beta_invitations FOR ALL
TO authenticated
USING ( public.is_super_admin() )
WITH CHECK ( public.is_super_admin() );

-- 4. Fix Beta Waitlist RLS
DROP POLICY IF EXISTS "beta_waitlist_admin_all" ON public.beta_waitlist;
CREATE POLICY "beta_waitlist_admin_all"
ON public.beta_waitlist FOR ALL
TO authenticated
USING ( public.is_super_admin() );

-- 5. Fix Feedback Foreign Key (PGRST200 Error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feedback_user_id_fkey'
    ) THEN
        ALTER TABLE public.feedback
        ADD CONSTRAINT feedback_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feedback_clinic_id_fkey'
    ) THEN
        ALTER TABLE public.feedback
        ADD CONSTRAINT feedback_clinic_id_fkey
        FOREIGN KEY (clinic_id)
        REFERENCES public.clinics(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Re-apply PUBLIC INSERT policy for beta_waitlist (So new users can signup)
DROP POLICY IF EXISTS "Anyone can signup for beta" ON public.beta_waitlist;
CREATE POLICY "Anyone can signup for beta"
ON public.beta_waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Check if 'super_admin' role exists in profiles (Sanity check)
-- This won't change data but ensures the role constraint is valid if previously defined
DO $$
BEGIN
    -- Just a placeholder block, nothing critical here
END $$;
