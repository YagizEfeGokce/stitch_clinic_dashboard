-- Add clinic_id column to feedback table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'feedback'
        AND column_name = 'clinic_id'
    ) THEN
        ALTER TABLE public.feedback
        ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
    END IF;
END $$;
