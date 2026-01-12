-- ============================================================================
-- FIX STORAGE POLICIES
-- DESCRIPTION: Adds missing RLS policies for 'avatars', 'inventory', and 'clinic-assets' buckets.
-- ============================================================================

-- 1. AVATARS BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Owner Update Avatars" ON storage.objects;
CREATE POLICY "Owner Update Avatars" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- 2. INVENTORY BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory', 'inventory', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Inventory" ON storage.objects;
CREATE POLICY "Public Read Inventory" ON storage.objects FOR SELECT USING ( bucket_id = 'inventory' );

DROP POLICY IF EXISTS "Authenticated Upload Inventory" ON storage.objects;
CREATE POLICY "Authenticated Upload Inventory" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'inventory' );

DROP POLICY IF EXISTS "Owner Update/Delete Inventory" ON storage.objects;
CREATE POLICY "Owner Update/Delete Inventory" ON storage.objects FOR ALL TO authenticated USING ( bucket_id = 'inventory' AND owner = auth.uid() );

-- 3. CLINIC ASSETS BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Assets" ON storage.objects;
CREATE POLICY "Public Read Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'clinic-assets' );

DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
CREATE POLICY "Authenticated Upload Assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'clinic-assets' );
