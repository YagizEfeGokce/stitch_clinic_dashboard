-- RPC for Fetching Clients with Computed Stats
-- Fixes: "Total Spending" showing 0 in client list.
-- Aggregates data from appointments and transactions efficiently.

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
    -- Security Check: Ensure the user belongs to the requested clinic (or is super admin)
    -- This prevents leaking other clinics' data via this function
    IF (auth.jwt() ->> 'email') <> 'relre434@gmail.com' THEN
         -- Regular user check: valid profile in this clinic
         IF NOT EXISTS (
             SELECT 1 FROM public.profiles 
             WHERE id = auth.uid() AND clinic_id = p_clinic_id
         ) THEN
             RAISE EXCEPTION 'Access Denied';
         END IF;
    END IF;

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
        -- Calculate Last Visit (Max date of completed appointment)
        MAX(CASE WHEN a.status = 'Completed' THEN (a.date + a.time) ELSE NULL END)::TIMESTAMP as last_visit,
        
        -- Calculate Spend: Sum of Transactions linked to appointments + Direct Transactions (if client_id exists in transactions in future)
        -- Currently strictly joining via Appointment as per schema
        COALESCE(
            SUM(t.amount) FILTER (WHERE t.type = 'income'), 
            0
        ) as total_spend,

        COUNT(a.id) as appointment_count
    FROM 
        public.clients c
    LEFT JOIN 
        public.appointments a ON c.id = a.client_id
    LEFT JOIN
        public.transactions t ON a.id = t.appointment_id
    WHERE 
        c.clinic_id = p_clinic_id
    GROUP BY 
        c.id
    ORDER BY 
        c.created_at DESC;
END;
$$;

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
