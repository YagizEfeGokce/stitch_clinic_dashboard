-- ============================================================================
-- FIX BETA INVITATION FLOW - SUPABASE NATIVE INVITATIONS
-- Date: 2026-01-23
-- Purpose: Switch from custom code-based invitations to Supabase native inviteUserByEmail
-- ============================================================================

-- ============================================================================
-- STEP 1: Add metadata columns to beta_users table
-- ============================================================================

ALTER TABLE public.beta_users
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.beta_users.invitation_sent_at IS 'When Supabase invitation email was sent';
COMMENT ON COLUMN public.beta_users.invitation_accepted_at IS 'When user clicked invitation link and created account';

-- ============================================================================
-- STEP 2: Update RLS Policies for Beta User Access
-- ============================================================================

-- Helper function to check if user is beta user (via user_metadata or beta_users table)
CREATE OR REPLACE FUNCTION public.is_beta_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check user_metadata first (set by Supabase invitation)
  IF (auth.jwt() -> 'user_metadata' ->> 'is_beta_user')::boolean = true THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: Check beta_users table
  RETURN EXISTS (
    SELECT 1 FROM public.beta_users
    WHERE beta_users.user_id = user_id
    AND beta_users.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 3: Add Beta User RLS Policies to Domain Tables
-- ============================================================================

-- CLIENTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'beta_users_full_access_clients'
  ) THEN
    CREATE POLICY "beta_users_full_access_clients"
    ON public.clients
    FOR ALL
    TO authenticated
    USING (
      public.is_beta_user(auth.uid())
    );
  END IF;
END $$;

-- APPOINTMENTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'beta_users_full_access_appointments'
  ) THEN
    CREATE POLICY "beta_users_full_access_appointments"
    ON public.appointments
    FOR ALL
    TO authenticated
    USING (
      public.is_beta_user(auth.uid())
    );
  END IF;
END $$;

-- INVENTORY TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'beta_users_full_access_inventory'
  ) THEN
    CREATE POLICY "beta_users_full_access_inventory"
    ON public.inventory
    FOR ALL
    TO authenticated
    USING (
      public.is_beta_user(auth.uid())
    );
  END IF;
END $$;

-- TREATMENTS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'treatments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'treatments' AND policyname = 'beta_users_full_access_treatments'
    ) THEN
      CREATE POLICY "beta_users_full_access_treatments"
      ON public.treatments
      FOR ALL
      TO authenticated
      USING (
        public.is_beta_user(auth.uid())
      );
    END IF;
  END IF;
END $$;

-- TRANSACTIONS TABLE (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'beta_users_full_access_transactions'
    ) THEN
      CREATE POLICY "beta_users_full_access_transactions"
      ON public.transactions
      FOR ALL
      TO authenticated
      USING (
        public.is_beta_user(auth.uid())
      );
    END IF;
  END IF;
END $$;

-- CLINICS TABLE (Beta users can create and manage their own clinic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clinics' AND policyname = 'beta_users_full_access_clinics'
  ) THEN
    CREATE POLICY "beta_users_full_access_clinics"
    ON public.clinics
    FOR ALL
    TO authenticated
    USING (
      public.is_beta_user(auth.uid())
    );
  END IF;
END $$;

-- PROFILES TABLE (Beta users can update their own profile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'beta_users_update_own_profile'
  ) THEN
    CREATE POLICY "beta_users_update_own_profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
      id = auth.uid() AND public.is_beta_user(auth.uid())
    )
    WITH CHECK (
      id = auth.uid() AND public.is_beta_user(auth.uid())
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create trigger to auto-create beta_users entry on invitation acceptance
-- ============================================================================

-- This trigger will fire when a new user is created via invitation
-- and automatically add them to beta_users table
CREATE OR REPLACE FUNCTION public.handle_beta_user_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a beta invitation (user_metadata contains is_beta_user)
  IF (NEW.raw_user_meta_data->>'is_beta_user')::boolean = true THEN
    
    -- Insert into beta_users table
    INSERT INTO public.beta_users (
      user_id,
      email,
      waitlist_id,
      status,
      approved_at,
      invitation_accepted_at
    ) VALUES (
      NEW.id,
      NEW.email,
      (NEW.raw_user_meta_data->>'beta_waitlist_id')::uuid,
      'approved',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate entries
    
    -- Update waitlist status to converted if waitlist_id exists
    IF (NEW.raw_user_meta_data->>'beta_waitlist_id') IS NOT NULL THEN
      UPDATE public.beta_waitlist
      SET 
        status = 'converted',
        converted_at = NOW()
      WHERE id = (NEW.raw_user_meta_data->>'beta_waitlist_id')::uuid;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_beta_invitation ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_beta_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_beta_user_invitation();

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_beta_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_beta_user_invitation() TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify beta_users table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'beta_users' 
-- ORDER BY ordinal_position;

-- Verify RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE policyname LIKE '%beta_users%';

-- Verify function exists
-- SELECT proname, proargtypes, prosrc 
-- FROM pg_proc 
-- WHERE proname IN ('is_beta_user', 'handle_beta_user_invitation');
