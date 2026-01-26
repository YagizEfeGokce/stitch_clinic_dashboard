-- COMPREHENSIVE FIX: DATA SYNC & RLS
-- DESCRIPTION: Syncs Beta Waitlist data to Profiles and resets Feedback permissions.

-- 1. SYNC BETA DATA TO PROFILES (Phone & Email)
DO $$ 
BEGIN 
    -- Update Phone from Beta Waitlist (matching by email)
    -- We assume beta_waitlist has a 'phone' column. If not, this block handles the error gracefully or we assume it exists.
    -- To be safe, we check if column exists first.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beta_waitlist' AND column_name = 'phone') THEN
        UPDATE public.profiles p
        SET phone = b.phone
        FROM public.beta_waitlist b
        WHERE p.email = b.email
        AND (p.phone IS NULL OR p.phone = '');
    END IF;

    -- Update Email from Auth (Identity)
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id
    AND (p.email IS NULL OR p.email = '');
    
END $$;

-- 2. FORCE FIX RLS ON FEEDBACK TABLE
-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can update feedback" ON public.feedback;
DROP POLICY IF EXISTS "Super Admin View All Feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Super Admin Update Feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;

-- Re-Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy A: Super Admin FULL ACCESS (Select, Update, Delete)
CREATE POLICY "Super Admin Full Access" 
ON public.feedback 
FOR ALL 
USING (
    (auth.jwt() ->> 'email') = 'relre434@gmail.com'
);

-- Policy B: Regular Users (Insert Own)
CREATE POLICY "Users insert own" 
ON public.feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy C: Regular Users (View Own)
CREATE POLICY "Users view own" 
ON public.feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. VERIFY & FIX RELATIONSHIPS
-- Ensure user_id in feedback points to valid profiles
DELETE FROM public.feedback WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.profiles);

-- Reload Schema
NOTIFY pgrst, 'reload schema';
