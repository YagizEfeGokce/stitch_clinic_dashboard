-- ============================================================================
-- PERFORMANCE INDEXES (Fixing Supabase Advisor Issues)
-- ============================================================================

-- 1. Foreign Key Indexes (Critical for RLS Performance)
-- Every table that has 'clinic_id' needs an index because RLS policies filter by it constantly.

CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_clinic_id ON public.inventory(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_feedback_clinic_id ON public.feedback(clinic_id);

-- 2. Join Column Indexes
-- Indexes for columns frequently used in JOINs or WHERE clauses

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date); -- Common filter
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date); -- Common filter

-- 3. Feedback User Index
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- 4. Subscription Status Index (for Login checks)
CREATE INDEX IF NOT EXISTS idx_clinics_subscription_status ON public.clinics(subscription_status);
