-- FIXED RPC: RESOLVE AMBIGUITY
-- Replaces CTE with direct correlated subqueries to avoid "ambiguous column" errors.
-- Maintains the exact logic: Real Revenue > 0 ? Real : Estimated.

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
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.status,
        c.image_url,
        c.created_at,
        
        -- 1. Last Visit: Max date of completed appointment
        (
            SELECT MAX(a.date + a.time)
            FROM public.appointments a
            WHERE a.client_id = c.id AND a.status = 'Completed'
        )::TIMESTAMP as last_visit,

        -- 2. Total Spend: Fallback Logic
        -- Logic: If the sum of INCOME transactions linked to this client's appointments is > 0, use it.
        -- Otherwise, sum the PRICES of the Services for Completed appointments.
        COALESCE(
            NULLIF(
                (
                    SELECT SUM(t.amount)
                    FROM public.transactions t
                    JOIN public.appointments a ON t.appointment_id = a.id
                    WHERE a.client_id = c.id AND t.type = 'income'
                ), 0
            ),
            (
                SELECT SUM(s.price)
                FROM public.appointments a2
                LEFT JOIN public.services s ON a2.service_id = s.id
                WHERE a2.client_id = c.id AND a2.status = 'Completed'
            ),
            0
        ) as total_spend,

        -- 3. Appointment Count
        (
            SELECT COUNT(*) 
            FROM public.appointments a3
            WHERE a3.client_id = c.id
        ) as appointment_count

    FROM 
        public.clients c
    WHERE 
        c.clinic_id = p_clinic_id
    ORDER BY 
        c.created_at DESC;
END;
$$;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
