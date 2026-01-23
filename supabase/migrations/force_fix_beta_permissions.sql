-- FORCE FIX Permissions

-- 1. Force the current user (you) to be 'super_admin' explicitly
-- This handles the case where the previous update didn't stick or matched the wrong row
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = auth.uid();

-- 2. Grant explicit table permissions to 'authenticated' role
-- RLS controls row access, but the role needs basic table privileges first
GRANT ALL ON public.beta_invitations TO authenticated;
GRANT ALL ON public.beta_waitlist TO authenticated;
GRANT ALL ON public.beta_users TO authenticated;
GRANT ALL ON public.beta_feature_flags TO authenticated;

-- 3. Grant execute on the security check function
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;

-- 4. Just in case: Create a permissive policy for testing (If this works, we know it was RLS)
DROP POLICY IF EXISTS "Emergency Admin Access" ON public.beta_invitations;
CREATE POLICY "Emergency Admin Access"
ON public.beta_invitations
FOR ALL
TO authenticated
USING ( 
    -- Allow if super admin OR if the profiles table says so directly (double check)
    public.is_super_admin() 
    OR 
    (select role from public.profiles where id = auth.uid()) = 'super_admin'
)
WITH CHECK (
    -- Strict check for INSERT/UPDATE as well
    public.is_super_admin() 
    OR 
    (select role from public.profiles where id = auth.uid()) = 'super_admin'
);

-- 5. Return current status for verification
SELECT id, email, role FROM public.profiles WHERE id = auth.uid();
