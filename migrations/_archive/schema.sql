-- ============================================================================
-- DERMDESK MASTER SCHEMA (FINAL)
-- Single Source of Truth
-- ============================================================================
-- ⚠️ WARNING: If creating fresh, this drops everything.
-- If running on existing DB, use the Sync Script (or careful individual alter commands).
-- ============================================================================

-- 1. PURGE (CLEAN SLATE)
-- Drops all tables and functions with CASCADE to remove dependent policies.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_clinic_id() CASCADE;

DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE; 
DROP TABLE IF EXISTS public.clients CASCADE; -- Was patients
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. CLINICS TABLE (Tenant)
CREATE TABLE public.clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    subscription_tier TEXT DEFAULT 'FREE_TRIAL', -- 'free', 'pro', 'enterprise'
    subscription_status TEXT DEFAULT 'trialing',  -- 'active', 'trialing', 'past_due', 'canceled'
    trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    current_period_end TIMESTAMPTZ,
    branding_config JSONB DEFAULT '{}',
    settings_config JSONB DEFAULT '{}'
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clinics_subscription_status ON public.clinics(subscription_status);

-- 4. PROFILES TABLE (Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff', -- 'owner', 'doctor', 'staff', 'admin'
    avatar_url TEXT,
    email TEXT,
    has_completed_onboarding BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_clinic_id ON public.profiles(clinic_id);

-- 5. CLIENTS TABLE
CREATE TABLE public.clients (
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

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_clinic_id ON public.clients(clinic_id);

-- 6. SERVICES TABLE
CREATE TABLE public.services (
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

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_services_clinic_id ON public.services(clinic_id);

-- 7. APPOINTMENTS TABLE
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL, 
    staff_id UUID REFERENCES public.profiles(id),
    title TEXT,
    date DATE NOT NULL,
    time TEXT,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled'
    notes TEXT
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);

-- 8. INVENTORY TABLE
CREATE TABLE public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'ad',
    min_stock INTEGER DEFAULT 5,
    price DECIMAL(10,2) DEFAULT 0
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inventory_clinic_id ON public.inventory(clinic_id);

-- 9. TRANSACTIONS TABLE
CREATE TABLE public.transactions (
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

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- 10. FEEDBACK TABLE
CREATE TABLE public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    admin_notes TEXT
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_feedback_clinic_id ON public.feedback(clinic_id);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);

-- ============================================================================
-- RLS POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Helper Function (SECURITY DEFINER to avoid infinite loops)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- CLINICS
CREATE POLICY "Users can view own clinic" ON public.clinics FOR SELECT USING (id = public.get_my_clinic_id());
CREATE POLICY "Users can update own clinic" ON public.clinics FOR UPDATE USING (id = public.get_my_clinic_id());

-- PROFILES (Split to avoid recursion)
-- 1. Can view self (Anchor)
CREATE POLICY "View Own Profile" ON public.profiles FOR SELECT USING (id = auth.uid());
-- 2. Can view colleagues (Dependent on Anchor via SECURITY DEFINER logic or simple subquery)
CREATE POLICY "View Colleagues" ON public.profiles FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- CLIENTS
CREATE POLICY "Tenant View Clients" ON public.clients FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Clients" ON public.clients FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- SERVICES
CREATE POLICY "Tenant View Services" ON public.services FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Services" ON public.services FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- APPOINTMENTS
CREATE POLICY "Tenant View Appointments" ON public.appointments FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Appointments" ON public.appointments FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- INVENTORY
CREATE POLICY "Tenant View Inventory" ON public.inventory FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Inventory" ON public.inventory FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- TRANSACTIONS
CREATE POLICY "Tenant View Transactions" ON public.transactions FOR SELECT USING (clinic_id = public.get_my_clinic_id());
CREATE POLICY "Tenant Manage Transactions" ON public.transactions FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- FEEDBACK
CREATE POLICY "Users can create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_clinic_id UUID;
BEGIN
    INSERT INTO public.clinics (name, subscription_status, trial_ends_at) 
    VALUES (
        COALESCE(new.raw_user_meta_data->>'clinic_name', 'My Clinic'),
        'trialing',
        now() + interval '30 days'
    )
    RETURNING id INTO new_clinic_id;

    INSERT INTO public.profiles (id, clinic_id, full_name, role, email)
    VALUES (
        new.id, 
        new_clinic_id,
        new.raw_user_meta_data->>'full_name', 
        'owner',
        new.email
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger checks
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar User Upload" ON storage.objects;
CREATE POLICY "Avatar User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
