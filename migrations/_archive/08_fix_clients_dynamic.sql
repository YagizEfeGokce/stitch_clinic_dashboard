-- ============================================================================
-- DYNAMIC FIX: CLIENTS TABLE & SETTINGS (Safe Migration)
-- ============================================================================

DO $$
BEGIN
    -- 1. Ensure 'first_name' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'first_name') THEN
        ALTER TABLE public.clients ADD COLUMN first_name TEXT;
    END IF;

    -- 2. Ensure 'last_name' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'last_name') THEN
        ALTER TABLE public.clients ADD COLUMN last_name TEXT;
    END IF;

    -- 3. If 'full_name' exists, migrate data. Use dynamic SQL to avoid compilation errors if column is missing.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        EXECUTE 'UPDATE public.clients SET 
            first_name = split_part(full_name, '' '', 1), 
            last_name = substring(full_name from position('' '' in full_name) + 1) 
            WHERE first_name IS NULL';
    END IF;

    -- 4. Fill explicit defaults for any remaining NULLs
    UPDATE public.clients SET first_name = 'Müşteri' WHERE first_name IS NULL OR first_name = '';
    UPDATE public.clients SET last_name = 'Soyisim' WHERE last_name IS NULL OR last_name = '';

    -- 5. Enforce NOT NULL constraints
    ALTER TABLE public.clients ALTER COLUMN first_name SET NOT NULL;
    ALTER TABLE public.clients ALTER COLUMN last_name SET NOT NULL;

    -- 6. Clean up 'full_name' if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        ALTER TABLE public.clients DROP COLUMN full_name;
    END IF;
END $$;

-- 7. Fix Settings: Enable Updates on Clinics
DO $$
BEGIN
    -- Ensure RLS is on
    ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
    
    -- Recreate Update Policy safely
    DROP POLICY IF EXISTS "Users can update own clinic" ON public.clinics;
    
    CREATE POLICY "Users can update own clinic" ON public.clinics
        FOR UPDATE USING (id = public.get_my_clinic_id());
END $$;

-- 8. Reload Schema Cache
NOTIFY pgrst, 'reload config';
