-- =============================================================================
-- DERMDESK APPOINTMENT CANCELLATION TOKENS MIGRATION
-- Run this in Supabase SQL Editor
-- Date: 2026-02-03
-- =============================================================================

-- Add cancellation token columns to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cancellation_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS cancellation_token_expires_at timestamptz;

-- Set expiry for existing appointments (30 days from now or appointment date + 24h, whichever is later)
UPDATE public.appointments
SET cancellation_token_expires_at = GREATEST(
    now() + interval '30 days',
    (date + time::interval + interval '24 hours')::timestamptz
)
WHERE cancellation_token_expires_at IS NULL;

-- Add column for cancellation reason if not exists
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- RLS Policy: Allow anonymous users to SELECT appointments by valid cancellation token
DROP POLICY IF EXISTS "Public can view appointments by cancellation token" ON appointments;
CREATE POLICY "Public can view appointments by cancellation token" ON appointments
FOR SELECT TO anon
USING (
    cancellation_token IS NOT NULL AND
    cancellation_token_expires_at > now()
);

-- RLS Policy: Allow anonymous users to UPDATE (cancel) appointments by valid token
DROP POLICY IF EXISTS "Public can cancel appointments by token" ON appointments;
CREATE POLICY "Public can cancel appointments by token" ON appointments
FOR UPDATE TO anon
USING (
    cancellation_token IS NOT NULL AND
    cancellation_token_expires_at > now() AND
    status NOT IN ('Cancelled', 'Completed', 'NoShow')
)
WITH CHECK (status = 'Cancelled');

-- Add comments
COMMENT ON COLUMN public.appointments.cancellation_token IS 'UUID token for customer self-service cancellation';
COMMENT ON COLUMN public.appointments.cancellation_token_expires_at IS 'Expiry timestamp for cancellation token';
COMMENT ON COLUMN public.appointments.cancellation_reason IS 'Reason for cancellation (if cancelled)';

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE '✅ Appointment cancellation tokens migration completed!';
    RAISE NOTICE '📋 Added: cancellation_token, cancellation_token_expires_at, cancellation_reason';
    RAISE NOTICE '📋 Added: RLS policies for public cancellation access';
END $$;
