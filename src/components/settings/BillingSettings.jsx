import { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentService, PLANS } from '../../services/payment';
import { useToast } from '../../context/ToastContext';

export default function BillingSettings() {
    const { clinic, user } = useAuth();
    const { addToast } = useToast();
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    // Default to 'FREE_TRIAL' if not yet in DB, or use what's in context if we refreshed it
    const tier = clinic?.subscription_tier || 'free';
    const status = clinic?.subscription_status || 'trialing';

    const handleUpgrade = async (planId) => {
        try {
            setLoadingPlanId(planId);
            // In a real app, clinic.id would be safer, but for mock user.id works if they are owner
            // We pass clinic.id as the 3rd arg now
            const result = await paymentService.initializePayment(planId, user, clinic?.id);

            if (result.success) {
                addToast(result.message, 'success');
                // Ideally refresh auth context here to get new clinic data
                window.location.reload(); // Simple refresh to see new state
            }
        } catch (error) {
            console.error('Payment error:', error);
            addToast('Ödeme işlemi sırasında bir hata oluştu.', 'error');
        } finally {
            setLoadingPlanId(null);
        }
    };

    // Calculate days remaining if in trial
    let daysRemaining = 0;
    if (clinic?.trial_ends_at) {
        const end = new Date(clinic.trial_ends_at);
        const now = new Date();
        const diff = end - now;
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Plan
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-bold text-slate-900 uppercase">
                                {tier === 'free' ? 'Başlangıç' : tier === 'pro' ? 'PRO' : tier}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status === 'active' || status === 'trialing'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {status === 'trialing' ? 'DENEME SÜRECİ' : status === 'active' ? 'AKTİF' : 'PASİF'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            {status === 'trialing'
                                ? `Ücretsiz denemenizin bitimine ${daysRemaining} gün kaldı.`
                                : `Sonraki ödeme tarihi: ${clinic?.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('tr-TR') : '--/--/----'}`}
                        </p>
                    </div>

                    {tier !== 'pro' && (
                        <button
                            onClick={() => handleUpgrade('pro')}
                            disabled={loadingPlanId === 'pro'}
                            className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-sm shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loadingPlanId === 'pro' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Pro'ya Yükselt
                        </button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    {
                        name: 'Başlangıç',
                        id: 'free',
                        price: 999,
                        features: ['Aylık 200 Randevu', '2 Personel (Hekim + Asistan)', 'Temel Hasta Kartı', 'E-Posta Hatırlatma']
                    },
                    {
                        name: 'Pro',
                        id: 'pro',
                        price: 2499,
                        features: ['Sınırsız Randevu', 'Sınırsız Personel', 'Stok & Envanter Takibi', 'Gelir/Gider Raporları', 'Öncelikli Destek']
                    },
                    { name: 'Enterprise', price: 'Özel', features: ['Atanmış Müşteri Temsilcisi', 'Özel Entegrasyonlar', 'SLA', 'Yerinde Kurulum Opsiyonu'], id: 'enterprise' },
                ].map((plan) => {
                    const isCurrentPlan = tier === plan.id;
                    return (
                        <div key={plan.name} className={`bg-white p-6 rounded-xl border shadow-sm transition-all ${isCurrentPlan ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-slate-800">{plan.name}</h4>
                                {isCurrentPlan && <CheckCircle2 className="w-5 h-5 text-primary" />}
                            </div>

                            <div className="my-4">
                                <span className="text-3xl font-bold text-slate-900">
                                    {typeof plan.price === 'number' ? `₺${plan.price}` : plan.price}
                                </span>
                                {plan.price !== 'Özel' && <span className="text-slate-500">/ay</span>}
                            </div>
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.id !== 'enterprise' ? (
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlanId === plan.id || isCurrentPlan}
                                    className={`w-full py-2 border font-medium rounded-lg transition-colors flex justify-center items-center gap-2
                                        ${isCurrentPlan
                                            ? 'bg-slate-100 text-slate-400 cursor-default border-slate-200'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {loadingPlanId === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isCurrentPlan ? 'Mevcut Plan' : 'Planı Seç'}
                                </button>
                            ) : (
                                <button className="w-full py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    İletişime Geç
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
