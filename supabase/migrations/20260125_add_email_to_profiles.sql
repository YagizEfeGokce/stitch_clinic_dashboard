-- ENHANCE PROFILES & BACKFILL EMAIL
-- 1. Add email column to profiles if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email from auth.users (One-time fix)
DO $$ 
BEGIN 
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id
    AND p.email IS NULL;
END $$;

-- 3. Update 'handle_new_user' trigger to save email automatically for NEW users
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
        -- SCENARIO A: User is joining an existing clinic
        INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url, email) -- Added email
        VALUES (
            new.id, 
            invited_clinic_id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New Team Member'), 
            invited_role,
            new.raw_user_meta_data->>'avatar_url',
            new.email -- Added email
        );

        -- Mark invitation as accepted
        UPDATE public.invitations 
        SET status = 'accepted' 
        WHERE email = new.email AND clinic_id = invited_clinic_id;

    ELSE
        -- SCENARIO B: User is creating a BRAND NEW clinic (Owner)
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

        INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url, email) -- Added email
        VALUES (
            new.id, 
            new_clinic_id,
            new.raw_user_meta_data->>'full_name', 
            'owner',
            new.raw_user_meta_data->>'avatar_url',
            new.email -- Added email
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
