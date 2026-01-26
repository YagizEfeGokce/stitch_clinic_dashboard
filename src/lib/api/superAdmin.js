import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Super Admin API - Handles privileged operations for Super Admins
 */
class SuperAdminAPI {
    /**
     * Get all feedback entries using Secure RPC
     */
    async getFeedbacks() {
        try {
            const { data, error } = await supabase.rpc('get_admin_feedbacks');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getFeedbacks' });
            return { data: null, error: message };
        }
    }

    /**
     * Update feedback status using Secure RPC
     */
    async updateFeedbackStatus(id, status) {
        try {
            const { data, error } = await supabase.rpc('update_feedback_status_admin', {
                feedback_id: id,
                new_status: status
            });

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
