-- Enable GOD MODE for Super Admins on critical tables
-- This ensures 'super_admin' role can SELECT/INSERT/UPDATE/DELETE rows from ANY clinic.

-- Helper to check if user is super_admin
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

-- 1. Transactions
DROP POLICY IF EXISTS "Super Admins can do everything on transactions" ON public.transactions;
CREATE POLICY "Super Admins can do everything on transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 2. Appointments
DROP POLICY IF EXISTS "Super Admins can do everything on appointments" ON public.appointments;
CREATE POLICY "Super Admins can do everything on appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 3. Clients
DROP POLICY IF EXISTS "Super Admins can do everything on clients" ON public.clients;
CREATE POLICY "Super Admins can do everything on clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 4. Inventory
DROP POLICY IF EXISTS "Super Admins can do everything on inventory" ON public.inventory;
CREATE POLICY "Super Admins can do everything on inventory"
ON public.inventory
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 5. Clinics (Super Admin needs to see ALL clinics)
DROP POLICY IF EXISTS "Super Admins can see all clinics" ON public.clinics;
CREATE POLICY "Super Admins can see all clinics"
ON public.clinics
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 6. Profiles
DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 7. Feedback
DROP POLICY IF EXISTS "Super Admins can manage feedback" ON public.feedback;
CREATE POLICY "Super Admins can manage feedback"
ON public.feedback
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());
