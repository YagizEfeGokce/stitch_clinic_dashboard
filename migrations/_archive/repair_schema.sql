-- ============================================================================
-- DERMDESK SAFE PRODUCTION REPAIR & SYNC (v5)
-- ============================================================================
-- Fixes:
-- 1. Added 'slug' generation.
-- 2. Fixed CHECK constraint violations.
-- 3. Fixed missing 'date' column.
-- 4. ADDED EXPLICIT PERMISSIONS (Fixes "Permission Denied")
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 1: Emergency Fixes...';
END $$;

BEGIN;

-- 1. Ensure clinics table exists
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fix PROFILES table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);

-- 3. Handle Orphaned Profiles
DO $$
DECLARE
    default_clinic_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE clinic_id IS NULL LIMIT 1) THEN
        
        -- Try to find an existing default-like clinic
        SELECT id INTO default_clinic_id FROM public.clinics WHERE slug = 'default-clinic' LIMIT 1;
        
        -- If not found, create it
        IF default_clinic_id IS NULL THEN
            INSERT INTO public.clinics (name, slug, subscription_status, subscription_tier)
            VALUES ('Default Clinic', 'default-clinic', 'active', 'trial')
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id INTO default_clinic_id;
        END IF;

        IF default_clinic_id IS NULL THEN
             SELECT id INTO default_clinic_id FROM public.clinics LIMIT 1;
        END IF;

        -- Assign orphans
        IF default_clinic_id IS NOT NULL THEN
            UPDATE public.profiles
            SET clinic_id = default_clinic_id
            WHERE clinic_id IS NULL;
            
            RAISE NOTICE 'Assigned orphaned profiles to clinic %', default_clinic_id;
        END IF;
    END IF;
END $$;

-- 4. Add other missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. Helper Function
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMIT;

-- ============================================================================
-- PHASE 2: FULL SCHEMA SYNC
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 2: Schema Synchronization...';
END $$;

BEGIN;

-- 1. CLINICS
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS settings_config JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_clinics_subscription_status ON public.clinics(subscription_status);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    gender TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    image_url TEXT
);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        INSERT INTO public.clients (id, created_at, clinic_id, first_name, last_name, phone, email, birth_date, gender, notes, status, image_url)
        SELECT id, created_at, clinic_id, first_name, last_name, phone, email, birth_date, gender, notes, status, image_url
        FROM public.patients
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON public.clients(clinic_id);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 3. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_min INTEGER DEFAULT 30;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON public.services(clinic_id);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 4. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT,
    date DATE NOT NULL,
    time TEXT,
    status TEXT DEFAULT 'scheduled',
    notes TEXT
);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 5. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'ad',
    min_stock INTEGER DEFAULT 5,
    price DECIMAL(10,2) DEFAULT 0
);
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'ad';
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_inventory_clinic_id ON public.inventory(clinic_id);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    client_id UUID REFERENCES public.clients(id)
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    admin_notes TEXT
);
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_feedback_clinic_id ON public.feedback(clinic_id);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- PHASE 3: RLS POLICIES (RESET)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 3: RLS Policy Reset...';
END $$;

BEGIN;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

CREATE POLICY "clinics_select" ON public.clinics FOR SELECT TO authenticated USING (id = public.get_my_clinic_id());
CREATE POLICY "clinics_update" ON public.clinics FOR UPDATE TO authenticated USING (id = public.get_my_clinic_id()) WITH CHECK (id = public.get_my_clinic_id());

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_select_colleagues" ON public.profiles FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id() AND clinic_id IS NOT NULL);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "services_insert" ON public.services FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "services_update" ON public.services FOR UPDATE TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "services_delete" ON public.services FOR DELETE TO authenticated USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "inventory_select" ON public.inventory FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "inventory_insert" ON public.inventory FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "inventory_update" ON public.inventory FOR UPDATE TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "inventory_delete" ON public.inventory FOR DELETE TO authenticated USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE TO authenticated USING (clinic_id = public.get_my_clinic_id()) WITH CHECK (clinic_id = public.get_my_clinic_id());
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE TO authenticated USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "feedback_select_own" ON public.feedback FOR SELECT TO authenticated USING (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- PHASE 4: TRIGGERS & STORAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 4: Triggers & Storage...';
END $$;

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_clinic_id UUID;
    new_slug TEXT;
BEGIN
    new_slug := lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'clinic_name', 'clinic'), '[^a-z0-9]', '-', 'g')) || '-' || floor(extract(epoch from now()));
    INSERT INTO public.clinics (name, slug, subscription_status, subscription_tier, trial_ends_at) 
    VALUES (
        COALESCE(new.raw_user_meta_data->>'clinic_name', 'Yeni Klinik'),
        new_slug,
        'active', 
        'trial', 
        now() + interval '30 days'
    )
    RETURNING id INTO new_clinic_id;
    INSERT INTO public.profiles (id, clinic_id, full_name, role, email)
    VALUES (new.id, new_clinic_id, COALESCE(new.raw_user_meta_data->>'full_name', 'Kullanıcı'), 'owner', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('clinic-logos', 'clinic-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "avatar_select_public" ON storage.objects;
CREATE POLICY "avatar_select_public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatar_insert_authenticated" ON storage.objects;
CREATE POLICY "avatar_insert_authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "clinic_logo_select_public" ON storage.objects;
CREATE POLICY "clinic_logo_select_public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'clinic-logos');
DROP POLICY IF EXISTS "clinic_logo_insert_authenticated" ON storage.objects;
CREATE POLICY "clinic_logo_insert_authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-logos' AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.clinics WHERE id = public.get_my_clinic_id()));

COMMIT;

-- ============================================================================
-- PHASE 5: FIX PERMISSIONS (CRITICAL)
-- ============================================================================
-- Grants explicit access to 'authenticated' role to prevent "Permission Denied"
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

DO $$
BEGIN
    RAISE NOTICE 'Safe Repair & Sync Completed Successfully!';
END $$;
