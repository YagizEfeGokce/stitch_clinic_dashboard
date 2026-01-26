-- ============================================================================
-- ROLLBACK SCRIPT - UNDO ALL CHANGES FROM JAN 25, 2026
-- ============================================================================

BEGIN;

-- 1. Undo "Super Admin Metrics" Policies
-- Files: 20260125_super_admin_metrics.sql
DROP POLICY IF EXISTS "Super Admin can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Super Admin can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Super Admin can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Super Admin can view all inventory" ON public.inventory;
DROP POLICY IF EXISTS "Super Admin randevuları görebilir" ON public.appointments; -- If Turkish names were used
DROP POLICY IF EXISTS "Super Admin müşterileri görebilir" ON public.clients;
DROP POLICY IF EXISTS "Super Admin ödemeleri görebilir" ON public.transactions;


-- 2. Undo "RLS Leaks" & "Optimize Admin" Policies (Profiles & Clinics)
-- Files: 20260125_fix_rls_leaks.sql, 20260125_optimize_admin_rls.sql
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all clinics" ON public.clinics;
DROP POLICY IF EXISTS "Users can view profiles from their own clinic" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own clinic" ON public.clinics;
DROP POLICY IF EXISTS "Herkes profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Herkes klinikleri görebilir" ON public.clinics;


-- 3. Undo "Feedback RLS" & "Feedback Relationships"
-- Files: 20260125_add_feedback_rls.sql, 20260125_fix_feedback_relationships.sql
-- Note: Disabling RLS on feedback might leave it open if it was open before, 
-- but usually tables are private by default or RLS disabled means public. 
-- Assuming it was RLS disabled originally or handled elsewhere. 
-- I will DROP the specific policies I added.
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON public.feedback;
DROP POLICY IF EXISTS "Herkes okuyabilir" ON public.feedback;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON public.feedback;
DROP POLICY IF EXISTS "Herkes güncelleyebilir" ON public.feedback;

-- Drop constraints
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_user_id_profiles_fkey;
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_clinic_id_clinics_fkey;


-- 4. Undo "Add Clinic ID to Feedback" 
-- Files: 20260125_add_clinic_id_to_feedback.sql
-- WARNING: This deletes data in that column.
ALTER TABLE public.feedback DROP COLUMN IF EXISTS clinic_id;


COMMIT;
