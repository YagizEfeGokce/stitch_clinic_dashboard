-- ============================================================================
-- DERMDESK MASTER SCHEMA (v1.0.0-beta)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLINICS TABLE (Tenant)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    subscription_tier TEXT DEFAULT 'FREE_TRIAL', -- 'free', 'pro', 'enterprise'
    subscription_status TEXT DEFAULT 'trialing',  -- 'active', 'trialing', 'past_due', 'canceled'
    trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    current_period_end TIMESTAMPTZ
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES TABLE (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff', -- 'owner', 'doctor', 'staff', 'admin'
    avatar_url TEXT,
    email TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    gender TEXT,
    notes TEXT
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id),
    title TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled'
    notes TEXT
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 6. INVENTORY TABLE
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

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 7. TRANSACTIONS TABLE (Finance)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    related_patient_id UUID REFERENCES public.patients(id)
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 8. FEEDBACK TABLE
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

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Helper Function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- CLINICS: Users can view their own clinic
CREATE POLICY "Users can view own clinic" ON public.clinics
    FOR SELECT USING (id = public.get_my_clinic_id());

-- PROFILES: Users can view profiles in same clinic
CREATE POLICY "Users can view members of own clinic" ON public.profiles
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

-- UPDATE PROFILE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- GENERIC TENANT POLICY (Split for Granular Control)

-- 1. PATIENTS
-- Everyone can View/Add/Edit
CREATE POLICY "Tenant View/Edit Patients" ON public.patients
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));
    
CREATE POLICY "Tenant Add Patients" ON public.patients
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Update Patients" ON public.patients
    FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

-- Only Owner/Admin can Delete
CREATE POLICY "Owner Delete Patients" ON public.patients
    FOR DELETE USING (
        clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'doctor'))
    );

-- 2. APPOINTMENTS
CREATE POLICY "Tenant View/Edit Appointments" ON public.appointments
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Add Appointments" ON public.appointments
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Update Appointments" ON public.appointments
    FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owner Delete Appointments" ON public.appointments
    FOR DELETE USING (
        clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'doctor'))
    );

-- 3. INVENTORY
CREATE POLICY "Tenant View Inventory" ON public.inventory
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Edit Inventory" ON public.inventory
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Update Inventory" ON public.inventory
    FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owner Delete Inventory" ON public.inventory
    FOR DELETE USING (
        clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- 4. TRANSACTIONS
CREATE POLICY "Tenant View Transactions" ON public.transactions
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant Edit Transactions" ON public.transactions
    FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Owner Delete Transactions" ON public.transactions
    FOR DELETE USING (
        clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- FEEDBACK POLICIES
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_clinic_id UUID;
BEGIN
    -- 1. Create a Clinic for the new user
    INSERT INTO public.clinics (
        name, 
        subscription_tier, 
        subscription_status, 
        trial_ends_at
    ) 
    VALUES (
        COALESCE(new.raw_user_meta_data->>'clinic_name', 'My Clinic'),
        COALESCE(new.raw_user_meta_data->>'plan_tier', 'pro'), -- Defaut to PRO if null
        'trialing',
        now() + interval '30 days'
    )
    RETURNING id INTO new_clinic_id;

    -- 2. Create Profile linked to that clinic
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

-- Storage Policies
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
