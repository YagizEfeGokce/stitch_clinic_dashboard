-- ============================================================================
-- CLOSED BETA SYSTEM SCHEMA
-- Run this in Supabase SQL Editor after create_beta_waitlist_table.sql
-- ============================================================================

-- Beta Invitations Table
CREATE TABLE IF NOT EXISTS public.beta_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Invitation details
    code TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    waitlist_id UUID REFERENCES public.beta_waitlist(id) ON DELETE SET NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    
    -- Metadata
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    batch_number INT,
    notes TEXT
);

-- Beta Users Table (tracks who has access)
CREATE TABLE IF NOT EXISTS public.beta_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    waitlist_id UUID REFERENCES public.beta_waitlist(id) ON DELETE SET NULL,
    invitation_id UUID REFERENCES public.beta_invitations(id) ON DELETE SET NULL,
    
    -- Access control
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'suspended', 'removed')),
    approved_at TIMESTAMPTZ DEFAULT now(),
    first_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    
    -- Engagement tracking
    onboarding_completed BOOLEAN DEFAULT FALSE,
    feedback_given BOOLEAN DEFAULT FALSE,
    referred_count INT DEFAULT 0
);

-- Beta Feature Flags (control who sees what)
CREATE TABLE IF NOT EXISTS public.beta_feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    feature_key TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- Enable RLS
ALTER TABLE public.beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Super admin can manage all beta invitations
CREATE POLICY "beta_invitations_admin_all"
ON public.beta_invitations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Super admin can manage all beta users
CREATE POLICY "beta_users_admin_all"
ON public.beta_users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Users can view their own beta status
CREATE POLICY "beta_users_view_own"
ON public.beta_users FOR SELECT
USING (user_id = auth.uid());

-- Policy: Feature flags readable by all authenticated users
CREATE POLICY "beta_features_read_all"
ON public.beta_feature_flags FOR SELECT
TO authenticated
USING (true);

-- Policy: Only super admin can manage feature flags
CREATE POLICY "beta_features_admin_all"
ON public.beta_feature_flags FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_beta_invitations_code ON public.beta_invitations(code);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_email ON public.beta_invitations(email);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_status ON public.beta_invitations(status);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_expires_at ON public.beta_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_beta_users_user_id ON public.beta_users(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_users_email ON public.beta_users(email);
CREATE INDEX IF NOT EXISTS idx_beta_users_status ON public.beta_users(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique 8-character invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.beta_invitations WHERE code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invitation code if not provided
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_invitation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_beta_invitation ON public.beta_invitations;
CREATE TRIGGER before_insert_beta_invitation
    BEFORE INSERT ON public.beta_invitations
    FOR EACH ROW
    EXECUTE FUNCTION set_invitation_code();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.beta_invitations TO authenticated;
GRANT SELECT ON public.beta_users TO authenticated;
GRANT SELECT ON public.beta_feature_flags TO authenticated;
GRANT ALL ON public.beta_invitations TO service_role;
GRANT ALL ON public.beta_users TO service_role;
GRANT ALL ON public.beta_feature_flags TO service_role;
