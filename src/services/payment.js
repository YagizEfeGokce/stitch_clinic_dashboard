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
        name: 'Pro (Aylık)',
        price: 2499,
        priceId: 'price_iyzico_pro_monthly_id',
        features: ['Sınırsız Personel', 'Gelişmiş Analitik', 'Öncelikli Destek']
    },
    PRO_YEARLY: {
        id: 'pro_yearly',
        name: 'Pro (Yıllık)',
        price: 22490, // ~1874 TL/month (25% discount on 2499*12)
        priceId: 'price_iyzico_pro_yearly_id',
        features: ['Sınırsız Personel', 'Gelişmiş Analitik', 'Öncelikli Destek', '%25 İndirim']
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
    },

    /**
     * Check if a clinic is eligible to downgrade to a specific plan
     * @returns {Promise<{eligible: boolean, reason: string}>}
     */
    checkDowngradeEligibility: async (clinicId, targetPlanId) => {
        if (targetPlanId !== 'free') return { eligible: true };

        // 1. Check Staff Count
        const { count: staffCount, error: staffError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId);

        if (staffError) {
            console.error('Error checking staff:', staffError);
            return { eligible: false, reason: 'Personel kontrolü yapılamadı.' };
        }

        if (staffCount > 2) {
            return {
                eligible: false,
                reason: `Başlangıç paketinde en fazla 2 personel olabilir. Şu an ${staffCount} personeliniz var. Lütfen önce personel sayısını azaltın.`
            };
        }

        // 2. Check Inventory (Pro Feature)
        // Starter plan does not support inventory. If they have items, they must clear them.
        const { count: inventoryCount, error: inventoryError } = await supabase
            .from('inventory')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId);

        if (inventoryError) {
            console.error('Error checking inventory:', inventoryError);
            return { eligible: false, reason: 'Stok kontrolü yapılamadı.' };
        }

        if (inventoryCount > 0) {
            return {
                eligible: false,
                reason: `Başlangıç paketinde Stok Takibi özelliği yoktur. Şu an ${inventoryCount} kayıtlı ürününüz var. Paket düşürmek için önce stok kayıtlarını silmelisiniz.`
            };
        }

        // 3. Check Upcoming Appointments limit (200)
        // We check usage for the *current month* or *future* depending on business logic. 
        // Generous approach: Check if they have > 200 active future appointments.
        const todayStr = new Date().toISOString().split('T')[0];
        const { count: apptCount, error: apptError } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .gte('date', todayStr); // Future appointments

        if (apptError) {
            console.error('Error checking appointments:', apptError);
            return { eligible: false, reason: 'Randevu kontrolü yapılamadı.' };
        }

        if (apptCount > 200) {
            return {
                eligible: false,
                reason: `Başlangıç paketinde limit 200 randevudur. Şu an ${apptCount} ileri tarihli randevunuz var. Lütfen randevu sayısını azaltın.`
            };
        }

        return { eligible: true };
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
    const isYearly = planId.includes('yearly');
    const days = isYearly ? 365 : 30;
    endDate.setDate(endDate.getDate() + days);

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
