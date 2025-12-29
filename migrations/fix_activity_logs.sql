-- Drop table to reset schema correctly (since it's empty or has invalid FK)
DROP TABLE IF EXISTS public.activity_logs;

-- Recreate table with correct Foreign Key to public.profiles
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Changed from auth.users to public.profiles
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Re-create Policies (Dropping is handled by dropping table)
CREATE POLICY "Users can view logs for their clinic" ON public.activity_logs
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their clinic" ON public.activity_logs
    FOR INSERT WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
        )
    );
