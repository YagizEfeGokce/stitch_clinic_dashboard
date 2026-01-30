import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Appointment Materials API - Manages actual materials used in specific appointments
 * Pre-populated from service templates, can be modified before completion
 */
class AppointmentMaterialsAPI extends BaseAPI {
    constructor() {
        super('appointment_materials');
    }

    /**
     * Get all materials for a specific appointment
     * @param {string} appointmentId - Appointment ID
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async getAppointmentMaterials(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_materials')
                .select(`
                    *,
                    inventory:inventory_item_id (
                        id,
                        name,
                        stock,
                        unit,
                        min_stock_alert,
                        status
                    )
                `)
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getAppointmentMaterials', appointmentId });
            return { data: null, error: message };
        }
    }

    /**
     * Populate appointment materials from service template
     * Uses the database function populate_appointment_materials
     * @param {string} appointmentId - Appointment ID
     * @param {string} serviceId - Service ID to copy materials from
     * @param {string} clinicId - Clinic ID
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async populateFromService(appointmentId, serviceId, clinicId) {
        try {
            const { error } = await supabase.rpc('populate_appointment_materials', {
                p_appointment_id: appointmentId,
                p_service_id: serviceId,
                p_clinic_id: clinicId
            });

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'populateFromService', appointmentId, serviceId });
            return { success: false, error: message };
        }
    }

    /**
     * Update quantity for an appointment material
     * @param {string} id - Appointment material ID
     * @param {number} quantityUsed - New quantity
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async updateQuantity(id, quantityUsed) {
        try {
            if (quantityUsed < 0) {
                return { data: null, error: 'Miktar 0\'dan küçük olamaz' };
            }

            const { data, error } = await supabase
                .from('appointment_materials')
                .update({ quantity_used: quantityUsed })
                .eq('id', id)
                .eq('deducted', false) // Only update if not yet deducted
                .select(`
                    *,
                    inventory:inventory_item_id (
                        id,
                        name,
                        stock,
                        unit
                    )
                `)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'updateQuantity', id });
            return { data: null, error: message };
        }
    }

    /**
     * Add a custom material to an appointment (not from template)
     * @param {string} appointmentId - Appointment ID
     * @param {string} inventoryItemId - Inventory item ID
     * @param {number} quantityUsed - Quantity to use
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async addCustomMaterial(appointmentId, inventoryItemId, quantityUsed = 1) {
        try {
            // First get the inventory item name for snapshot
            const { data: inventoryItem, error: inventoryError } = await supabase
                .from('inventory')
                .select('name')
                .eq('id', inventoryItemId)
                .single();

            if (inventoryError) throw inventoryError;

            const { data, error } = await supabase
                .from('appointment_materials')
                .insert({
                    appointment_id: appointmentId,
                    inventory_item_id: inventoryItemId,
                    quantity_used: quantityUsed,
                    item_name_snapshot: inventoryItem.name
                })
                .select(`
                    *,
                    inventory:inventory_item_id (
                        id,
                        name,
                        stock,
                        unit
                    )
                `)
                .single();

            if (error) {
                // Handle unique constraint violation
                if (error.code === '23505') {
                    return { data: null, error: 'Bu malzeme zaten bu randevuya eklenmiş' };
                }
                throw error;
            }
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'addCustomMaterial', appointmentId, inventoryItemId });
            return { data: null, error: message };
        }
    }

    /**
     * Remove a material from an appointment (only if not yet deducted)
     * @param {string} id - Appointment material ID
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async removeMaterial(id) {
        try {
            const { error } = await supabase
                .from('appointment_materials')
                .delete()
                .eq('id', id)
                .eq('deducted', false); // Only delete if not yet deducted

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'removeMaterial', id });
            return { success: false, error: message };
        }
    }

    /**
     * Check stock availability for all materials in an appointment
     * @param {string} appointmentId - Appointment ID
     * @returns {Promise<{sufficient: boolean, insufficientItems: Array, error: string|null}>}
     */
    async checkStockAvailability(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_materials')
                .select(`
                    quantity_used,
                    item_name_snapshot,
                    inventory:inventory_item_id (
                        id,
                        stock,
                        name,
                        unit
                    )
                `)
                .eq('appointment_id', appointmentId)
                .eq('deducted', false);

            if (error) throw error;

            const insufficientItems = (data || [])
                .filter(m => m.inventory && m.inventory.stock < m.quantity_used)
                .map(m => ({
                    name: m.item_name_snapshot,
                    currentStock: m.inventory.stock,
                    required: m.quantity_used,
                    unit: m.inventory.unit || 'adet'
                }));

            return {
                sufficient: insufficientItems.length === 0,
                insufficientItems,
                error: null
            };
        } catch (error) {
            const message = handleError(error, { operation: 'checkStockAvailability', appointmentId });
            return { sufficient: false, insufficientItems: [], error: message };
        }
    }

    /**
     * Get summary of materials for display (count and total items)
     * @param {string} appointmentId - Appointment ID
     * @returns {Promise<{count: number, hasInsufficientStock: boolean, error: string|null}>}
     */
    async getMaterialsSummary(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_materials')
                .select(`
                    quantity_used,
                    deducted,
                    inventory:inventory_item_id (
                        stock
                    )
                `)
                .eq('appointment_id', appointmentId);

            if (error) throw error;

            const nonDeducted = (data || []).filter(m => !m.deducted);
            const hasInsufficientStock = nonDeducted.some(
                m => m.inventory && m.inventory.stock < m.quantity_used
            );

            return {
                count: nonDeducted.length,
                hasInsufficientStock,
                error: null
            };
        } catch (error) {
            const message = handleError(error, { operation: 'getMaterialsSummary', appointmentId });
            return { count: 0, hasInsufficientStock: false, error: message };
        }
    }
}

export const appointmentMaterialsAPI = new AppointmentMaterialsAPI();
