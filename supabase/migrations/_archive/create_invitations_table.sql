-- =====================================================
-- INVITATIONS TABLE FOR STAFF INVITATION SYSTEM
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'doctor', 'admin', 'receptionist')),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_clinic_id ON public.invitations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Clinic admins/owners can view their clinic's invitations
CREATE POLICY "Admins can view clinic invitations" ON public.invitations
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 2. Clinic admins/owners can create invitations
CREATE POLICY "Admins can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 3. Clinic admins/owners can update invitations (cancel)
CREATE POLICY "Admins can update invitations" ON public.invitations
    FOR UPDATE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 4. Clinic admins/owners can delete invitations
CREATE POLICY "Admins can delete invitations" ON public.invitations
    FOR DELETE USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 5. Anyone with valid token can read their own invitation (for accept flow)
CREATE POLICY "Users can view own invitation by token" ON public.invitations
    FOR SELECT USING (
        token IS NOT NULL AND status = 'pending'
    );

-- =====================================================
-- OPTIONAL: Auto-expire invitations function
-- =====================================================

-- Function to mark expired invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can set up a cron job in Supabase to run this daily:
-- SELECT cron.schedule('expire-invitations', '0 0 * * *', 'SELECT expire_old_invitations()');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon;
