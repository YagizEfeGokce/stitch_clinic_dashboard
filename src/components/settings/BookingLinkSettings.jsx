import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Link2, Copy, Check, ExternalLink, MessageCircle, Settings2, Calendar, Clock } from 'lucide-react';

/**
 * BookingLinkSettings - Manage clinic slug, advance days, and booking links
 */
export default function BookingLinkSettings() {
    const { clinic, setClinic } = useAuth();
    const { success, error: showError } = useToast();
    const [slug, setSlug] = useState('');
    const [originalSlug, setOriginalSlug] = useState('');
    const [advanceDays, setAdvanceDays] = useState(30);
    const [originalAdvanceDays, setOriginalAdvanceDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (clinic) {
            setSlug(clinic.slug || '');
            setOriginalSlug(clinic.slug || '');
            const days = clinic.settings_config?.online_booking_advance_days || 30;
            setAdvanceDays(days);
            setOriginalAdvanceDays(days);
            setLoading(false);
        }
    }, [clinic]);

    // Generate slug from clinic name
    function generateSlugFromName(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[ğ]/g, 'g')
            .replace(/[ü]/g, 'u')
            .replace(/[ş]/g, 's')
            .replace(/[ı]/g, 'i')
            .replace(/[ö]/g, 'o')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    // Validate slug
    function isValidSlug(s) {
        if (!s) return false;
        if (s.length < 3) return false;
        if (s.length > 50) return false;
        return /^[a-z0-9-]+$/.test(s);
    }

    // Check if there are changes
    const hasChanges = slug !== originalSlug || advanceDays !== originalAdvanceDays;

    // Save settings
    async function handleSave() {
        if (slug && !isValidSlug(slug)) {
            showError('Geçersiz URL. Sadece küçük harf, rakam ve tire kullanın (en az 3 karakter).');
            return;
        }

        if (advanceDays < 7 || advanceDays > 90) {
            showError('İleri randevu günü 7 ile 90 arasında olmalı.');
            return;
        }

        setSaving(true);
        try {
            const updatedSettings = {
                ...clinic.settings_config,
                online_booking_advance_days: advanceDays
            };

            const { data, error } = await supabase
                .from('clinics')
                .update({
                    slug: slug.toLowerCase() || null,
                    settings_config: updatedSettings
                })
                .eq('id', clinic.id)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    showError('Bu URL zaten kullanılıyor. Farklı bir URL seçin.');
                } else {
                    throw error;
                }
                return;
            }

            // Update context
            if (setClinic && data) {
                setClinic(data);
            }

            setOriginalSlug(slug);
            setOriginalAdvanceDays(advanceDays);
            success('Online randevu ayarları güncellendi!');
        } catch (err) {
            console.error('[BookingLinkSettings] Save error:', err);
            showError('Kaydetme sırasında hata oluştu');
        } finally {
            setSaving(false);
        }
    }

    // Auto-generate slug
    function handleAutoGenerate() {
        if (clinic?.name) {
            const generated = generateSlugFromName(clinic.name);
            setSlug(generated);
        }
    }

    // Copy link to clipboard
    async function handleCopyLink() {
        if (!originalSlug) return;

        const link = `https://${originalSlug}.dermdesk.com/book`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            success('Link kopyalandı!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showError('Kopyalama başarısız');
        }
    }

    // Share via WhatsApp
    function handleWhatsAppShare() {
        if (!originalSlug) return;

        const link = `https://${originalSlug}.dermdesk.com/book`;
        const message = encodeURIComponent(`Merhaba! ${clinic?.name || 'Kliniğimiz'} için online randevu almak için bu linki kullanabilirsiniz:\n\n${link}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    // Get booking URL
    const bookingUrl = originalSlug
        ? `https://${originalSlug}.dermdesk.com/book`
        : null;

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 w-40 bg-slate-200 rounded"></div>
                    <div className="h-12 bg-slate-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-slate-900 text-lg font-bold leading-tight flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Online Randevu Ayarları
                </h3>
            </div>

            <p className="text-sm text-slate-500">
                Müşterilerinizin WhatsApp veya Instagram üzerinden randevu alabilmesi için ayarları yapılandırın.
            </p>

            {/* Slug Input */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                    Klinik URL Adresi
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                        <span className="text-slate-400 text-sm pl-3 shrink-0">https://</span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="klinik-adiniz"
                            className="flex-1 bg-transparent border-none px-1 py-3 text-base font-medium text-slate-900 focus:outline-none focus:ring-0"
                        />
                        <span className="text-slate-400 text-sm pr-3 shrink-0">.dermdesk.com</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleAutoGenerate}
                        className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        title="Otomatik oluştur"
                    >
                        <Settings2 className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <p className="text-xs text-slate-400">
                    Sadece küçük harf, rakam ve tire (-) kullanabilirsiniz.
                </p>
            </div>

            {/* Advance Booking Days */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    İleri Randevu Süresi
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="7"
                        max="90"
                        value={advanceDays}
                        onChange={(e) => setAdvanceDays(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 min-w-[80px]">
                        <input
                            type="number"
                            min="7"
                            max="90"
                            value={advanceDays}
                            onChange={(e) => setAdvanceDays(Math.min(90, Math.max(7, parseInt(e.target.value) || 7)))}
                            className="w-12 bg-transparent border-none text-center font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs text-slate-500">gün</span>
                    </div>
                </div>
                <p className="text-xs text-slate-400">
                    Müşteriler kaç gün ilerisine kadar randevu alabilir? (7-90 gün)
                </p>
            </div>

            {/* Working Hours Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-700">
                        <p className="font-semibold">Çalışma Saatleri</p>
                        <p className="mt-0.5">
                            Randevu saatleri ve günleri "Klinik Marka & Bilgileri" bölümünden ayarlanır.
                            {clinic?.settings_config?.working_start_hour && (
                                <span className="block mt-1 font-medium">
                                    Mevcut: {clinic.settings_config.working_start_hour} - {clinic.settings_config.working_end_hour}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            )}

            {/* Active Link Display */}
            {bookingUrl && (
                <div className="bg-gradient-to-r from-primary/5 to-emerald-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 mb-1">Aktif Randevu Linkiniz:</p>
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-semibold text-sm hover:underline truncate block"
                            >
                                {bookingUrl}
                            </a>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className={`p-2.5 rounded-xl transition-all shrink-0 ${copied
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                }`}
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white font-semibold text-sm rounded-xl hover:bg-[#20BD5A] transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp ile Paylaş
                        </button>
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:border-slate-300 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Önizle
                        </a>
                    </div>
                </div>
            )}

            {/* No Slug Warning */}
            {!originalSlug && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 text-sm font-medium">
                        ⚠️ Randevu linki henüz oluşturulmadı. Yukarıdaki alana klinik URL'nizi girin ve kaydedin.
                    </p>
                </div>
            )}
        </div>
    );
}
