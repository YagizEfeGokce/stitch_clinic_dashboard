-- RPC for Fetching Clients with Computed Stats (UPDATED)
-- Logic Match: Matches ClientProfile.jsx "Value" calculation.
-- Rule: Use Transaction Sum (Income) if available; otherwise fallback to sum of Service Prices for 'Completed' appointments.

CREATE OR REPLACE FUNCTION public.get_clients_with_stats(
    p_clinic_id UUID
)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    last_visit TIMESTAMP, 
    total_spend NUMERIC,
    appointment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Security Check
    IF (auth.jwt() ->> 'email') <> 'relre434@gmail.com' THEN
         IF NOT EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND clinic_id = p_clinic_id
         ) THEN
             RAISE EXCEPTION 'Access Denied';
         END IF;
    END IF;

    RETURN QUERY
    WITH client_stats AS (
        SELECT 
            c2.id as client_id,
            -- 1. Real Revenue from Transactions (linked via appointments)
            COALESCE(
                (
                    SELECT SUM(t.amount)
                    FROM public.transactions t
                    JOIN public.appointments a ON t.appointment_id = a.id
                    WHERE a.client_id = c2.id AND t.type = 'income'
                ), 
            0) as real_revenue,
            -- 2. Estimated Revenue from Service Prices (Completed Appointments)
            COALESCE(
                (
                    SELECT SUM(s.price)
                    FROM public.appointments a
                    LEFT JOIN public.services s ON a.service_id = s.id
                    WHERE a.client_id = c2.id AND a.status = 'Completed'
                ), 
            0) as estimated_revenue,
            -- 3. Last Visit
            (
                SELECT MAX(a.date + a.time)
                FROM public.appointments a
                WHERE a.client_id = c2.id AND a.status = 'Completed'
            ) as last_visit_date,
            -- 4. Appointment Count
            (
                SELECT COUNT(*)
                FROM public.appointments a
                WHERE a.client_id = c2.id
            ) as appt_count
        FROM public.clients c2
        WHERE c2.clinic_id = p_clinic_id
    )
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.status,
        c.image_url,
        c.created_at,
        stats.last_visit_date::TIMESTAMP as last_visit,
        -- LOGIC MATCH: If Real Revenue > 0, use it. Else use Estimated Revenue.
        CASE 
            WHEN stats.real_revenue > 0 THEN stats.real_revenue 
            ELSE stats.estimated_revenue 
        END as total_spend,
        stats.appt_count as appointment_count
    FROM 
        public.clients c
    JOIN 
        client_stats stats ON c.id = stats.client_id
    ORDER BY 
        c.created_at DESC;
END;
$$;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
