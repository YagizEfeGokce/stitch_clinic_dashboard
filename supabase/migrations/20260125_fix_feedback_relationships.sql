-- Ensure database can join feedback with profiles via user_id
DO $$
BEGIN
    -- Drop existing constraint if it exists to ensure we point to the right table
    -- (in case it points to auth.users which might not be exposed to PostgREST relationship detection the same way)
    ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
    
    -- Add explicit foreign key to profiles table
    -- This enables: .select('*, profiles:user_id(full_name)')
    ALTER TABLE public.feedback
    ADD CONSTRAINT feedback_user_id_profiles_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    -- Also verify clinic_id relationship for robustness
    ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_clinic_id_fkey;
    
    ALTER TABLE public.feedback
    ADD CONSTRAINT feedback_clinic_id_clinics_fkey
    FOREIGN KEY (clinic_id)
    REFERENCES public.clinics(id)
    ON DELETE SET NULL;
END $$;
