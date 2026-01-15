import { CreditCard, CheckCircle2, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BillingSettings() {
    const { clinic } = useAuth();

    // Calculate remaining beta days
    let daysRemaining = 0;
    if (clinic?.trial_ends_at) {
        const end = new Date(clinic.trial_ends_at);
        const now = new Date();
        const diff = end - now;
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return (
        <div className="space-y-6">
            {/* Beta Status Card */}
            <div className="bg-gradient-to-br from-primary/10 via-purple-50 to-emerald-50 p-6 rounded-xl border border-primary/20 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Beta Dönemi Aktif</h3>
                        <p className="text-sm text-slate-500">Tüm özellikler ücretsiz!</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-slate-800">Beta Süresince Dahil Olan Özellikler</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-2">
                        {[
                            'Sınırsız Randevu',
                            'Sınırsız Personel',
                            'Stok & Envanter Takibi',
                            'Finansal Raporlama',
                            'Hasta Yönetimi',
                            'Öncelikli Destek'
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Current Status */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Abonelik Durumu
                </h3>

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-bold text-slate-900">PRO (Beta)</span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                                ÜCRETSİZ
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            {daysRemaining > 0
                                ? `Beta sürecinin bitmesine ${daysRemaining} gün kaldı.`
                                : 'Beta süreci devam ediyor. Fiyatlandırma yakında belirlenecek.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-amber-600 text-lg">💡</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-800 mb-1">Fiyatlandırma Hakkında</h4>
                        <p className="text-sm text-amber-700">
                            Dermdesk şu anda beta aşamasındadır. Fiyatlandırma politikamız beta testleri tamamlandıktan sonra belirlenecek
                            ve tüm kullanıcılarımıza önceden bildirilecektir. Beta süresince tüm Pro özellikleri ücretsiz olarak kullanabilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
