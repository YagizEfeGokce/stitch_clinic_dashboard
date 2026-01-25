-- ============================================================================
-- DERMDESK EMERGENCY ROLE FIX
-- ============================================================================
-- Problem: Migration set default role to 'staff', locking out founders.
-- Fix: Upgrades specific user (or all current users) to 'owner'.
-- ============================================================================

-- Option 1: Fix specific user (Recommended)
UPDATE public.profiles
SET role = 'owner'
WHERE email = 'dsaadsad@gmail.com';

-- Option 2: Fix ALL existing users (Use if all current users are admins)
-- UPDATE public.profiles SET role = 'owner' WHERE role = 'staff';

-- Verify the change
SELECT email, role, full_name FROM public.profiles WHERE email = 'dsaadsad@gmail.com';
