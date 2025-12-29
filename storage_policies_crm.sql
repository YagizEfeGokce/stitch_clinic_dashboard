-- ============================================================================
-- STORAGE POLICIES FOR 'crm_uploads'
-- INSTRUCTIONS:
-- 1. Copy this content.
-- 2. Go to Supabase Dashboard -> SQL Editor (Terminal Icon on the left).
-- 3. Paste and Run.
-- ============================================================================

-- 1. Create the bucket (safe to run multiple times)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm_uploads', 'crm_uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Usually already enabled by default, skipping to avoid permission errors)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent "Policy already exists" errors
DROP POLICY IF EXISTS "Public Read Access crm_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads crm_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Individual Update/Delete crm_uploads" ON storage.objects;

-- 4. Create Policies

-- ALLOW PUBLIC READ ACCESS (e.g. for avatars)
CREATE POLICY "Public Read Access crm_uploads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'crm_uploads' );

-- ALLOW AUTHENTICATED UPLOADS
CREATE POLICY "Authenticated Uploads crm_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'crm_uploads' );

-- ALLOW UPDATE/DELETE OWN FILES
CREATE POLICY "Individual Update/Delete crm_uploads"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'crm_uploads' AND owner = auth.uid() );

