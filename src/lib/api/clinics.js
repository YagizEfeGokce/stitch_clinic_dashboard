import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Clinics API - Handles clinic settings and configuration
 */
class ClinicsAPI {
    /**
     * Get clinic by ID
     * @param {string} id - Clinic ID
     */
    async getClinic(id) {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getClinic', id });
            return { data: null, error: message };
        }
    }

    /**
     * Update clinic settings
     * @param {string} id - Clinic ID
     * @param {Object} updates - Fields to update
     */
    async updateClinic(id, updates) {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'updateClinic', id });
            return { data: null, error: message };
        }
    }

    /**
     * Update clinic branding (logo, colors, etc.)
     * @param {string} id - Clinic ID
     * @param {Object} branding - Branding config
     */
    async updateBranding(id, branding) {
        return this.updateClinic(id, { branding_config: branding });
    }

    /**
     * Update clinic name
     * @param {string} id - Clinic ID
     * @param {string} name - New name
     */
    async updateName(id, name) {
        if (!name || name.trim().length < 2) {
            return { data: null, error: 'Klinik adı en az 2 karakter olmalıdır' };
        }
        return this.updateClinic(id, { name: name.trim() });
    }
}

/**
 * Staff/Profiles API - Handles staff member operations
 */
class StaffAPI {
    /**
     * Get all staff members for a clinic
     * @param {string} clinicId - Clinic ID
     */
    async getStaff(clinicId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('full_name', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getStaff', clinicId });
            return { data: null, error: message };
        }
    }

    /**
     * Get staff member by ID
     * @param {string} id - Profile ID
     */
    async getStaffMember(id) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getStaffMember', id });
            return { data: null, error: message };
        }
    }

    /**
     * Update staff member profile
     * @param {string} id - Profile ID
     * @param {Object} updates - Fields to update
     */
    async updateStaffMember(id, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'updateStaffMember', id });
            return { data: null, error: message };
        }
    }

    /**
     * Update staff member role
     * @param {string} id - Profile ID
     * @param {string} role - New role
     */
    async updateRole(id, role) {
        const validRoles = ['owner', 'admin', 'doctor', 'staff'];
        if (!validRoles.includes(role)) {
            return { data: null, error: 'Geçersiz rol' };
        }
        return this.updateStaffMember(id, { role });
    }

    /**
     * Get staff members by role
     * @param {string} clinicId - Clinic ID
     * @param {string} role - Role to filter by
     */
    async getStaffByRole(clinicId, role) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('role', role)
                .order('full_name', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getStaffByRole', role });
            return { data: null, error: message };
        }
    }
}

export const clinicsAPI = new ClinicsAPI();
export const staffAPI = new StaffAPI();
