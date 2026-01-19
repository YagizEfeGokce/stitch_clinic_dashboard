import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Inventory API - Handles all inventory/product data operations
 */
class InventoryAPI extends BaseAPI {
    constructor() {
        super('inventory');
    }

    /**
     * Get all inventory items
     * @param {string} clinicId - Clinic ID
     */
    async getInventory(clinicId) {
        return this.getAll(clinicId, {
            orderBy: { column: 'name', ascending: true },
        });
    }

    /**
     * Get low stock items (stock <= min_stock)
     * @param {string} clinicId - Clinic ID
     */
    async getLowStockItems(clinicId) {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .eq('clinic_id', clinicId)
                .or('stock.lte.min_stock,stock.eq.0')
                .order('stock', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getLowStockItems' });
            return { data: null, error: message };
        }
    }

    /**
     * Update stock quantity
     * @param {string} id - Item ID
     * @param {number} newStock - New stock value
     */
    async updateStock(id, newStock) {
        if (newStock < 0) {
            return { data: null, error: 'Stok miktarı 0\'dan küçük olamaz' };
        }
        return this.update(id, { stock: newStock });
    }

    /**
     * Increment stock (for purchases)
     * @param {string} id - Item ID
     * @param {number} amount - Amount to add
     */
    async incrementStock(id, amount) {
        try {
            // First get current stock
            const { data: item, error: getError } = await this.getById(id);
            if (getError) throw new Error(getError);

            const newStock = (item.stock || 0) + amount;
            return this.update(id, { stock: newStock });
        } catch (error) {
            const message = handleError(error, { operation: 'incrementStock', id, amount });
            return { data: null, error: message };
        }
    }

    /**
     * Decrement stock (for usage/sales)
     * @param {string} id - Item ID
     * @param {number} amount - Amount to subtract
     */
    async decrementStock(id, amount) {
        try {
            const { data: item, error: getError } = await this.getById(id);
            if (getError) throw new Error(getError);

            const newStock = Math.max(0, (item.stock || 0) - amount);
            return this.update(id, { stock: newStock });
        } catch (error) {
            const message = handleError(error, { operation: 'decrementStock', id, amount });
            return { data: null, error: message };
        }
    }

    /**
     * Get inventory statistics
     * @param {string} clinicId - Clinic ID
     */
    async getInventoryStats(clinicId) {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('stock, min_stock, price')
                .eq('clinic_id', clinicId);

            if (error) throw error;

            const stats = {
                totalItems: data.length,
                lowStockCount: data.filter(item => item.stock <= (item.min_stock || 0)).length,
                outOfStockCount: data.filter(item => item.stock === 0).length,
                totalValue: data.reduce((sum, item) => sum + (item.stock * (item.price || 0)), 0),
            };

            return { data: stats, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getInventoryStats' });
            return { data: null, error: message };
        }
    }
}

export const inventoryAPI = new InventoryAPI();
