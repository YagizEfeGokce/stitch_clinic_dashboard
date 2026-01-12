-- ============================================================================
-- SUPER ADMIN SETUP
-- ============================================================================

-- 1. Helper to Check Super Admin Status
-- Checks if the current user has the 'super_admin' role in app_metadata OR a specific email
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Strict Email Check
  RETURN (
    current_setting('request.jwt.claim.sub', true) IS NOT NULL AND (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'yagiz.gokce19@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Platform Stats (Aggregated Data)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSONB AS $$
DECLARE
    total_clinics INT;
    active_pro_users INT;
    total_appointments INT;
    total_revenue NUMERIC; -- Mock calculation
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Super Admin Only';
    END IF;

    SELECT COUNT(*) INTO total_clinics FROM public.clinics;
    
    SELECT COUNT(*) INTO active_pro_users 
    FROM public.clinics 
    WHERE subscription_tier = 'pro' AND subscription_status = 'active';

    SELECT COUNT(*) INTO total_appointments FROM public.appointments;

    -- Mock Revenue Calculation (e.g. 2499 * Pro Users)
    total_revenue := active_pro_users * 2499;

    RETURN jsonb_build_object(
        'total_clinics', total_clinics,
        'active_pro_users', active_pro_users,
        'total_appointments', total_appointments,
        'mrr', total_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get All Clinics List
CREATE OR REPLACE FUNCTION public.get_all_clinics()
RETURNS TABLE (
    id UUID,
    name TEXT,
    created_at TIMESTAMPTZ,
    subscription_tier TEXT,
    subscription_status TEXT,
    owner_email TEXT
) AS $$
BEGIN
    -- Security Check
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Super Admin Only';
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.created_at,
        c.subscription_tier,
        c.subscription_status,
        (SELECT email FROM auth.users WHERE id = (
            SELECT p.id FROM public.profiles p WHERE p.clinic_id = c.id AND p.role = 'owner' LIMIT 1
        )) as owner_email
    FROM public.clinics c
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
