-- ============================================================================
-- DERMDESK DATABASE SCHEMA - CONSOLIDATED BASELINE
-- ============================================================================
-- Version: 1.0 (Consolidated from production on 2026-01-24)
-- Description: Single source of truth for the Dermdesk SaaS database schema.
--              Pulled from live production database.
--
-- This file consolidates all previous migrations into a single baseline.
-- For older migrations, see: supabase/migrations/_archive/
--                           migrations/_archive/
--
-- TABLES (19 total):
-- ==================
-- Core:
--   clinics, profiles, invitations, clients, client_notes, client_photos,
--   services, staff_availability, appointments, inventory, transactions,
--   reviews, activity_logs, clinic_members, feedback, audit_logs
-- Beta System:
--   beta_waitlist, beta_invitations, beta_users, beta_feature_flags
--
-- ============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLINICS (Tenant Root / Organization)
-- Each clinic is an independent tenant in the SaaS Multi-Tenant model
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    name TEXT NOT NULL DEFAULT 'My Clinic',
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Branding & Configuration (JSONB for flexibility)
    logo_url TEXT,
    branding_config JSONB DEFAULT '{}'::jsonb,
    settings_config JSONB DEFAULT '{
        "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "working_start_hour": "09:00",
        "working_end_hour": "17:00"
    }'::jsonb,
    
    -- Subscription / Billing (SaaS)
    subscription_tier TEXT DEFAULT 'FREE_TRIAL' CHECK (subscription_tier IN ('FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '14 days'),
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Payment Gateway IDs
    stripe_customer_id TEXT,
    iyzico_customer_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clinics_subscription_status ON public.clinics(subscription_status);

-- -----------------------------------------------------------------------------
-- PROFILES (Users / Staff Members)
-- Links to Supabase auth.users, belongs to a clinic
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- User Info
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Role Management (includes super_admin for beta)
    role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'doctor', 'staff', 'receptionist', 'super_admin')),
    
    -- Onboarding State
    has_completed_onboarding BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- INVITATIONS (Team Invites)
-- Allows clinic owners/admins to invite new team members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Invite Details
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'staff', 'receptionist')),
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
    
    -- Unique constraint: one active invite per email per clinic
    UNIQUE(clinic_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_clinic_id ON public.invitations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ============================================================================
-- 2. CLIENT MANAGEMENT
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLIENTS (Patients / Customers)
-- Core entity for people receiving services at the clinic
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Personal Info
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
    email TEXT,
    phone TEXT,
    
    -- Additional Info
    address TEXT,
    city TEXT,
    tc_kimlik TEXT,  -- Turkish National ID (or equivalent)
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
    
    -- Profile
    image_url TEXT,
    notes TEXT,  -- Legacy single notes field
    
    -- Status
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Lead', 'Inactive', 'VIP')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON public.clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON public.clients(full_name);

-- -----------------------------------------------------------------------------
-- CLIENT_NOTES (Clinical Notes per Client)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON public.client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_clinic_id ON public.client_notes(clinic_id);

-- -----------------------------------------------------------------------------
-- CLIENT_PHOTOS (Gallery Photos per Client)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    caption TEXT,
    category TEXT DEFAULT 'General',
    taken_at DATE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_photos_client_id ON public.client_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_client_photos_clinic_id ON public.client_photos(clinic_id);

-- ============================================================================
-- 3. SERVICES & SCHEDULING
-- ============================================================================

-- -----------------------------------------------------------------------------
-- SERVICES (Treatments / Procedures offered by clinic)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,
    price NUMERIC(10, 2) DEFAULT 0.00,
    color TEXT DEFAULT 'blue',
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON public.services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);

-- -----------------------------------------------------------------------------
-- STAFF_AVAILABILITY (Working hours per staff member)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    is_working BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_clinic_id ON public.staff_availability(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON public.staff_availability(staff_id);

-- -----------------------------------------------------------------------------
-- APPOINTMENTS (Scheduled visits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    
    date DATE NOT NULL,
    time TIME NOT NULL,
    
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Pending', 'Completed', 'Cancelled', 'NoShow')),
    payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid', 'Refunded')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- ============================================================================
-- 4. INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    
    stock INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'adet',
    
    price NUMERIC(10, 2) DEFAULT 0.00,
    cost_price NUMERIC(10, 2),
    sale_price NUMERIC(10, 2),
    
    category TEXT,
    supplier TEXT,
    expiry_date DATE,
    image_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Discontinued')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_clinic_id ON public.inventory(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);

-- ============================================================================
-- 5. FINANCE & TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(10, 2) NOT NULL,
    
    category TEXT,
    description TEXT,
    payment_method TEXT,
    
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    external_reference_id TEXT,
    date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);

-- ============================================================================
-- 6. REVIEWS & FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    source TEXT DEFAULT 'Website' CHECK (source IN ('Google', 'Facebook', 'Website', 'Instagram', 'Other')),
    patient_name TEXT NOT NULL,
    patient_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Replied', 'Archived', 'Flagged')),
    reply TEXT,
    reply_date TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_clinic_id ON public.reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- ============================================================================
-- 7. AUDIT & LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_clinic_id ON public.activity_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- ============================================================================
-- 8. BETA SYSTEM TABLES
-- ============================================================================

-- BETA_WAITLIST
CREATE TABLE IF NOT EXISTS public.beta_waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    clinic_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    current_system TEXT,
    
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    approved_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    notes TEXT,
    
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_waitlist_email ON public.beta_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_referral_code ON public.beta_waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_referred_by ON public.beta_waitlist(referred_by);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_created_at ON public.beta_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_status ON public.beta_waitlist(status);

-- BETA_INVITATIONS
CREATE TABLE IF NOT EXISTS public.beta_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    code TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    waitlist_id UUID REFERENCES public.beta_waitlist(id) ON DELETE SET NULL,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    batch_number INT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_invitations_code ON public.beta_invitations(code);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_email ON public.beta_invitations(email);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_status ON public.beta_invitations(status);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_expires_at ON public.beta_invitations(expires_at);

-- BETA_USERS
CREATE TABLE IF NOT EXISTS public.beta_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    waitlist_id UUID REFERENCES public.beta_waitlist(id) ON DELETE SET NULL,
    invitation_id UUID REFERENCES public.beta_invitations(id) ON DELETE SET NULL,
    
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'suspended', 'removed')),
    approved_at TIMESTAMPTZ DEFAULT now(),
    first_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    invitation_sent_at TIMESTAMPTZ,
    invitation_accepted_at TIMESTAMPTZ,
    
    onboarding_completed BOOLEAN DEFAULT FALSE,
    feedback_given BOOLEAN DEFAULT FALSE,
    referred_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_beta_users_user_id ON public.beta_users(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_users_email ON public.beta_users(email);
CREATE INDEX IF NOT EXISTS idx_beta_users_status ON public.beta_users(status);

-- BETA_FEATURE_FLAGS
CREATE TABLE IF NOT EXISTS public.beta_feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    feature_key TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Get current user's clinic_id (avoids recursive RLS issues)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is beta user
CREATE OR REPLACE FUNCTION public.is_beta_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF (auth.jwt() -> 'user_metadata' ->> 'is_beta_user')::boolean = true THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.beta_users
    WHERE beta_users.user_id = user_id
    AND beta_users.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM public.beta_invitations WHERE code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Count referrals for a given code
CREATE OR REPLACE FUNCTION get_referral_count(ref_code TEXT)
RETURNS INT AS $$
    SELECT COUNT(*)::INT
    FROM public.beta_waitlist
    WHERE referred_by = ref_code;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 11. RLS POLICIES (Complete with SELECT/INSERT/UPDATE/DELETE)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLINICS
-- -----------------------------------------------------------------------------
CREATE POLICY "Clinics SELECT" ON public.clinics
    FOR SELECT USING (id = public.get_my_clinic_id());

CREATE POLICY "Clinics UPDATE" ON public.clinics
    FOR UPDATE USING (id = public.get_my_clinic_id())
    WITH CHECK (id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- PROFILES
-- -----------------------------------------------------------------------------
CREATE POLICY "Profiles SELECT" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR clinic_id = public.get_my_clinic_id());

CREATE POLICY "Profiles UPDATE own" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles INSERT by trigger" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- INVITATIONS (Admin/Owner only)
-- -----------------------------------------------------------------------------
CREATE POLICY "Invitations SELECT" ON public.invitations
    FOR SELECT USING (
        clinic_id = public.get_my_clinic_id() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Invitations INSERT" ON public.invitations
    FOR INSERT WITH CHECK (
        clinic_id = public.get_my_clinic_id() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Invitations UPDATE" ON public.invitations
    FOR UPDATE USING (
        clinic_id = public.get_my_clinic_id() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Invitations DELETE" ON public.invitations
    FOR DELETE USING (
        clinic_id = public.get_my_clinic_id() AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- -----------------------------------------------------------------------------
-- CLIENTS
-- -----------------------------------------------------------------------------
CREATE POLICY "Clients SELECT" ON public.clients
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Clients INSERT" ON public.clients
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Clients UPDATE" ON public.clients
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Clients DELETE" ON public.clients
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- CLIENT_NOTES
-- -----------------------------------------------------------------------------
CREATE POLICY "Client Notes SELECT" ON public.client_notes
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Client Notes INSERT" ON public.client_notes
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Client Notes UPDATE" ON public.client_notes
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Client Notes DELETE" ON public.client_notes
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- CLIENT_PHOTOS
-- -----------------------------------------------------------------------------
CREATE POLICY "Client Photos SELECT" ON public.client_photos
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Client Photos INSERT" ON public.client_photos
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Client Photos UPDATE" ON public.client_photos
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Client Photos DELETE" ON public.client_photos
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- SERVICES
-- -----------------------------------------------------------------------------
CREATE POLICY "Services SELECT" ON public.services
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Services INSERT" ON public.services
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Services UPDATE" ON public.services
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Services DELETE" ON public.services
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- STAFF_AVAILABILITY
-- -----------------------------------------------------------------------------
CREATE POLICY "Staff Availability SELECT" ON public.staff_availability
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Staff Availability INSERT" ON public.staff_availability
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Staff Availability UPDATE" ON public.staff_availability
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Staff Availability DELETE" ON public.staff_availability
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- APPOINTMENTS
-- -----------------------------------------------------------------------------
CREATE POLICY "Appointments SELECT" ON public.appointments
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Appointments INSERT" ON public.appointments
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Appointments UPDATE" ON public.appointments
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Appointments DELETE" ON public.appointments
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- INVENTORY
-- -----------------------------------------------------------------------------
CREATE POLICY "Inventory SELECT" ON public.inventory
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Inventory INSERT" ON public.inventory
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Inventory UPDATE" ON public.inventory
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Inventory DELETE" ON public.inventory
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE POLICY "Transactions SELECT" ON public.transactions
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Transactions INSERT" ON public.transactions
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Transactions UPDATE" ON public.transactions
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Transactions DELETE" ON public.transactions
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- REVIEWS
-- -----------------------------------------------------------------------------
CREATE POLICY "Reviews SELECT" ON public.reviews
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Reviews INSERT" ON public.reviews
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Reviews UPDATE" ON public.reviews
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Reviews DELETE" ON public.reviews
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- -----------------------------------------------------------------------------
-- ACTIVITY_LOGS (Read-only for users, INSERT allowed for logging)
-- -----------------------------------------------------------------------------
CREATE POLICY "Activity Logs SELECT" ON public.activity_logs
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Activity Logs INSERT" ON public.activity_logs
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

-- -----------------------------------------------------------------------------
-- BETA WAITLIST
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can signup for beta" ON public.beta_waitlist
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist count" ON public.beta_waitlist
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Super admin can update waitlist" ON public.beta_waitlist
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

CREATE POLICY "Super admin can delete from waitlist" ON public.beta_waitlist
    FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
    );

-- -----------------------------------------------------------------------------
-- BETA INVITATIONS
-- -----------------------------------------------------------------------------
CREATE POLICY "beta_invitations_admin_all" ON public.beta_invitations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- -----------------------------------------------------------------------------
-- BETA USERS
-- -----------------------------------------------------------------------------
CREATE POLICY "beta_users_admin_all" ON public.beta_users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "beta_users_view_own" ON public.beta_users
    FOR SELECT USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- BETA FEATURE FLAGS
-- -----------------------------------------------------------------------------
CREATE POLICY "beta_features_read_all" ON public.beta_feature_flags
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "beta_features_admin_all" ON public.beta_feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- ============================================================================
-- 12. AUTOMATION TRIGGERS
-- ============================================================================

-- Auto-assign clinic_id based on current user's profile
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

-- Attach triggers to tables that need auto clinic_id assignment
CREATE TRIGGER trg_set_clinic_clients BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_client_notes BEFORE INSERT ON public.client_notes FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_client_photos BEFORE INSERT ON public.client_photos FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_services BEFORE INSERT ON public.services FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_inventory BEFORE INSERT ON public.inventory FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_staff BEFORE INSERT ON public.staff_availability FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_appointments BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_transactions BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_reviews BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();
CREATE TRIGGER trg_set_clinic_logs BEFORE INSERT ON public.activity_logs FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();

-- Set invitation code trigger
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_invitation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_beta_invitation
    BEFORE INSERT ON public.beta_invitations
    FOR EACH ROW EXECUTE FUNCTION set_invitation_code();

-- ============================================================================
-- 13. NEW USER HANDLER (SaaS Onboarding Logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
  invited_clinic_id UUID;
  invited_role TEXT;
BEGIN
    -- 1. Check for Pending Invitation
    SELECT clinic_id, role INTO invited_clinic_id, invited_role
    FROM public.invitations
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF invited_clinic_id IS NOT NULL THEN
        -- SCENARIO A: User is joining an existing clinic via invitation
        INSERT INTO public.profiles (id, clinic_id, full_name, email, role, avatar_url)
        VALUES (
            new.id, 
            invited_clinic_id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New Team Member'), 
            new.email,
            invited_role,
            new.raw_user_meta_data->>'avatar_url'
        );

        -- Mark invitation as accepted
        UPDATE public.invitations 
        SET status = 'accepted' 
        WHERE email = new.email AND clinic_id = invited_clinic_id;

    ELSE
        -- SCENARIO B: User is creating a BRAND NEW clinic (becomes Owner)
        INSERT INTO public.clinics (
            name,
            subscription_tier,
            subscription_status,
            trial_ends_at
        ) 
        VALUES (
            COALESCE(new.raw_user_meta_data->>'clinic_name', 'My New Clinic'),
            'FREE_TRIAL',
            'trialing',
            timezone('utc'::text, now() + interval '14 days')
        )
        RETURNING id INTO new_clinic_id;

        INSERT INTO public.profiles (id, clinic_id, full_name, email, role, avatar_url)
        VALUES (
            new.id, 
            new_clinic_id,
            new.raw_user_meta_data->>'full_name', 
            new.email,
            'owner',
            new.raw_user_meta_data->>'avatar_url'
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Beta user invitation handler
CREATE OR REPLACE FUNCTION public.handle_beta_user_invitation()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'is_beta_user')::boolean = true THEN
    INSERT INTO public.beta_users (
      user_id, email, waitlist_id, status, approved_at, invitation_accepted_at
    ) VALUES (
      NEW.id,
      NEW.email,
      (NEW.raw_user_meta_data->>'beta_waitlist_id')::uuid,
      'approved',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    IF (NEW.raw_user_meta_data->>'beta_waitlist_id') IS NOT NULL THEN
      UPDATE public.beta_waitlist
      SET status = 'converted', converted_at = NOW()
      WHERE id = (NEW.raw_user_meta_data->>'beta_waitlist_id')::uuid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_beta_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_beta_user_invitation();

-- ============================================================================
-- 14. REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;

-- ============================================================================
-- 15. STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory', 'inventory', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-photos', 'client-photos', true) ON CONFLICT (id) DO NOTHING;

-- AVATARS Policies
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Owner Update Avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CLINIC-ASSETS Policies
CREATE POLICY "Public Read Assets" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-assets');
CREATE POLICY "Authenticated Upload Assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');

-- INVENTORY Policies
CREATE POLICY "Public Read Inventory" ON storage.objects FOR SELECT USING (bucket_id = 'inventory');
CREATE POLICY "Authenticated Upload Inventory" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory');
CREATE POLICY "Owner Update/Delete Inventory" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'inventory' AND owner = auth.uid());

-- CLIENT-PHOTOS Policies
CREATE POLICY "Public Read Client Photos" ON storage.objects FOR SELECT USING (bucket_id = 'client-photos');
CREATE POLICY "Authenticated Upload Client Photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-photos');
CREATE POLICY "Owner Delete Client Photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-photos' AND owner = auth.uid());

-- ============================================================================
-- 16. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- Beta tables
GRANT SELECT, INSERT ON public.beta_waitlist TO anon;
GRANT ALL ON public.beta_waitlist TO authenticated;
GRANT SELECT ON public.beta_invitations TO authenticated;
GRANT SELECT ON public.beta_users TO authenticated;
GRANT SELECT ON public.beta_feature_flags TO authenticated;
GRANT ALL ON public.beta_invitations TO service_role;
GRANT ALL ON public.beta_users TO service_role;
GRANT ALL ON public.beta_feature_flags TO service_role;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_beta_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_beta_user_invitation() TO service_role;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

NOTIFY pgrst, 'reload config';
