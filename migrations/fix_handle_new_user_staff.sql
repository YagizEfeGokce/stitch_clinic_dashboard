-- ============================================================================
-- MIGRATION: FIX handle_new_user FOR STAFF INVITES
-- ============================================================================
-- Description: 
-- Updates the `handle_new_user` trigger function to check for `clinic_id` 
-- in the user metadata. If present, adds the user to that clinic. 
-- If absent, proceeds with creating a new clinic (default sign-up flow).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_clinic_id UUID;
  target_role TEXT;
BEGIN
  -- Check if a clinic_id is provided in the metadata (passed from frontend during invite)
  -- We cast to UUID safely (if null, it remains null)
  target_clinic_id := (new.raw_user_meta_data->>'clinic_id')::UUID;
  
  -- Determine role: prefer metadata role, fallback to 'owner' only if creating new clinic
  target_role := new.raw_user_meta_data->>'role';

  IF target_clinic_id IS NOT NULL THEN
    -- CASE 1: User is being invited to an EXISTING clinic
    -- Insert into profiles linked to the existing clinic
    INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url)
    VALUES (
        new.id,
        target_clinic_id, -- Use the provided clinic ID
        new.raw_user_meta_data->>'full_name',
        COALESCE(target_role, 'staff'), -- Default to 'staff' if role is missing in invite
        new.raw_user_meta_data->>'avatar_url'
    );
  ELSE
    -- CASE 2: User is signing up for a NEW clinic (Standard Sign Up)
    -- 1. Create the new clinic
    INSERT INTO public.clinics (name) 
    VALUES (COALESCE(new.raw_user_meta_data->>'clinic_name', 'My New Clinic'))
    RETURNING id INTO target_clinic_id;

    -- 2. Create the owner profile linked to the new clinic
    INSERT INTO public.profiles (id, clinic_id, full_name, role, avatar_url)
    VALUES (
        new.id, 
        target_clinic_id,
        new.raw_user_meta_data->>'full_name', 
        'owner', -- Force role to owner for new clinic creators
        new.raw_user_meta_data->>'avatar_url'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
