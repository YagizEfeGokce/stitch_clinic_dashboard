-- ============================================================================
-- VELARA v2.0 - PHOENIX MASTER SCHEMA
-- ============================================================================
-- DESCRIPTION:
-- This is the consolidated, authoritative schema for the Velara application.
-- It enforces strict multi-tenancy, includes RLS recursion fixes, and enables Realtime.
--
-- EXECUTION INSTRUCTIONS:
-- Running this script will TEAR DOWN existing data in the specific tables listed.
-- It is designed to be idempotent (safe to run multiple times).
-- ============================================================================

-- 0. CLEANUP (Destructive)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.fn_auto_assign_clinic() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_clinic_id() CASCADE;

DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.staff_availability CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.clinic_settings CASCADE; -- Legacy, explicitly ensuring removal
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PUBLIC TABLES
-- ============================================================================

-- CLINICS (Tenant Root)
CREATE TABLE public.clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'My Clinic',
    branding_config JSONB DEFAULT '{}'::jsonb, 
    settings_config JSONB DEFAULT '{"working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "working_start_hour": "09:00", "working_end_hour": "17:00"}'::jsonb, -- Default settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- PROFILES (Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'doctor', 'staff')),
    avatar_url TEXT,
    has_completed_onboarding BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- CLIENTS
CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SERVICES
CREATE TABLE public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price NUMERIC(10, 2) DEFAULT 0.00,
    color TEXT DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- INVENTORY
CREATE TABLE public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    price NUMERIC(10, 2) DEFAULT 0.00,
    cost_price NUMERIC(10, 2),
    sale_price NUMERIC(10, 2),
    unit TEXT,
    category TEXT,
    supplier TEXT,
    expiry_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'In Stock',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STAFF AVAILABILITY
CREATE TABLE public.staff_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, day_of_week)
);

-- APPOINTMENTS
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    payment_method TEXT,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. SECURITY & RLS
-- ============================================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2.1 SECURITY DEFINER HELPER (The Fix for Recursion)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2.2 POLICIES

-- CLINICS
CREATE POLICY "Clinics Members Isolation" ON clinics
    FOR ALL USING (id = public.get_my_clinic_id());

-- PROFILES (Recursion Fix Applied)
CREATE POLICY "Profiles Isolation" ON profiles
    FOR SELECT USING (
        id = auth.uid() OR clinic_id = public.get_my_clinic_id()
    );

CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- SHARED ISOLATION POLICY PATTERN
CREATE POLICY "Clients Isolation" ON clients
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Services Isolation" ON services
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Inventory Isolation" ON inventory
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Staff Availability Isolation" ON staff_availability
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Appointments Isolation" ON appointments
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Transactions Isolation" ON transactions
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Activity Logs Isolation" ON activity_logs
    FOR ALL USING (clinic_id = public.get_my_clinic_id());

-- ============================================================================
-- 3. AUTOMATION & TRIGGERS
-- ============================================================================

-- 3.1 AUTO-ASSIGN CLINIC ID
CREATE OR REPLACE FUNCTION public.fn_auto_assign_clinic()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    SELECT clinic_id INTO NEW.clinic_id 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF NEW.clinic_id IS NULL THEN
        RAISE EXCEPTION 'User does not belong to a clinic. Cannot insert data.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers
CREATE TRIGGER trg_set_clinic_clients BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_inventory BEFORE INSERT ON public.inventory FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_staff BEFORE INSERT ON public.staff_availability FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_appointments BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_transactions BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_logs BEFORE INSERT ON public.activity_logs FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();

-- 3.2 NEW USER HANDLER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
BEGIN
    INSERT INTO public.clinics (name) 
    VALUES (COALESCE(new.raw_user_meta_data->>'clinic_name', 'My New Clinic'))
    RETURNING id INTO new_clinic_id;

    INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        new_clinic_id,
        new.raw_user_meta_data->>'full_name', 
        'owner',
        new.raw_user_meta_data->>'avatar_url'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 4. STORAGE & REALTIME
-- ============================================================================

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;

-- Storage Buckets (Safe to re-run due to ON CONFLICT)
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory', 'inventory', true) ON CONFLICT (id) DO NOTHING;
