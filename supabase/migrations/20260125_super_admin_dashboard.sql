-- Super Admin Dashboard Setup
-- 1. Ensure Feedback Table Exists
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general', -- bug, feature, general
    status TEXT DEFAULT 'new', -- new, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Define Super Admin Check Function (Secure Server-Side Check)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user's email matches the allowed super admin email
  -- This reads from the JWT claims which is secure
  RETURN (auth.jwt() ->> 'email') = 'relre434@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on Feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing loose policies if any (optional but recommended for safety)
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON public.feedback;
DROP POLICY IF EXISTS "Super Admin View All Feedbacks" ON public.feedback;

-- 5. RLS Policies for Feedback
-- Super Admin can VIEW ALL
CREATE POLICY "Super Admin View All Feedbacks" 
ON public.feedback 
FOR SELECT 
USING (public.is_super_admin());

-- Super Admin can UPDATE ALL (to change status)
CREATE POLICY "Super Admin Update Feedbacks" 
ON public.feedback 
FOR UPDATE 
USING (public.is_super_admin());

-- Regular Users can INSERT their own feedback
CREATE POLICY "Users can create feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Regular Users can VIEW their own feedback
CREATE POLICY "Users can view own feedback" 
ON public.feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- 6. Grant Super Admin Read Access to Business Metrics Tables
-- CLINICS
CREATE POLICY "Super Admin View All Clinics" 
ON public.clinics 
FOR SELECT 
USING (public.is_super_admin());

-- APPOINTMENTS (For total count)
CREATE POLICY "Super Admin View All Appointments" 
ON public.appointments 
FOR SELECT 
USING (public.is_super_admin());

-- CLIENTS (For total customer count)
CREATE POLICY "Super Admin View All Clients" 
ON public.clients 
FOR SELECT 
USING (public.is_super_admin());

-- TRANSACTIONS (For revenue)
CREATE POLICY "Super Admin View All Transactions" 
ON public.transactions 
FOR SELECT 
USING (public.is_super_admin());
