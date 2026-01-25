-- ===========================================================================
-- DERMDESK V2.0 - PRODUCTION SCHEMA (REBUILD)
-- ===========================================================================
-- 
-- DESCRIPTION:
-- This script rebuilds the entire database schema from scratch.
-- It implements strict multi-tenancy via 'clinic_members', proper RLS,
-- soft deletes, and audit logging.
--
-- WARNING:
-- THIS SCRIPT DROPS THE 'public' SCHEMA. ALL DATA WILL BE LOST.
-- Run this only on a fresh database or after backing up data.
--
-- ===========================================================================

-- 1. CLEAN SLATE
-- ===========================================================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For search performance

-- 2. ENUMS & TYPES
-- ===========================================================================
-- Using CHECK constraints instead of native ENUMs for easier future updates,
-- allowing application-layer flexibility while enforcing data integrity.

-- 3. CORE TABLES (IDENTITY & TENANCY)
-- ===========================================================================

-- CLINICS: The Tenant Root
CREATE TABLE public.clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9-]+$'), -- URL-friendly
    subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete')),
    
    -- Business Information
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    
    -- Configuration (JSONB for flexibility)
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Business Hours (Structured JSONB as requested)
    work_hours JSONB DEFAULT '{
        "monday": { "open": "09:00", "close": "18:00", "closed": false },
        "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
        "wednesday": { "open": "09:00", "close": "18:00", "closed": false },
        "thursday": { "open": "09:00", "close": "18:00", "closed": false },
        "friday": { "open": "09:00", "close": "18:00", "closed": false },
        "saturday": { "open": "09:00", "close": "14:00", "closed": false },
        "sunday": { "open": "00:00", "close": "00:00", "closed": true }
    }'::jsonb,

    -- Meta
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ -- Soft delete (future proofing)
);
COMMENT ON TABLE public.clinics IS 'Tenant root table. Stores all clinic-specific configuration.';

-- PROFILES: The User (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Frontend Helper: Which clinic was I last viewing?
    last_accessed_clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Extended user profile data. Linked 1:1 with Supabase Auth.';

-- CLINIC MEMBERS: The Authority for RLS (Many-to-Many)
CREATE TABLE public.clinic_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'doctor', 'staff', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Constraints
    UNIQUE(clinic_id, user_id) -- A user can only have one role per clinic
);
COMMENT ON TABLE public.clinic_members IS 'Junction table defining WHO can access WHICH clinic. Critical for RLS.';

-- 4. BUSINESS ENTITIES
-- ===========================================================================

-- CLIENTS (Patients)
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT CHECK (email ~* '^.+@.+\..+$'),
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unspecified')),
    address TEXT,
    
    -- Medical & Notes
    medical_history JSONB DEFAULT '{}'::jsonb, -- Allergies, conditions, etc.
    notes TEXT,
    
    -- Status
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Lead', 'Inactive', 'Archived')),
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ -- Soft delete
);
CREATE INDEX idx_clients_clinic_id ON public.clients(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_search_name ON public.clients USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_clients_phone ON public.clients(clinic_id, phone) WHERE deleted_at IS NULL;

-- SERVICES (Treatments)
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    duration_min INTEGER NOT NULL DEFAULT 30 CHECK (duration_min > 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_services_clinic_id ON public.services(clinic_id) WHERE deleted_at IS NULL;

-- APPOINTMENTS
CREATE TABLE public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Relations
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Assigned doctor/staff
    
    -- Schedule
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Workflow
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('pending', 'scheduled', 'confirmed', 'completed', 'canceled', 'no_show')),
    
    -- Details
    notes TEXT,
    
    -- Meta
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Logic Constraints
    CONSTRAINT valid_duration CHECK (end_time > start_time)
);
CREATE INDEX idx_appointments_clinic_date ON public.appointments(clinic_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_client ON public.appointments(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_staff ON public.appointments(staff_id) WHERE deleted_at IS NULL;

-- INVENTORY (Products)
CREATE TABLE public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER DEFAULT 5, -- Low stock threshold
    unit TEXT DEFAULT 'pcs',
    expiry_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_inventory_clinic ON public.inventory(clinic_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_low_stock ON public.inventory(clinic_id) WHERE quantity <= min_quantity AND deleted_at IS NULL;

-- TRANSACTIONS (Finance)
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Relations
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    -- Finance Data
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'transfer', 'insurance')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_transactions_clinic_date ON public.transactions(clinic_id, date) WHERE deleted_at IS NULL;

-- 5. OBSERVABILITY
-- ===========================================================================

-- AUDIT LOGS (Immutable)
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login'
    table_name TEXT NOT NULL,
    record_id UUID,
    
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_audit_clinic_date ON public.audit_logs(clinic_id, created_at DESC);

-- FEEDBACK
CREATE TABLE public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. FUNCTIONS & TRIGGERS
-- ===========================================================================

-- Helper: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Trigger to all core tables
CREATE TRIGGER update_clinics_modtime BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_modtime BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper: Handle New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create Profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: Soft Delete Function (Optional Usage)
CREATE OR REPLACE FUNCTION soft_delete_record()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clients SET deleted_at = now() WHERE id = OLD.id;
    RETURN NULL; -- Cancel the actual delete
END;
$$ LANGUAGE plpgsql;

-- 7. RLS POLICIES (THE BULLETPROOF STRATEGY)
-- ===========================================================================
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- A. PROFILES (Self Access)
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- B. CLINIC MEMBERS (The Gatekeeper)
-- ---------------------------------------------------------------------------
-- Users can see memberships for clinics they belong to.
-- This allows the frontend to list "My Clinics".
CREATE POLICY "Users can view own memberships" ON public.clinic_members
    FOR SELECT USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- C. CLINICS (Via Membership)
-- ---------------------------------------------------------------------------
CREATE POLICY "Members can view clinic details" ON public.clinics
    FOR SELECT USING (
        id IN (
            SELECT clinic_id FROM public.clinic_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
    
CREATE POLICY "Owners can update clinic details" ON public.clinics
    FOR UPDATE USING (
        id IN (
            SELECT clinic_id FROM public.clinic_members 
            WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
        )
    );

-- ---------------------------------------------------------------------------
-- D. STANDARD BUSINESS TABLES (Clients, Appointments, etc.)
--    Strategy: EXISTS check against clinic_members table.
--    This is performant and avoids recursion.
-- ---------------------------------------------------------------------------

-- > CLIENTS
CREATE POLICY "Members can view clients" ON public.clients
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Members can insert clients" ON public.clients
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Members can update clients" ON public.clients
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- > APPOINTMENTS
CREATE POLICY "Members can view appointments" ON public.appointments
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Members can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Members can update appointments" ON public.appointments
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- > SERVICES
CREATE POLICY "Members can view services" ON public.services
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Admins/Doctors can manage services" ON public.services
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'doctor') 
            AND status = 'active'
        )
    );

-- > INVENTORY
CREATE POLICY "Members can view inventory" ON public.inventory
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active') AND deleted_at IS NULL);

CREATE POLICY "Members can manage inventory" ON public.inventory
    FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active'));

-- > TRANSACTIONS
CREATE POLICY "Members can view transactions" ON public.transactions
    FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND status = 'active') AND deleted_at IS NULL);

CREATE POLICY "Admins can manage transactions" ON public.transactions
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM public.clinic_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin') 
            AND status = 'active'
        )
    );

-- 8. STORAGE BUCKETS
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'clinic-assets');

CREATE POLICY "Anyone can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

-- ===========================================================================
-- END OF MIGRATION
-- ===========================================================================
