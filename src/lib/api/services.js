import BaseAPI from './baseClient';

/**
 * Services API - Handles all service-related data operations
 */
class ServicesAPI extends BaseAPI {
    constructor() {
        super('services');
    }

    /**
     * Get all services for a clinic
     * @param {string} clinicId - Clinic ID
     */
    async getServices(clinicId) {
        return this.getAll(clinicId, {
            orderBy: { column: 'name', ascending: true },
        });
    }

    /**
     * Get active services only
     * @param {string} clinicId - Clinic ID
     */
    async getActiveServices(clinicId) {
        return this.getAll(clinicId, {
            filters: { active: true },
            orderBy: { column: 'name', ascending: true },
        });
    }

    /**
     * Get services grouped by category
     * @param {string} clinicId - Clinic ID
     */
    async getServicesByCategory(clinicId) {
        const { data, error } = await this.getActiveServices(clinicId);

        if (error || !data) {
            return { data: null, error };
        }

        // Group by category
        const grouped = data.reduce((acc, service) => {
            const category = service.category || 'Diğer';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {});

        return { data: grouped, error: null };
    }

    /**
     * Toggle service active status
     * @param {string} id - Service ID
     * @param {boolean} currentStatus - Current active status
     */
    async toggleActive(id, currentStatus) {
        return this.update(id, { is_active: !currentStatus });
    }

    /**
     * Update service price
     * @param {string} id - Service ID
     * @param {number} newPrice - New price
     */
    async updatePrice(id, newPrice) {
        if (newPrice < 0) {
            return { data: null, error: 'Fiyat 0\'dan küçük olamaz' };
        }
        return this.update(id, { price: newPrice });
    }
}

export const servicesAPI = new ServicesAPI();
