-- ============================================================================
-- PERFORMANCE OPTIMIZATION SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- 1. Optimize the recursive RLS function
-- Adding 'SET search_path = public' prevents creating objects in unsafe locations
-- Using 'stable' allows for caching within a transaction
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Add Index to Foreign Keys (Crucial for Join Performance)
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON public.clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);

-- 3. Verify
-- RLS Policies rely on get_my_clinic_id(), so optimizing it helps EVERYTHING.
