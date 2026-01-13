-- Create Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'closed')),
    admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can create feedback
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback (optional, maybe distinct for history)
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Admins (Service Role) have full access - handled by dashboard role check usually, 
-- but here we assume Super Admin will access via specialized queries or Supabase dashboard for now.
