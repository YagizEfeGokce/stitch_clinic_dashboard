-- RPC FUNCTIONS FOR SUPER ADMIN
-- Solves RLS and Data Joining issues by running as Database Owner

-- 1. Helper to check Admin
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS VOID AS $$
BEGIN
  IF (auth.jwt() ->> 'email') <> 'relre434@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. SECURE FETCH FUNCTION
-- Joins feedback -> profiles -> auth.users (for email) + beta_waitlist (for phone backup)
CREATE OR REPLACE FUNCTION public.get_admin_feedbacks()
RETURNS TABLE (
    id UUID,
    message TEXT,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    user_email TEXT,
    user_phone TEXT,
    user_fullname TEXT,
    clinic_name TEXT
) 
SECURITY DEFINER -- Runs as DB owner to access auth.users
SET search_path = public, auth -- Set search path for safety
AS $$
BEGIN
    -- Verify Admin
    PERFORM public.check_is_super_admin();

    RETURN QUERY
    SELECT 
        f.id,
        f.message,
        COALESCE(f.type, 'general'),
        COALESCE(f.status, 'new'),
        f.created_at,
        -- Try to get email from profile, fallback to auth.users, fallback to beta_waitlist
        COALESCE(p.email, u.email, b.email, 'Bilinmiyor') as user_email,
        -- Try to get phone from profile, fallback to beta_waitlist
        COALESCE(p.phone, b.phone, '-') as user_phone,
        COALESCE(p.full_name, 'İsimsiz') as user_fullname,
        COALESCE(c.name, 'Klinik Yok') as clinic_name
    FROM 
        public.feedback f
    LEFT JOIN 
        public.profiles p ON f.user_id = p.id
    LEFT JOIN 
        public.clinics c ON f.clinic_id = c.id
    LEFT JOIN 
        auth.users u ON f.user_id = u.id
    LEFT JOIN
        public.beta_waitlist b ON u.email = b.email -- Link by email to finding original beta data
    ORDER BY 
        f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. SECURE UPDATE FUNCTION
CREATE OR REPLACE FUNCTION public.update_feedback_status_admin(
    feedback_id UUID,
    new_status TEXT
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verify Admin
    PERFORM public.check_is_super_admin();

    UPDATE public.feedback
    SET status = new_status
    WHERE id = feedback_id;

    -- Return success
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_admin_feedbacks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_feedback_status_admin(UUID, TEXT) TO authenticated;

-- Reload
NOTIFY pgrst, 'reload schema';
