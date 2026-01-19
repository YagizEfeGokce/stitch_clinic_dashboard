import BaseAPI from './baseClient';
import { supabase } from '../supabase';
import { handleError } from '../../utils/errorHelpers';
import { getLocalISOString } from '../../utils/dateUtils';

/**
 * Transactions API - Handles all finance/transaction data operations
 */
class TransactionsAPI extends BaseAPI {
    constructor() {
        super('transactions');
    }

    /**
     * Get transactions for a date range
     * @param {string} clinicId - Clinic ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     */
    async getTransactions(clinicId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('clinic_id', clinicId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getTransactions' });
            return { data: null, error: message };
        }
    }

    /**
     * Get this month's transactions
     * @param {string} clinicId - Clinic ID
     */
    async getThisMonthTransactions(clinicId) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return this.getTransactions(
            clinicId,
            startOfMonth.toISOString().split('T')[0],
            endOfMonth.toISOString().split('T')[0]
        );
    }

    /**
     * Get financial summary for a period
     * @param {string} clinicId - Clinic ID
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     */
    async getSummary(clinicId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('type, amount')
                .eq('clinic_id', clinicId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const income = data
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const expense = data
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            return {
                data: {
                    income,
                    expense,
                    net: income - expense,
                    transactionCount: data.length,
                },
                error: null,
            };
        } catch (error) {
            const message = handleError(error, { operation: 'getSummary' });
            return { data: null, error: message };
        }
    }

    /**
     * Get today's summary
     * @param {string} clinicId - Clinic ID
     */
    async getTodaySummary(clinicId) {
        const today = getLocalISOString();
        return this.getSummary(clinicId, today, today);
    }

    /**
     * Create income transaction
     * @param {Object} data - Transaction data
     */
    async createIncome(data) {
        return this.create({
            ...data,
            type: 'income',
        });
    }

    /**
     * Create expense transaction
     * @param {Object} data - Transaction data
     */
    async createExpense(data) {
        return this.create({
            ...data,
            type: 'expense',
        });
    }

    /**
     * Get transactions by category
     * @param {string} clinicId - Clinic ID
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     */
    async getByCategory(clinicId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('category, type, amount')
                .eq('clinic_id', clinicId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            // Group by category
            const byCategory = data.reduce((acc, t) => {
                const category = t.category || 'Diğer';
                if (!acc[category]) {
                    acc[category] = { income: 0, expense: 0 };
                }
                acc[category][t.type] += parseFloat(t.amount || 0);
                return acc;
            }, {});

            return { data: byCategory, error: null };
        } catch (error) {
            const message = handleError(error, { operation: 'getByCategory' });
            return { data: null, error: message };
        }
    }
}

export const transactionsAPI = new TransactionsAPI();
