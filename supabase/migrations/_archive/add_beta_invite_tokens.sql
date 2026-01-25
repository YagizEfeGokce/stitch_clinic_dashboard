-- Migration to add invite token support to beta_waitlist
ALTER TABLE public.beta_waitlist
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_beta_waitlist_token ON public.beta_waitlist(invite_token);

-- Update RLS to allow public access to validate token (needed for signup page)
-- We need a policy that allows anyone (ANON) to SELECT row if they have the token
CREATE POLICY "Anon can validate invite token"
ON public.beta_waitlist
FOR SELECT
TO anon
USING (invite_token IS NOT NULL);
