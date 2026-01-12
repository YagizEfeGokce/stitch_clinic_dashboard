-- ============================================================================
-- MIGRATION: TEAM INVITATIONS SYSTEM
-- ============================================================================

-- 1. Create Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'staff')),
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL,
    UNIQUE(clinic_id, email)
);

-- 2. Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Invitations

-- Policy: Admin/Owner can view invitations for their clinic
CREATE POLICY "Admins view invitations" ON public.invitations
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Policy: Admin/Owner can create invitations for their clinic
CREATE POLICY "Admins create invitations" ON public.invitations
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Policy: Admin/Owner can delete invitations for their clinic
CREATE POLICY "Admins delete invitations" ON public.invitations
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 4. Update handle_new_user Trigger to support joining via invitation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
  invited_clinic_id UUID;
  invited_role TEXT;
BEGIN
    -- Check if there is a pending invitation for this email
    SELECT clinic_id, role INTO invited_clinic_id, invited_role
    FROM public.invitations
    WHERE email = new.email AND status = 'pending'
    LIMIT 1;

    IF invited_clinic_id IS NOT NULL THEN
        -- CASE 1: User is invited. Join existing clinic.
        INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url)
        VALUES (
            new.id, 
            invited_clinic_id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New Team Member'), 
            invited_role,
            new.raw_user_meta_data->>'avatar_url'
        );

        -- Update invitation status to accepted
        UPDATE public.invitations 
        SET status = 'accepted' 
        WHERE email = new.email AND clinic_id = invited_clinic_id;

    ELSE
        -- CASE 2: Regular sign up. Create new clinic.
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
        
        -- Add 14-day trial (from previous migration logic, ensuring it persists)
        UPDATE public.clinics
        SET 
            subscription_tier = 'FREE_TRIAL',
            subscription_status = 'trialing',
            trial_ends_at = timezone('utc'::text, now() + interval '14 days')
        WHERE id = new_clinic_id;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
