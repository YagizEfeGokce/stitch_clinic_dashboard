import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';

/**
 * Reviews API - Handles client feedback and reviews
 */
class ReviewsAPI extends BaseAPI {
    constructor() {
        super('reviews');
    }

    /**
     * Get all reviews for a clinic
     * @param {string} clinicId - Clinic ID
     */
    async getReviews(clinicId) {
        return this.getAll(clinicId, {
            orderBy: { column: 'date', ascending: false },
        });
    }

    /**
     * Get reviews by source (Google, Facebook, etc.)
     * @param {string} clinicId - Clinic ID
     * @param {string} source - Source filter
     */
    async getReviewsBySource(clinicId, source) {
        return this.getAll(clinicId, {
            filters: { source },
            orderBy: { column: 'date', ascending: false },
        });
    }

    /**
     * Get pending reviews (New status)
     * @param {string} clinicId - Clinic ID
     */
    async getPendingReviews(clinicId) {
        return this.getAll(clinicId, {
            filters: { status: 'New' },
            orderBy: { column: 'date', ascending: false },
        });
    }

    /**
     * Add reply to a review
     * @param {string} id - Review ID
     * @param {string} reply - Reply text
     */
    async addReply(id, reply) {
        return this.update(id, {
            reply,
            reply_date: new Date().toISOString().split('T')[0],
            status: 'Replied',
        });
    }

    /**
     * Get review statistics
     * @param {string} clinicId - Clinic ID
     */
    async getReviewStats(clinicId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating, status')
                .eq('clinic_id', clinicId);

            if (error) throw error;

            const totalReviews = data.length;
            const avgRating = totalReviews > 0
                ? data.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;

            const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
                rating,
                count: data.filter(r => r.rating === rating).length,
                percentage: totalReviews > 0
                    ? Math.round((data.filter(r => r.rating === rating).length / totalReviews) * 100)
                    : 0,
            }));

            return {
                data: {
                    total: totalReviews,
                    average: Math.round(avgRating * 10) / 10,
                    pending: data.filter(r => r.status === 'New').length,
                    breakdown: ratingBreakdown,
                },
                error: null,
            };
        } catch (error) {
            const message = handleError(error, { operation: 'getReviewStats' });
            return { data: null, error: message };
        }
    }
}

export const reviewsAPI = new ReviewsAPI();
