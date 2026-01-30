-- ============================================================================
-- AUTO-POPULATE APPOINTMENT MATERIALS ON APPOINTMENT CREATION
-- ============================================================================
-- This trigger automatically copies materials from service_materials template
-- to appointment_materials when a new appointment is created
-- ============================================================================

-- Function to auto-populate materials
CREATE OR REPLACE FUNCTION public.auto_populate_appointment_materials()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run on INSERT and if service_id is provided
    IF NEW.service_id IS NOT NULL THEN
        -- Copy materials from service template to appointment
        INSERT INTO public.appointment_materials (
            appointment_id,
            inventory_item_id,
            quantity_used,
            item_name_snapshot,
            clinic_id
        )
        SELECT 
            NEW.id,
            sm.inventory_item_id,
            sm.quantity_per_service,
            i.name,
            NEW.clinic_id
        FROM public.service_materials sm
        JOIN public.inventory i ON i.id = sm.inventory_item_id
        WHERE sm.service_id = NEW.service_id
        -- Don't insert duplicates
        ON CONFLICT (appointment_id, inventory_item_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on appointments table (AFTER INSERT)
DROP TRIGGER IF EXISTS trg_auto_populate_materials ON public.appointments;

CREATE TRIGGER trg_auto_populate_materials
    AFTER INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_populate_appointment_materials();

-- ============================================================================
-- ALSO: Populate existing appointments that have a service with materials
-- ============================================================================

-- Populate materials for existing Scheduled/Confirmed appointments
INSERT INTO public.appointment_materials (
    appointment_id,
    inventory_item_id,
    quantity_used,
    item_name_snapshot,
    clinic_id
)
SELECT 
    a.id,
    sm.inventory_item_id,
    sm.quantity_per_service,
    i.name,
    a.clinic_id
FROM public.appointments a
JOIN public.service_materials sm ON sm.service_id = a.service_id
JOIN public.inventory i ON i.id = sm.inventory_item_id
WHERE a.status IN ('Scheduled', 'Confirmed')
  AND a.service_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.appointment_materials am 
      WHERE am.appointment_id = a.id 
        AND am.inventory_item_id = sm.inventory_item_id
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.auto_populate_appointment_materials() TO authenticated;

-- ============================================================================
-- VERIFY: Check how many materials were populated
-- ============================================================================

-- Run this after the migration to verify:
-- SELECT COUNT(*) as populated_count FROM appointment_materials;
