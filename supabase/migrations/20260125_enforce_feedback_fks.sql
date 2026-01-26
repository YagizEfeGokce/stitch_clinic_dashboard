-- ENSURE FK CONSTRAINTS EXIST
-- Even if columns exist, they might lack the foreign key constraints. 
-- We explicitly add them here.

DO $$ 
BEGIN
    -- Add FK for clinic_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_clinic_id_fkey') THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_clinic_id_fkey 
        FOREIGN KEY (clinic_id) 
        REFERENCES public.clinics(id) 
        ON DELETE SET NULL;
    END IF;

    -- Add FK for user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_user_id_fkey') THEN
        ALTER TABLE public.feedback 
        ADD CONSTRAINT feedback_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
