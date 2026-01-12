import { supabase } from '../lib/supabase';

// Configuration
const USE_MOCK = true; // Set to false when ready for real Iyzico

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Başlangıç',
        price: 999,
        features: ['2 Personel', 'Temel Raporlama']
    },
    PRO: {
        id: 'pro',
        name: 'Pro',
        price: 2499,
        priceId: 'price_iyzico_pro_monthly_id', // Replace with real Iyzico Price ID later
        features: ['Sınırsız Personel', 'Gelişmiş Analitik', 'Öncelikli Destek']
    }
};

export const paymentService = {
    /**
     * Initialize a payment process for a plan upgrade
     * @param {string} planId - The target plan ID (e.g., 'pro')
     * @param {object} user - The current user object
     * @param {string} clinicId - The clinic ID
     */
    initializePayment: async (planId, user, clinicId) => {
        console.log(`Initializing payment for plan: ${planId} [Mock: ${USE_MOCK}]`);

        if (USE_MOCK) {
            return mockPaymentFlow(planId, clinicId);
        } else {
            // Real Iyzico Flow (To be implemented)
            // 1. Call your backend to create an Iyzico Checkout Form
            // 2. Return the script/iframe content or redirect URL
            throw new Error("Real payment integration not yet configured.");
        }
    },

    /**
     * Check payment status (useful for callbacks)
     */
    checkStatus: async (token) => {
        if (USE_MOCK) return { status: 'success' };
        // Validates token with backend
    }
};

// --- Mock Implementation ---

const mockPaymentFlow = (planId, clinicId) => {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // In a real app, this would redirect. 
            // Here we simulate a "Successful Payment" immediately for dev speed.

            // 1. Update Database directly (since we are mocking the webhook too)
            updateSubscriptionMock(clinicId, planId)
                .then(() => {
                    resolve({
                        success: true,
                        message: "Mock ödeme başarılı! Paketiniz yükseltildi.",
                        plan: planId
                    });
                })
                .catch(err => {
                    reject({
                        success: false,
                        message: "Veritabanı güncellenemedi."
                    });
                });

        }, 1500);
    });
};

const updateSubscriptionMock = async (clinicId, planId) => {
    // Calculate trial/period end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days sub

    const { error } = await supabase
        .from('clinics')
        .update({
            subscription_tier: planId,
            subscription_status: 'active',
            current_period_end: endDate.toISOString()
        })
        .eq('id', clinicId);

    if (error) throw error;
};
