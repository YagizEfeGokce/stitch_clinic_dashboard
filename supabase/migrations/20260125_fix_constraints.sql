-- FIX CONSTRAINT ERROR
-- The table has a CHECK constraint that prevents setting status to 'dismissed' or 'resolved'.
-- We need to update this constraint to allow our values.

-- 1. Drop the old restrictive constraint
ALTER TABLE public.feedback 
DROP CONSTRAINT IF EXISTS feedback_status_check;

-- 2. Add a new, more permissive constraint
ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_status_check 
CHECK (status IN ('new', 'resolved', 'dismissed', 'pending', 'in_progress'));

-- 3. Ensure 'type' constraint is also flexible (just in case)
ALTER TABLE public.feedback 
DROP CONSTRAINT IF EXISTS feedback_type_check;

ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_type_check 
CHECK (type IN ('general', 'bug', 'feature', 'other'));

-- Reload schema
NOTIFY pgrst, 'reload schema';
