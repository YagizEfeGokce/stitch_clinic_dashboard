-- ============================================================================
-- SECURE DELETE PERMISSIONS MIGRATION
-- Purpose: Restrict DELETE operations to Owners, Admins, and Doctors only.
--          Staff members should only be able to View, Create, and Update.
-- ============================================================================

-- 1. Create Helper Function for Role Checking
-- Uses SECURITY DEFINER to bypass RLS on profiles during the check
CREATE OR REPLACE FUNCTION public.current_user_can_delete()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin', 'doctor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Update Policies for CRITICAL Tables

-- INVENTORY
DROP POLICY IF EXISTS "Inventory Isolation" ON public.inventory;
CREATE POLICY "Inventory View" ON public.inventory FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Inventory Insert" ON public.inventory FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Inventory Update" ON public.inventory FOR UPDATE USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Inventory Delete" ON public.inventory FOR DELETE USING (
    clinic_id = public.get_my_clinic_id() 
    AND public.current_user_can_delete()
);

-- CLIENTS
DROP POLICY IF EXISTS "Clients Isolation" ON public.clients;
CREATE POLICY "Clients View" ON public.clients FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Clients Insert" ON public.clients FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Clients Update" ON public.clients FOR UPDATE USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Clients Delete" ON public.clients FOR DELETE USING (
    clinic_id = public.get_my_clinic_id() 
    AND public.current_user_can_delete()
);

-- SERVICES
DROP POLICY IF EXISTS "Services Isolation" ON public.services;
CREATE POLICY "Services View" ON public.services FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Services Insert" ON public.services FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Services Update" ON public.services FOR UPDATE USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Services Delete" ON public.services FOR DELETE USING (
    clinic_id = public.get_my_clinic_id() 
    AND public.current_user_can_delete()
);

-- APPOINTMENTS (Staff usually need to cancel, not assume delete? Assuming Cancel = Update Status)
-- If hard delete is allowed, it should be restricted.
DROP POLICY IF EXISTS "Appointments Isolation" ON public.appointments;
CREATE POLICY "Appointments View" ON public.appointments FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Appointments Insert" ON public.appointments FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Appointments Update" ON public.appointments FOR UPDATE USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Appointments Delete" ON public.appointments FOR DELETE USING (
    clinic_id = public.get_my_clinic_id() 
    AND public.current_user_can_delete()
);

-- Note: Staff Availability, Transactions, etc. can remain as is for now or improved later.
-- Transactions generally should not be deleted by anyone, maybe only Admin?
-- Let's apply logical restrictions to Transactions too for safety.

-- TRANSACTIONS
DROP POLICY IF EXISTS "Transactions Isolation" ON public.transactions;
CREATE POLICY "Transactions View" ON public.transactions FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Transactions Insert" ON public.transactions FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Transactions Update" ON public.transactions FOR UPDATE USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Transactions Delete" ON public.transactions FOR DELETE USING (
    clinic_id = public.get_my_clinic_id() 
    AND public.current_user_can_delete()
);
