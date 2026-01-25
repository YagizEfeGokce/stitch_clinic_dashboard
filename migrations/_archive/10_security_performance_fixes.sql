-- ============================================================================
-- SECURITY & PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- 1. PERFORMANCE: COMPOSITE INDEXES
-- Speed up the main dashboard query (Clinic ID + Date Range)
CREATE INDEX IF NOT EXISTS idx_appointments_composite_date 
ON public.appointments(clinic_id, date);

-- Speed up Client Name Searches within the clinic
CREATE INDEX IF NOT EXISTS idx_clients_name_composite 
ON public.clients(clinic_id, last_name, first_name);

-- Speed up Service Lookups by Clinic
CREATE INDEX IF NOT EXISTS idx_services_composite
ON public.services(clinic_id, active);

-- 2. SECURITY: FEEDBACK VISIBILITY
-- Allow authenticated users to view the feedback they submitted
-- (Schema previously only allowed INSERT)
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- 3. UTILITY: CACHE RELOAD
NOTIFY pgrst, 'reload config';
