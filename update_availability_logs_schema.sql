-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies for Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Doctors can view all logs" 
    ON public.activity_logs FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'doctor', 'owner')
        )
    );

CREATE POLICY "Authenticated users can create logs" 
    ON public.activity_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');


-- Create Staff Availability Table
CREATE TABLE IF NOT EXISTS public.staff_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', etc.
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(staff_id, day_of_week)
);

-- Policies for Staff Availability
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all availability" 
    ON public.staff_availability FOR SELECT 
    USING (true);

CREATE POLICY "Amins can manage all availability" 
    ON public.staff_availability FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'owner')
        )
    );

CREATE POLICY "Users can manage their own availability" 
    ON public.staff_availability FOR ALL
    USING (auth.uid() = staff_id);
