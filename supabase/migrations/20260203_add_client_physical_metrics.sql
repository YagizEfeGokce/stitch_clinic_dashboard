-- =============================================================================
-- DERMDESK CLIENT PHYSICAL METRICS MIGRATION
-- Run this in Supabase SQL Editor
-- Date: 2026-02-03
-- =============================================================================

-- Add physical metrics columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS height_cm numeric;

-- Add check constraints for valid ranges (optional but recommended)
-- Weight: 20-300 kg, Height: 100-250 cm
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'weight_kg_range'
    ) THEN
        ALTER TABLE public.clients
        ADD CONSTRAINT weight_kg_range CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 300));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'height_cm_range'
    ) THEN
        ALTER TABLE public.clients
        ADD CONSTRAINT height_cm_range CHECK (height_cm IS NULL OR (height_cm >= 100 AND height_cm <= 250));
    END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN public.clients.weight_kg IS 'Client weight in kilograms';
COMMENT ON COLUMN public.clients.height_cm IS 'Client height in centimeters';

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE '✅ Client physical metrics migration completed!';
    RAISE NOTICE '📋 Added: weight_kg, height_cm columns';
    RAISE NOTICE '📋 Added: Validation constraints (20-300 kg, 100-250 cm)';
END $$;
