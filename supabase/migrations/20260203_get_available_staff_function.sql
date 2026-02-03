-- =============================================================================
-- DERMDESK STAFF AVAILABILITY CHECK FUNCTION
-- Run this in Supabase SQL Editor
-- Date: 2026-02-03
-- =============================================================================

-- Function to get available staff for a specific date/time slot
CREATE OR REPLACE FUNCTION public.get_available_staff(
    p_clinic_id uuid,
    p_date date,
    p_time time,
    p_duration_min integer DEFAULT 30
)
RETURNS TABLE (
    staff_id uuid,
    full_name text,
    role text,
    avatar_url text,
    is_available boolean,
    unavailable_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_day_name text;
    v_end_time time;
BEGIN
    -- Get day name for availability check
    v_day_name := to_char(p_date, 'FMDay');
    
    -- Calculate appointment end time
    v_end_time := (p_time + (p_duration_min || ' minutes')::interval)::time;
    
    RETURN QUERY
    SELECT 
        p.id as staff_id,
        p.full_name,
        p.role,
        p.avatar_url,
        
        -- Is Available Check
        CASE
            -- Check 1: Staff has availability record for this day and is working
            WHEN NOT EXISTS (
                SELECT 1 FROM staff_availability sa
                WHERE sa.staff_id = p.id
                AND LOWER(TRIM(sa.day_of_week)) = LOWER(TRIM(v_day_name))
                AND sa.is_working = true
                AND sa.start_time <= p_time
                AND sa.end_time >= v_end_time
            ) THEN false
            
            -- Check 2: No conflicting appointments
            WHEN EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.staff_id = p.id
                AND a.date = p_date
                AND a.status NOT IN ('Cancelled', 'NoShow')
                AND (
                    -- New appointment starts during existing
                    (p_time >= a.time AND p_time < (a.time + ((COALESCE(s.duration_min, 30)) || ' minutes')::interval)::time)
                    OR
                    -- New appointment ends during existing
                    (v_end_time > a.time AND v_end_time <= (a.time + ((COALESCE(s.duration_min, 30)) || ' minutes')::interval)::time)
                    OR
                    -- New appointment contains existing
                    (p_time <= a.time AND v_end_time >= (a.time + ((COALESCE(s.duration_min, 30)) || ' minutes')::interval)::time)
                )
            ) THEN false
            
            ELSE true
        END as is_available,
        
        -- Unavailable Reason
        CASE
            -- No availability record or not working
            WHEN NOT EXISTS (
                SELECT 1 FROM staff_availability sa
                WHERE sa.staff_id = p.id
                AND LOWER(TRIM(sa.day_of_week)) = LOWER(TRIM(v_day_name))
                AND sa.is_working = true
            ) THEN 'Çalışmıyor'
            
            -- Working but outside hours
            WHEN NOT EXISTS (
                SELECT 1 FROM staff_availability sa
                WHERE sa.staff_id = p.id
                AND LOWER(TRIM(sa.day_of_week)) = LOWER(TRIM(v_day_name))
                AND sa.is_working = true
                AND sa.start_time <= p_time
                AND sa.end_time >= v_end_time
            ) THEN 'Saat Dışı'
            
            -- Has conflicting appointment
            WHEN EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.staff_id = p.id
                AND a.date = p_date
                AND a.status NOT IN ('Cancelled', 'NoShow')
                AND p_time < (a.time + ((COALESCE((SELECT duration_min FROM services WHERE id = a.service_id), 30)) || ' minutes')::interval)::time
                AND v_end_time > a.time
            ) THEN 'Randevusu Var'
            
            ELSE 'Müsait'
        END as unavailable_reason
        
    FROM profiles p
    LEFT JOIN services s ON true -- For duration calculation in subquery
    WHERE p.clinic_id = p_clinic_id
    AND p.role IN ('doctor', 'staff', 'owner', 'admin')
    AND p.is_active IS NOT FALSE
    GROUP BY p.id, p.full_name, p.role, p.avatar_url
    ORDER BY 
        -- Available staff first
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM staff_availability sa
            WHERE sa.staff_id = p.id
            AND LOWER(TRIM(sa.day_of_week)) = LOWER(TRIM(v_day_name))
            AND sa.is_working = true
            AND sa.start_time <= p_time
            AND sa.end_time >= v_end_time
        ) THEN 1 ELSE 0 END,
        p.full_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_available_staff(uuid, date, time, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_staff(uuid, date, time, integer) TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_available_staff IS 'Returns staff members with their availability status for a specific date/time slot';

DO $$
BEGIN
    RAISE NOTICE '✅ get_available_staff function created successfully!';
END $$;
