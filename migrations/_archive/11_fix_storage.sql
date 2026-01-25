-- ============================================================================
-- FIX: STORAGE BUCKETS & POLICIES
-- ============================================================================

-- 1. Create 'clinic-assets' bucket for Logos/Branding
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for 'clinic-assets'
DROP POLICY IF EXISTS "Assets Public View" ON storage.objects;
CREATE POLICY "Assets Public View" ON storage.objects 
FOR SELECT USING (bucket_id = 'clinic-assets');

-- Allow authenticated users to upload to this bucket
-- (Refined: Any authenticated user can upload, but generally we trust the app logic to restrict.
--  For stricter control, checks on the filename path containing clinic_id could be added, 
--  but simpler auth check is standard for MVP).
DROP POLICY IF EXISTS "Assets User Upload" ON storage.objects;
CREATE POLICY "Assets User Upload" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'clinic-assets' AND auth.role() = 'authenticated');

-- Allow users to UPDATE their own uploads (optional, usually we just overwrite/upload new)
DROP POLICY IF EXISTS "Assets User Update" ON storage.objects;
CREATE POLICY "Assets User Update" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'clinic-assets' AND auth.uid() = owner);

-- 3. Cache Reload
NOTIFY pgrst, 'reload config';
