-- FIX: Grant RLS bypass to Service Role for Edge Functions
-- By default, even service role adheres to RLS in some Supabase configs if not explicit.
-- We want to ensure the Service Role (used by Edge Function) has FULL ACCESS.

-- 1. Create a policy for Service Role to do ANYTHING on beta_waitlist
CREATE POLICY "Service Role Full Access"
ON public.beta_waitlist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Grant Table Permissions just in case
GRANT ALL ON public.beta_waitlist TO service_role;
