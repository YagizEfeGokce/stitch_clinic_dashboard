import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Base API client with common CRUD operations
 * All entity-specific APIs extend this class
 */
class BaseAPI {
    constructor(tableName) {
        this.tableName = tableName;
    }

    /**
     * Get all records for the current clinic
     * @param {string} clinicId - The clinic ID
     * @param {Object} options - Query options
     * @param {string} options.select - Columns to select (default: '*')
     * @param {Object} options.filters - Additional filters as key-value pairs
     * @param {Object} options.orderBy - Sorting { column, ascending }
     * @param {number} options.limit - Max records to return
     */
    async getAll(clinicId, options = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select(options.select || '*');

            // Apply clinic filter if provided
            if (clinicId) {
                query = query.eq('clinic_id', clinicId);
            }

            // Apply custom filters
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        query = query.eq(key, value);
                    }
                });
            }

            // Apply sorting
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `getAll_${this.tableName}` });
            return { data: null, error: message };
        }
    }

    /**
     * Get single record by ID
     * @param {string} id - Record ID
     * @param {string} select - Columns to select
     */
    async getById(id, select = '*') {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select(select)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `getById_${this.tableName}`, id });
            return { data: null, error: message };
        }
    }

    /**
     * Create new record
     * @param {Object} record - Data to insert
     */
    async create(record) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .insert(record)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `create_${this.tableName}` });
            return { data: null, error: message };
        }
    }

    /**
     * Update existing record
     * @param {string} id - Record ID
     * @param {Object} updates - Fields to update
     */
    async update(id, updates) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `update_${this.tableName}`, id });
            return { data: null, error: message };
        }
    }

    /**
     * Delete record by ID
     * @param {string} id - Record ID
     */
    async delete(id) {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `delete_${this.tableName}`, id });
            return { success: false, error: message };
        }
    }

    /**
     * Search records by multiple columns
     * @param {string} clinicId - Clinic ID
     * @param {string} searchTerm - Search term
     * @param {string[]} searchColumns - Columns to search in
     */
    async search(clinicId, searchTerm, searchColumns = ['name']) {
        try {
            let query = supabase
                .from(this.tableName)
                .select('*');

            if (clinicId) {
                query = query.eq('clinic_id', clinicId);
            }

            // Build OR condition for multiple columns
            const orConditions = searchColumns
                .map(col => `${col}.ilike.%${searchTerm}%`)
                .join(',');

            query = query.or(orConditions);

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `search_${this.tableName}`, searchTerm });
            return { data: null, error: message };
        }
    }

    /**
     * Count records matching criteria
     * @param {string} clinicId - Clinic ID
     * @param {Object} filters - Optional filters
     */
    async count(clinicId, filters = {}) {
        try {
            let query = supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });

            if (clinicId) {
                query = query.eq('clinic_id', clinicId);
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.eq(key, value);
                }
            });

            const { count, error } = await query;

            if (error) throw error;
            return { count: count || 0, error: null };
        } catch (error) {
            const message = handleError(error, { operation: `count_${this.tableName}` });
            return { count: 0, error: message };
        }
    }
}

export default BaseAPI;
