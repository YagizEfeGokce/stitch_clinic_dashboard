-- ============================================================================
-- DERMDESK: AUTOMATIC INVENTORY DEDUCTION ON SERVICE COMPLETION
-- ============================================================================
-- Version: 1.0
-- Created: 2026-01-29
-- Description: Adds service materials mapping and automatic deduction triggers
-- ============================================================================

-- ============================================================================
-- 1. SERVICE_MATERIALS TABLE (Template: What materials a service TYPICALLY uses)
-- ============================================================================
-- This defines the DEFAULT materials for each service type.
-- When creating an appointment, these become the starting point.

CREATE TABLE IF NOT EXISTS public.service_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    inventory_item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
    
    -- How much of this material is typically used per service
    quantity_per_service NUMERIC(10, 3) DEFAULT 1.00 NOT NULL,
    
    -- Unit reference (for display, actual unit comes from inventory)
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Prevent duplicate mappings
    UNIQUE(service_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_materials_clinic_id ON public.service_materials(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_service_id ON public.service_materials(service_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_inventory_id ON public.service_materials(inventory_item_id);

-- ============================================================================
-- 2. APPOINTMENT_MATERIALS TABLE (Actual materials used for EACH appointment)
-- ============================================================================
-- This tracks the ACTUAL materials used in a specific appointment.
-- Pre-populated from service_materials when appointment is created.
-- Staff can modify before marking as completed.

CREATE TABLE IF NOT EXISTS public.appointment_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    inventory_item_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL, -- SET NULL if inventory deleted
    
    -- Actual quantity used (can be modified by staff)
    quantity_used NUMERIC(10, 3) DEFAULT 1.00 NOT NULL,
    
    -- Snapshot of inventory item name at time of use (for history)
    item_name_snapshot TEXT NOT NULL,
    
    -- Whether this material has been deducted from inventory
    deducted BOOLEAN DEFAULT FALSE,
    deducted_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    deduction_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Allow same item multiple times with different contexts (e.g., before/after)
    UNIQUE(appointment_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_materials_clinic_id ON public.appointment_materials(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointment_materials_appointment_id ON public.appointment_materials(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_materials_inventory_id ON public.appointment_materials(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_appointment_materials_deducted ON public.appointment_materials(deducted);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- SERVICE_MATERIALS
CREATE POLICY "Service Materials SELECT" ON public.service_materials
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Service Materials INSERT" ON public.service_materials
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Service Materials UPDATE" ON public.service_materials
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Service Materials DELETE" ON public.service_materials
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- APPOINTMENT_MATERIALS
CREATE POLICY "Appointment Materials SELECT" ON public.appointment_materials
    FOR SELECT USING (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Appointment Materials INSERT" ON public.appointment_materials
    FOR INSERT WITH CHECK (clinic_id = public.get_my_clinic_id() OR clinic_id IS NULL);

CREATE POLICY "Appointment Materials UPDATE" ON public.appointment_materials
    FOR UPDATE USING (clinic_id = public.get_my_clinic_id())
    WITH CHECK (clinic_id = public.get_my_clinic_id());

CREATE POLICY "Appointment Materials DELETE" ON public.appointment_materials
    FOR DELETE USING (clinic_id = public.get_my_clinic_id());

-- ============================================================================
-- 5. AUTO-ASSIGN CLINIC TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_set_clinic_service_materials 
    BEFORE INSERT ON public.service_materials 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();

CREATE TRIGGER trg_set_clinic_appointment_materials 
    BEFORE INSERT ON public.appointment_materials 
    FOR EACH ROW EXECUTE PROCEDURE public.fn_auto_assign_clinic();

-- ============================================================================
-- 6. FUNCTION: DEDUCT INVENTORY ON APPOINTMENT COMPLETION
-- ============================================================================
-- This function is called by a trigger when appointment status -> 'Completed'
-- It handles:
-- 1. Checking for sufficient stock
-- 2. Deducting quantities atomically
-- 3. Logging any errors
-- 4. Preventing double-deduction (idempotency)

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    material_record RECORD;
    current_stock INTEGER;
    new_stock INTEGER;
    insufficient_stock_items TEXT := '';
    has_error BOOLEAN := FALSE;
BEGIN
    -- Only proceed if status changed TO 'Completed' (not already Completed)
    IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
        
        -- First pass: Check all materials have sufficient stock
        FOR material_record IN 
            SELECT 
                am.id AS am_id,
                am.inventory_item_id,
                am.quantity_used,
                am.item_name_snapshot,
                am.deducted,
                i.stock,
                i.name AS current_name
            FROM public.appointment_materials am
            LEFT JOIN public.inventory i ON i.id = am.inventory_item_id
            WHERE am.appointment_id = NEW.id
              AND am.deducted = FALSE
        LOOP
            -- Skip if inventory item was deleted
            IF material_record.inventory_item_id IS NULL THEN
                -- Mark as deducted with error (item deleted)
                UPDATE public.appointment_materials 
                SET deducted = TRUE, 
                    deducted_at = NOW(),
                    deduction_error = 'Envanter ürünü silinmiş'
                WHERE id = material_record.am_id;
                CONTINUE;
            END IF;
            
            -- Check stock sufficiency
            current_stock := COALESCE(material_record.stock, 0);
            IF current_stock < material_record.quantity_used THEN
                has_error := TRUE;
                insufficient_stock_items := insufficient_stock_items || 
                    material_record.item_name_snapshot || ' (' || 
                    current_stock || ' mevcut, ' || 
                    material_record.quantity_used || ' gerekli), ';
            END IF;
        END LOOP;
        
        -- If any item has insufficient stock, abort the entire transaction
        IF has_error THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', 
                RTRIM(insufficient_stock_items, ', ');
        END IF;
        
        -- Second pass: Actually deduct the stock
        FOR material_record IN 
            SELECT 
                am.id AS am_id,
                am.inventory_item_id,
                am.quantity_used,
                i.stock
            FROM public.appointment_materials am
            JOIN public.inventory i ON i.id = am.inventory_item_id
            WHERE am.appointment_id = NEW.id
              AND am.deducted = FALSE
        LOOP
            -- Calculate new stock
            new_stock := material_record.stock - CEIL(material_record.quantity_used)::INTEGER;
            
            -- Ensure non-negative
            IF new_stock < 0 THEN
                new_stock := 0;
            END IF;
            
            -- Update inventory
            UPDATE public.inventory 
            SET stock = new_stock,
                updated_at = NOW(),
                -- Auto-update status based on new stock level
                status = CASE 
                    WHEN new_stock = 0 THEN 'Out of Stock'
                    WHEN new_stock <= min_stock_alert THEN 'Low Stock'
                    ELSE 'In Stock'
                END
            WHERE id = material_record.inventory_item_id;
            
            -- Mark material as deducted
            UPDATE public.appointment_materials 
            SET deducted = TRUE, 
                deducted_at = NOW(),
                deduction_error = NULL
            WHERE id = material_record.am_id;
        END LOOP;
        
        -- Log the activity
        INSERT INTO public.activity_logs (clinic_id, action, details)
        VALUES (
            NEW.clinic_id,
            'Envanter Düşüldü',
            jsonb_build_object(
                'appointment_id', NEW.id,
                'message', 'Randevu tamamlandı, malzemeler envanterden düşüldü'
            )
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. TRIGGER: ATTACH DEDUCTION FUNCTION TO APPOINTMENTS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_deduct_inventory_on_completion ON public.appointments;

CREATE TRIGGER trg_deduct_inventory_on_completion
    AFTER UPDATE OF status ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_inventory_on_completion();

-- ============================================================================
-- 8. FUNCTION: POPULATE APPOINTMENT MATERIALS FROM SERVICE TEMPLATE
-- ============================================================================
-- Helper function to copy service_materials to appointment_materials
-- Called when creating or updating an appointment with a service

CREATE OR REPLACE FUNCTION public.populate_appointment_materials(
    p_appointment_id UUID,
    p_service_id UUID,
    p_clinic_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Delete existing non-deducted materials for this appointment
    DELETE FROM public.appointment_materials 
    WHERE appointment_id = p_appointment_id AND deducted = FALSE;
    
    -- Copy from service template
    INSERT INTO public.appointment_materials (
        clinic_id,
        appointment_id,
        inventory_item_id,
        quantity_used,
        item_name_snapshot
    )
    SELECT 
        p_clinic_id,
        p_appointment_id,
        sm.inventory_item_id,
        sm.quantity_per_service,
        i.name
    FROM public.service_materials sm
    JOIN public.inventory i ON i.id = sm.inventory_item_id
    WHERE sm.service_id = p_service_id
      AND sm.clinic_id = p_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. ADD REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE service_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_materials;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
