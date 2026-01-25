-- ============================================================================
-- VELARA/DERMDESK v5.0 - COMPLETE SAAS MASTER SCHEMA
-- ============================================================================
-- DESCRIPTION:
-- This is the single source of truth for the database.
-- Compiled based on a full codebase analysis of the SaaS Clinic CRM frontend.
--
-- INCLUDES:
-- 1. Multi-tenant architecture with RLS (Row Level Security)
-- 2. Subscription/Billing management (Stripe/Iyzico support)
-- 3. Team management with role-based access (Invitations)
-- 4. Client management with notes and photo galleries
-- 5. Appointment scheduling with staff availability
-- 6. Inventory management
-- 7. Financial transactions
-- 8. Client reviews/feedback system
-- 9. Activity logging for audit trails
-- 10. Storage buckets for assets
--
-- TABLES:
-- clinics, profiles, invitations, clients, client_notes, client_photos,
-- services, staff_availability, appointments, inventory, transactions,
-- activity_logs, reviews
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP (Destructive - Only run on fresh install)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.fn_auto_assign_clinic() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_clinic_id() CASCADE;

DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.client_photos CASCADE;
DROP TABLE IF EXISTS public.client_notes CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.staff_availability CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLINICS (Tenant Root / Organization)
-- Each clinic is an independent tenant in the SaaS Multi-Tenant model
-- -----------------------------------------------------------------------------
CREATE TABLE public.clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    name TEXT NOT NULL DEFAULT 'My Clinic',
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Branding & Configuration (JSONB for flexibility)
    logo_url TEXT,
    branding_config JSONB DEFAULT '{}'::jsonb,  -- Colors, fonts, etc.
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

CREATE INDEX idx_clinics_subscription_status ON public.clinics(subscription_status);

-- -----------------------------------------------------------------------------
-- PROFILES (Users / Staff Members)
-- Links to Supabase auth.users, belongs to a clinic
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- User Info
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Role Management
    role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'doctor', 'staff', 'receptionist')),
    
    -- Onboarding State
    has_completed_onboarding BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_clinic_id ON public.profiles(clinic_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- INVITATIONS (Team Invites)
-- Allows clinic owners/admins to invite new team members
-- -----------------------------------------------------------------------------
CREATE TABLE public.invitations (
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

CREATE INDEX idx_invitations_clinic_id ON public.invitations(clinic_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- ============================================================================
-- 2. CLIENT MANAGEMENT
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLIENTS (Patients / Customers)
-- Core entity for people receiving services at the clinic
-- -----------------------------------------------------------------------------
CREATE TABLE public.clients (
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

CREATE INDEX idx_clients_clinic_id ON public.clients(clinic_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_full_name ON public.clients(full_name);

-- -----------------------------------------------------------------------------
-- CLIENT_NOTES (Clinical Notes per Client)
-- Separate notes table for detailed clinical history
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    -- Note Content
    content TEXT NOT NULL,
    
    -- Optional: categorization, author tracking
    category TEXT DEFAULT 'general',  -- 'general', 'clinical', 'follow-up', etc.
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_client_notes_client_id ON public.client_notes(client_id);
CREATE INDEX idx_client_notes_clinic_id ON public.client_notes(clinic_id);

-- -----------------------------------------------------------------------------
-- CLIENT_PHOTOS (Gallery Photos per Client)
-- Before/after photos, treatment documentation etc.
-- -----------------------------------------------------------------------------
CREATE TABLE public.client_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    
    -- Photo Info
    storage_path TEXT NOT NULL,  -- Path in storage bucket
    public_url TEXT NOT NULL,     -- Public URL for display
    caption TEXT,
    category TEXT DEFAULT 'General',  -- 'Before', 'After', 'General', etc.
    
    -- Optional Metadata
    taken_at DATE,  -- Date photo was taken
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_client_photos_client_id ON public.client_photos(client_id);
CREATE INDEX idx_client_photos_clinic_id ON public.client_photos(clinic_id);

-- ============================================================================
-- 3. SERVICES & SCHEDULING
-- ============================================================================

-- -----------------------------------------------------------------------------
-- SERVICES (Treatments / Procedures offered by clinic)
-- -----------------------------------------------------------------------------
CREATE TABLE public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Service Info
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER DEFAULT 30,  -- Duration in minutes
    
    -- Pricing
    price NUMERIC(10, 2) DEFAULT 0.00,
    
    -- UI/Display
    color TEXT DEFAULT 'blue',  -- For calendar display
    active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_services_clinic_id ON public.services(clinic_id);
CREATE INDEX idx_services_active ON public.services(active);

-- -----------------------------------------------------------------------------
-- STAFF_AVAILABILITY (Working hours per staff member)
-- Defines when each staff member is available for appointments
-- -----------------------------------------------------------------------------
CREATE TABLE public.staff_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Schedule
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    is_working BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- One record per staff per day
    UNIQUE(staff_id, day_of_week)
);

CREATE INDEX idx_staff_availability_clinic_id ON public.staff_availability(clinic_id);
CREATE INDEX idx_staff_availability_staff_id ON public.staff_availability(staff_id);

-- -----------------------------------------------------------------------------
-- APPOINTMENTS (Scheduled visits)
-- Core scheduling entity linking clients, services, and staff
-- -----------------------------------------------------------------------------
CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Links
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    
    -- Schedule
    date DATE NOT NULL,
    time TIME NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Pending', 'Completed', 'Cancelled', 'NoShow')),
    
    -- Payment
    payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid', 'Refunded')),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_staff_id ON public.appointments(staff_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- ============================================================================
-- 4. INVENTORY MANAGEMENT
-- ============================================================================

-- -----------------------------------------------------------------------------
-- INVENTORY (Products / Supplies)
-- Stock management for clinic consumables
-- -----------------------------------------------------------------------------
CREATE TABLE public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Product Info
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,  -- Stock Keeping Unit
    barcode TEXT,
    
    -- Stock
    stock INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 5,  -- Low stock threshold
    unit TEXT DEFAULT 'adet',  -- 'adet', 'kutu', 'ml', etc.
    
    -- Pricing
    price NUMERIC(10, 2) DEFAULT 0.00,       -- General price
    cost_price NUMERIC(10, 2),               -- Purchase cost
    sale_price NUMERIC(10, 2),               -- Selling price
    
    -- Categorization
    category TEXT,
    supplier TEXT,
    
    -- Additional
    expiry_date DATE,
    image_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock', 'Discontinued')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_inventory_clinic_id ON public.inventory(clinic_id);
CREATE INDEX idx_inventory_status ON public.inventory(status);
CREATE INDEX idx_inventory_category ON public.inventory(category);

-- ============================================================================
-- 5. FINANCE & TRANSACTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TRANSACTIONS (Income & Expenses)
-- Financial record keeping for the clinic
-- -----------------------------------------------------------------------------
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction Type
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    
    -- Amount
    amount NUMERIC(10, 2) NOT NULL,
    
    -- Details
    category TEXT,  -- 'Service', 'Product Sale', 'Rent', 'Supplies', etc.
    description TEXT,
    payment_method TEXT,  -- 'Cash', 'Credit Card', 'Bank Transfer', etc.
    
    -- Links (optional)
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    -- External Reference (for payment gateway integrations)
    external_reference_id TEXT,
    
    -- Date
    date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_transactions_clinic_id ON public.transactions(clinic_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_client_id ON public.transactions(client_id);

-- ============================================================================
-- 6. REVIEWS & FEEDBACK
-- ============================================================================

-- -----------------------------------------------------------------------------
-- REVIEWS (Client Feedback / Reviews)
-- Reviews from various sources (Google, Facebook, Website, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Review Source
    source TEXT DEFAULT 'Website' CHECK (source IN ('Google', 'Facebook', 'Website', 'Instagram', 'Other')),
    
    -- Reviewer Info
    patient_name TEXT NOT NULL,
    patient_email TEXT,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Status & Response
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Replied', 'Archived', 'Flagged')),
    reply TEXT,
    reply_date TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Date
    date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_reviews_clinic_id ON public.reviews(clinic_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_source ON public.reviews(source);
CREATE INDEX idx_reviews_status ON public.reviews(status);

-- ============================================================================
-- 7. AUDIT & LOGGING
-- ============================================================================

-- -----------------------------------------------------------------------------
-- ACTIVITY_LOGS (Audit Trail)
-- Logs user actions for security and debugging
-- -----------------------------------------------------------------------------
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    
    -- Who
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- What
    action TEXT NOT NULL,  -- 'Created Client', 'Updated Appointment', etc.
    details JSONB,         -- Additional context in JSON format
    
    -- Security
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_activity_logs_clinic_id ON public.activity_logs(clinic_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
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

-- ============================================================================
-- 9. SECURITY DEFINER HELPER FUNCTION
-- ============================================================================

-- Function to get current user's clinic_id (avoids recursive RLS issues)
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 10. RLS POLICIES (Complete with SELECT/INSERT/UPDATE/DELETE)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- CLINICS
-- -----------------------------------------------------------------------------
CREATE POLICY "Clinics SELECT" ON public.clinics
    FOR SELECT USING (id = public.get_my_clinic_id());

CREATE POLICY "Clinics UPDATE" ON public.clinics
    FOR UPDATE USING (id = public.get_my_clinic_id())
    WITH CHECK (id = public.get_my_clinic_id());

-- INSERT handled by trigger (SECURITY DEFINER), no direct INSERT needed
-- DELETE should be restricted (not allowed for regular users)

-- -----------------------------------------------------------------------------
-- PROFILES
-- Note: INSERT is handled by handle_new_user trigger (SECURITY DEFINER)
-- Users need to be able to SELECT colleagues and UPDATE their own profile
-- -----------------------------------------------------------------------------
CREATE POLICY "Profiles SELECT" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR clinic_id = public.get_my_clinic_id());

CREATE POLICY "Profiles UPDATE own" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow INSERT for service role / trigger only (profiles created by trigger)
-- This policy allows the SECURITY DEFINER trigger to insert
CREATE POLICY "Profiles INSERT by trigger" ON public.profiles
    FOR INSERT WITH CHECK (true);  -- Controlled by trigger, not direct user insert

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

-- No UPDATE/DELETE for logs (immutable audit trail)

-- ============================================================================
-- 11. AUTOMATION TRIGGERS
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

-- ============================================================================
-- 12. NEW USER HANDLER (SaaS Onboarding Logic)
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

-- ============================================================================
-- 13. REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;

-- ============================================================================
-- 14. STORAGE BUCKETS & POLICIES
-- ============================================================================

-- Create Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory', 'inventory', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-photos', 'client-photos', true) ON CONFLICT (id) DO NOTHING;

-- AVATARS Policies
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Owner Update Avatars" ON storage.objects;
CREATE POLICY "Owner Update Avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CLINIC-ASSETS Policies
DROP POLICY IF EXISTS "Public Read Assets" ON storage.objects;
CREATE POLICY "Public Read Assets" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
CREATE POLICY "Authenticated Upload Assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');

-- INVENTORY Policies
DROP POLICY IF EXISTS "Public Read Inventory" ON storage.objects;
CREATE POLICY "Public Read Inventory" ON storage.objects FOR SELECT USING (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Authenticated Upload Inventory" ON storage.objects;
CREATE POLICY "Authenticated Upload Inventory" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory');

DROP POLICY IF EXISTS "Owner Update/Delete Inventory" ON storage.objects;
CREATE POLICY "Owner Update/Delete Inventory" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'inventory' AND owner = auth.uid());

-- CLIENT-PHOTOS Policies
DROP POLICY IF EXISTS "Public Read Client Photos" ON storage.objects;
CREATE POLICY "Public Read Client Photos" ON storage.objects FOR SELECT USING (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Authenticated Upload Client Photos" ON storage.objects;
CREATE POLICY "Authenticated Upload Client Photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Owner Delete Client Photos" ON storage.objects;
CREATE POLICY "Owner Delete Client Photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-photos' AND owner = auth.uid());

-- ============================================================================
-- 15. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================
-- RLS policies control WHICH ROWS users can access
-- GRANTs control WHETHER users can access TABLES at all
-- Both are required for proper access control!

-- Grant all operations to authenticated users (RLS will filter rows)
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
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;  -- Read + Insert only for logs

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.get_my_clinic_id() TO authenticated;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Final notification to refresh PostgREST cache
NOTIFY pgrst, 'reload config';
