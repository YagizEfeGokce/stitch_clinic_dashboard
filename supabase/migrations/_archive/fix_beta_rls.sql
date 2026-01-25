-- RLS Policies for Beta Onboarding Flow

-- 1. Allow authenticated users to insert their own beta profile
CREATE POLICY "Users can insert own beta profile"
ON public.beta_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow authenticated users to update their own waitlist entry (to mark as converted)
-- We match by email since the user is now signed up with that email
CREATE POLICY "Users can update own waitlist status"
ON public.beta_waitlist
FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');

-- 3. Ensure beta_users is viewable by the user
CREATE POLICY "Users can view own beta profile"
ON public.beta_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
