import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Super Admin API - Handles privileged operations for Super Admins
 */
class SuperAdminAPI {
    /**
     * Get all feedback entries with user and clinic details
     */
    async getFeedbacks() {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    profiles:user_id ( full_name, email ),
                    clinics:clinic_id ( name )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getFeedbacks' });
            return { data: null, error: message };
        }
    }

    /**
     * Update feedback status
     * @param {string} id - Feedback ID
     * @param {string} status - New status
     */
    async updateFeedbackStatus(id, status) {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'updateFeedbackStatus', id });
            return { data: null, error: message };
        }
    }

    /**
     * Get aggregated data for all clinics (Dashboard View)
     */
    async getClinicsOverview() {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select(`
                    id,
                    name,
                    created_at,
                    clients ( id ),
                    appointments ( id, status ),
                    transactions ( amount, type )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getClinicsOverview' });
            return { data: null, error: message };
        }
    }
}

export const superAdminAPI = new SuperAdminAPI();
