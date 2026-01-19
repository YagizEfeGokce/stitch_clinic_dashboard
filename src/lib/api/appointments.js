import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';
import { getLocalISOString } from '../../utils/dateUtils';

/**
 * Appointments API - Handles all appointment-related data operations
 */
class AppointmentsAPI extends BaseAPI {
    constructor() {
        super('appointments');
    }

    /**
     * Get appointments for a specific date range with related data
     * @param {string} clinicId - Clinic ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     */
    async getAppointments(clinicId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (
                        id,
                        name,
                        phone,
                        image_url
                    ),
                    profiles:staff_id (
                        id,
                        full_name
                    )
                `)
                .eq('clinic_id', clinicId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getAppointments', startDate, endDate });
            return { data: null, error: message };
        }
    }

    /**
     * Get appointments for a single date
     * @param {string} clinicId - Clinic ID
     * @param {string} date - Date (YYYY-MM-DD)
     */
    async getAppointmentsByDate(clinicId, date) {
        return this.getAppointments(clinicId, date, date);
    }

    /**
     * Get today's appointments
     * @param {string} clinicId - Clinic ID
     */
    async getTodayAppointments(clinicId) {
        const today = getLocalISOString();
        return this.getAppointments(clinicId, today, today);
    }

    /**
     * Get upcoming appointments (next 7 days)
     * @param {string} clinicId - Clinic ID
     */
    async getUpcomingAppointments(clinicId, limit = 10) {
        try {
            const today = getLocalISOString();

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (
                        id,
                        name,
                        phone,
                        image_url
                    )
                `)
                .eq('clinic_id', clinicId)
                .gte('date', today)
                .in('status', ['Scheduled', 'Confirmed'])
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getUpcomingAppointments' });
            return { data: null, error: message };
        }
    }

    /**
     * Create appointment with optional conflict check
     * @param {Object} appointmentData - Appointment data
     * @param {boolean} checkConflicts - Whether to check for conflicts
     */
    async createAppointment(appointmentData, checkConflicts = false) {
        try {
            if (checkConflicts) {
                const { data: conflicts } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('clinic_id', appointmentData.clinic_id)
                    .eq('date', appointmentData.date)
                    .eq('time', appointmentData.time)
                    .not('status', 'eq', 'Cancelled');

                if (conflicts && conflicts.length > 0) {
                    return {
                        data: null,
                        error: 'Bu tarih ve saatte başka bir randevu mevcut',
                    };
                }
            }

            return this.create(appointmentData);
        } catch (error) {
            const message = handleError(error, { operation: 'createAppointment' });
            return { data: null, error: message };
        }
    }

    /**
     * Update appointment status
     * @param {string} id - Appointment ID
     * @param {string} status - New status
     */
    async updateStatus(id, status) {
        const validStatuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];

        if (!validStatuses.includes(status)) {
            return { data: null, error: 'Geçersiz durum değeri' };
        }

        return this.update(id, { status });
    }

    /**
     * Get appointment statistics
     * @param {string} clinicId - Clinic ID
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     */
    async getAppointmentStats(clinicId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('status')
                .eq('clinic_id', clinicId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const stats = {
                total: data.length,
                scheduled: data.filter(a => a.status === 'Scheduled').length,
                completed: data.filter(a => a.status === 'Completed').length,
                cancelled: data.filter(a => a.status === 'Cancelled').length,
                noShow: data.filter(a => a.status === 'No Show').length,
            };

            return { data: stats, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getAppointmentStats' });
            return { data: null, error: message };
        }
    }

    /**
     * Get client's appointment history
     * @param {string} clientId - Client ID
     */
    async getClientAppointments(clientId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getClientAppointments', clientId });
            return { data: null, error: message };
        }
    }
}

export const appointmentsAPI = new AppointmentsAPI();
