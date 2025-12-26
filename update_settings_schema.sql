-- Add new columns to clinic_settings table
ALTER TABLE public.clinic_settings 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS website text;

-- Create storage bucket for clinic assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to clinic assets
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'clinic-assets' );

-- Policy to allow authenticated users to upload clinic assets
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'clinic-assets' AND auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update clinic assets
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'clinic-assets' AND auth.role() = 'authenticated' );
