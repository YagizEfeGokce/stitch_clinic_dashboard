import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Clients API - Handles all client-related data operations
 */
class ClientsAPI extends BaseAPI {
    constructor() {
        super('clients');
    }

    /**
     * Get all clients for a clinic
     * @param {string} clinicId - Clinic ID
     * @param {Object} options - Query options
     */
    async getClients(clinicId, options = {}) {
        return this.getAll(clinicId, {
            orderBy: { column: 'created_at', ascending: false },
            ...options,
        });
    }

    /**
     * Search clients by name, phone, or email
     * @param {string} clinicId - Clinic ID
     * @param {string} searchTerm - Search term
     */
    async searchClients(clinicId, searchTerm) {
        return this.search(clinicId, searchTerm, ['name', 'phone', 'email']);
    }

    /**
     * Get client with their full profile and appointment history
     * @param {string} id - Client ID
     */
    async getClientWithHistory(id) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select(`
                    *,
                    appointments (
                        id,
                        date,
                        time,
                        status,
                        notes,
                        service_name,
                        created_at
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Sort appointments by date descending
            if (data?.appointments) {
                data.appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getClientWithHistory', id });
            return { data: null, error: message };
        }
    }

    /**
     * Get client's photos
     * @param {string} clientId - Client ID
     */
    async getClientPhotos(clientId) {
        try {
            const { data, error } = await supabase
                .from('client_photos')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getClientPhotos', clientId });
            return { data: null, error: message };
        }
    }

    /**
     * Create client with validation
     * @param {Object} clientData - Client data
     */
    async createClient(clientData) {
        if (!clientData.name) {
            return { data: null, error: 'Müşteri adı gereklidir' };
        }

        return this.create(clientData);
    }

    /**
     * Get client statistics for dashboard
     * @param {string} clinicId - Clinic ID
     */
    async getClientStats(clinicId) {
        try {
            const { count: total, error: countError } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicId);

            if (countError) throw countError;

            // Get new clients this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: newThisMonth, error: newError } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', clinicId)
                .gte('created_at', startOfMonth.toISOString());

            if (newError) throw newError;

            return {
                data: {
                    total: total || 0,
                    newThisMonth: newThisMonth || 0,
                },
                error: null,
            };
        } catch (error) {
            const message = handleError(error, { operation: 'getClientStats', clinicId });
            return { data: null, error: message };
        }
    }
}

export const clientsAPI = new ClientsAPI();
