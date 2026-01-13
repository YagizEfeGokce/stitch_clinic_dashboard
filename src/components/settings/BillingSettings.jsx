import { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentService, PLANS } from '../../services/payment';
import { useToast } from '../../context/ToastContext';

export default function BillingSettings() {
    const { clinic, user } = useAuth();
    const { addToast } = useToast();
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

    // Default to 'FREE_TRIAL' if not yet in DB
    const tier = clinic?.subscription_tier || 'free';
    const status = clinic?.subscription_status || 'trialing';

    const handleUpgrade = async (planType) => {
        // Determine exact plan ID based on cycle
        let planId = planType;
        if (planType === 'pro' && billingCycle === 'yearly') {
            planId = 'pro_yearly';
        }

        // DOWNGRADE CHECK
        if (planId === 'free') {
            const { eligible, reason } = await paymentService.checkDowngradeEligibility(clinic?.id, 'free');
            if (!eligible) {
                addToast(reason, 'error'); // Show blocking warning
                return;
            }
        }

        try {
            setLoadingPlanId(planId);
            const result = await paymentService.initializePayment(planId, user, clinic?.id);

            if (result.success) {
                addToast(result.message, 'success');
                window.location.reload();
            }
        } catch (error) {
            console.error('Payment error:', error);
            addToast('Ödeme işlemi sırasında bir hata oluştu.', 'error');
        } finally {
            setLoadingPlanId(null);
        }
    };

    // Calculate details
    let daysRemaining = 0;
    if (clinic?.trial_ends_at) {
        const end = new Date(clinic.trial_ends_at);
        const now = new Date();
        const diff = end - now;
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="space-y-6">
            {/* Current Status Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Mevcut Durum
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-bold text-slate-900 uppercase">
                                {tier.includes('free') ? 'Başlangıç' : 'PRO'}
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
                                ? `Beta sürecine özel ücretsiz kullanımınızın bitimine ${daysRemaining} gün kaldı.`
                                : `Sonraki ödeme tarihi: ${clinic?.current_period_end ? new Date(clinic.current_period_end).toLocaleDateString('tr-TR') : '--/--/----'}`}
                        </p>
                    </div>

                    {!tier.includes('pro') && (
                        <button
                            onClick={() => handleUpgrade('pro')}
                            disabled={loadingPlanId}
                            className="px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-sm shadow-primary/30 flex items-center gap-2"
                        >
                            Pro'ya Geç
                        </button>
                    )}
                </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex justify-center items-center gap-4 mb-8">
                <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Aylık Öde</span>
                <button
                    onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative w-14 h-8 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-primary' : 'bg-slate-200'} p-1`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>Yıllık Öde</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                        %25 İndirim
                    </span>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Starter Plan */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-800">Başlangıç</h4>
                        {tier.includes('free') && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="my-4">
                        <span className="text-3xl font-bold text-slate-900">₺999</span>
                        <span className="text-slate-500">/ay</span>
                    </div>
                    <ul className="space-y-3 mb-6 flex-1">
                        {['Aylık 200 Randevu', '2 Personel', 'Temel Özellikler'].map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleUpgrade('free')}
                        disabled={tier.includes('free') || loadingPlanId}
                        className={`w-full py-2 border font-medium rounded-lg transition-colors ${tier.includes('free') ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {tier.includes('free') ? 'Mevcut Plan' : 'Planı Seç'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white p-6 rounded-xl border border-primary ring-1 ring-primary/20 bg-primary/5 shadow-sm transition-all relative flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                        En Popüler
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-800">Pro</h4>
                        {tier.includes('pro') && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="my-4">
                        {billingCycle === 'monthly' ? (
                            <>
                                <span className="text-3xl font-bold text-slate-900">₺2.499</span>
                                <span className="text-slate-500">/ay</span>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-400 line-through">₺29.988</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-slate-900">₺22.490</span>
                                        <span className="text-slate-500 text-sm">/yıl</span>
                                    </div>
                                    <span className="text-xs text-emerald-600 font-bold mt-1">~₺1.874 / ay'a gelir</span>
                                </div>
                            </>
                        )}
                    </div>
                    <ul className="space-y-3 mb-6 flex-1">
                        {['Sınırsız Randevu', 'Sınırsız Personel', 'Stok & Finans', 'Öncelikli Destek'].map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={tier.includes('pro') || loadingPlanId}
                        className={`w-full py-2 border font-medium rounded-lg transition-colors flex justify-center items-center gap-2 ${tier.includes('pro') ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-primary text-white hover:bg-primary-dark border-transparent shadow-md'}`}
                    >
                        {loadingPlanId?.includes('pro') && <Loader2 className="w-4 h-4 animate-spin" />}
                        {tier.includes('pro') ? 'Mevcut Plan' : 'Pro\'ya Yükselt'}
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-800">Enterprise</h4>
                    </div>
                    <div className="my-4">
                        <span className="text-3xl font-bold text-slate-900">Özel</span>
                    </div>
                    <ul className="space-y-3 mb-6 flex-1">
                        {['Özel Entegrasyon', 'Yerinde Kurulum', 'SLA Garantisi', '7/24 Destek'].map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        İletişime Geç
                    </button>
                </div>
            </div>
        </div>
    );
}
