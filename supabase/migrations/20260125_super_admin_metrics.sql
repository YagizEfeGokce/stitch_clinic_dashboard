-- Grant Super Admin Read Access to All Tables
-- Allows specified emails to bypass RLS for dashboard metrics

-- Appointments
CREATE POLICY "Super Admin can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);

-- Clients
CREATE POLICY "Super Admin can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);

-- Transactions (Revenue)
CREATE POLICY "Super Admin can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);

-- Inventory (Just in case)
CREATE POLICY "Super Admin can view all inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'email') IN ('relre434@gmail.com', 'yagiz.gokce19@gmail.com')
);
