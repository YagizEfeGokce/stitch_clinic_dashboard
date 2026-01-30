import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Service Materials API - Manages default materials for each service type
 * These are templates that get copied to appointment_materials when an appointment is created
 */
class ServiceMaterialsAPI extends BaseAPI {
    constructor() {
        super('service_materials');
    }

    /**
     * Get all materials configured for a specific service
     * @param {string} serviceId - Service ID
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async getServiceMaterials(serviceId) {
        try {
            const { data, error } = await supabase
                .from('service_materials')
                .select(`
                    *,
                    inventory:inventory_item_id (
                        id,
                        name,
                        stock,
                        unit,
                        min_stock_alert
                    )
                `)
                .eq('service_id', serviceId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getServiceMaterials', serviceId });
            return { data: null, error: message };
        }
    }

    /**
     * Add a material to a service template
     * @param {string} serviceId - Service ID
     * @param {string} inventoryItemId - Inventory item ID
     * @param {number} quantityPerService - Quantity used per service
     * @param {string} [notes] - Optional notes
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async addServiceMaterial(serviceId, inventoryItemId, quantityPerService = 1, notes = null) {
        try {
            const { data, error } = await supabase
                .from('service_materials')
                .insert({
                    service_id: serviceId,
                    inventory_item_id: inventoryItemId,
                    quantity_per_service: quantityPerService,
                    notes
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
                    return { data: null, error: 'Bu malzeme zaten bu hizmete eklenmiş' };
                }
                throw error;
            }
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'addServiceMaterial', serviceId, inventoryItemId });
            return { data: null, error: message };
        }
    }

    /**
     * Update quantity for a service material
     * @param {string} id - Service material ID
     * @param {number} quantityPerService - New quantity
     * @param {string} [notes] - Optional notes
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async updateServiceMaterial(id, quantityPerService, notes = undefined) {
        try {
            const updateData = { quantity_per_service: quantityPerService };
            if (notes !== undefined) {
                updateData.notes = notes;
            }

            const { data, error } = await supabase
                .from('service_materials')
                .update(updateData)
                .eq('id', id)
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
            const message = handleError(error, { operation: 'updateServiceMaterial', id });
            return { data: null, error: message };
        }
    }

    /**
     * Remove a material from a service template
     * @param {string} id - Service material ID
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async deleteServiceMaterial(id) {
        try {
            const { error } = await supabase
                .from('service_materials')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'deleteServiceMaterial', id });
            return { success: false, error: message };
        }
    }

    /**
     * Get count of materials for a service (for display in lists)
     * @param {string} serviceId - Service ID
     * @returns {Promise<{count: number, error: string|null}>}
     */
    async getMaterialCount(serviceId) {
        try {
            const { count, error } = await supabase
                .from('service_materials')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', serviceId);

            if (error) throw error;
            return { count: count || 0, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getMaterialCount', serviceId });
            return { count: 0, error: message };
        }
    }

    /**
     * Bulk add materials to a service
     * @param {string} serviceId - Service ID
     * @param {Array<{inventory_item_id: string, quantity_per_service: number}>} materials - Materials to add
     * @returns {Promise<{data: Array|null, error: string|null}>}
     */
    async bulkAddMaterials(serviceId, materials) {
        try {
            const records = materials.map(m => ({
                service_id: serviceId,
                inventory_item_id: m.inventory_item_id,
                quantity_per_service: m.quantity_per_service || 1
            }));

            const { data, error } = await supabase
                .from('service_materials')
                .insert(records)
                .select(`
                    *,
                    inventory:inventory_item_id (
                        id,
                        name,
                        stock,
                        unit
                    )
                `);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'bulkAddMaterials', serviceId });
            return { data: null, error: message };
        }
    }
}

export const serviceMaterialsAPI = new ServiceMaterialsAPI();
