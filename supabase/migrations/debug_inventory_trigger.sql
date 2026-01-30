-- ============================================================================
-- DEBUG: Check if the inventory deduction trigger is working
-- Run each section separately in Supabase SQL Editor
-- ============================================================================

-- 1. CHECK IF TRIGGER EXISTS
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'appointments';

-- You should see: trg_deduct_inventory_on_completion

-- ============================================================================

-- 2. CHECK IF FUNCTION EXISTS
SELECT 
    routine_name,
    routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'deduct_inventory_on_completion';

-- You should see: deduct_inventory_on_completion | FUNCTION

-- ============================================================================

-- 3. CHECK SERVICE_MATERIALS TABLE  
SELECT 
    sm.id,
    s.name as service_name,
    i.name as inventory_name,
    sm.quantity_per_service
FROM service_materials sm
JOIN services s ON s.id = sm.service_id
JOIN inventory i ON i.id = sm.inventory_item_id
LIMIT 10;

-- If empty, no materials are configured for any service

-- ============================================================================

-- 4. CHECK APPOINTMENT_MATERIALS TABLE
SELECT 
    am.id,
    am.appointment_id,
    am.item_name_snapshot,
    am.quantity_used,
    am.deducted,
    am.deducted_at,
    am.deduction_error
FROM appointment_materials am
ORDER BY am.created_at DESC
LIMIT 10;

-- If empty, no materials were ever added to any appointment

-- ============================================================================

-- 5. MANUAL TEST: Create a test scenario
-- First, find a service ID and inventory ID

-- Get a service ID:
SELECT id, name FROM services LIMIT 5;

-- Get an inventory item ID with stock:
SELECT id, name, stock FROM inventory WHERE stock > 0 LIMIT 5;

-- ============================================================================

-- 6. INSERT TEST SERVICE MATERIAL (replace the UUIDs with real ones from step 5)
-- Uncomment and run if service_materials is empty:

-- INSERT INTO service_materials (service_id, inventory_item_id, quantity_per_service)
-- VALUES (
--     'YOUR_SERVICE_ID_HERE',
--     'YOUR_INVENTORY_ID_HERE',
--     1
-- );

-- ============================================================================

-- 7. CHECK COMPLETED APPOINTMENTS TODAY
SELECT 
    a.id,
    a.status,
    a.date,
    s.name as service_name,
    (SELECT COUNT(*) FROM appointment_materials WHERE appointment_id = a.id) as materials_count
FROM appointments a
LEFT JOIN services s ON s.id = a.service_id
WHERE a.status = 'Completed'
ORDER BY a.date DESC
LIMIT 10;

-- ============================================================================

-- 8. VIEW ACTIVITY LOGS FOR INVENTORY DEDUCTIONS
SELECT 
    action,
    details,
    created_at
FROM activity_logs
WHERE action = 'Envanter Düşüldü'
ORDER BY created_at DESC
LIMIT 10;

-- If empty, no inventory has been deducted by the trigger

-- ============================================================================

-- 9. TEST THE TRIGGER MANUALLY (ADVANCED)
-- Find a Scheduled appointment and manually update it to Completed
-- This will fire the trigger

-- First, find a Scheduled appointment:
-- SELECT id, status, date FROM appointments WHERE status = 'Scheduled' LIMIT 5;

-- Then update it (CAUTION: this will actually complete the appointment):
-- UPDATE appointments SET status = 'Completed' WHERE id = 'YOUR_APPOINTMENT_ID';

-- ============================================================================
