import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
    Calendar, Users, Package, CreditCard, BarChart3,
    CheckCircle, ArrowRight, Star, ChevronDown, Copy, Share2, MessageCircle
} from 'lucide-react';

// Türkiye'nin tüm illeri
const TURKEY_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
    'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
    'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
    'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
    'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
    'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
    'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
    'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
    'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
].sort((a, b) => a.localeCompare(b, 'tr'));

export default function BetaLanding() {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        clinic_name: '',
        owner_name: '',
        email: '',
        phone: '',
        city: '',
        current_system: '',
        referral_code: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [waitlistPosition, setWaitlistPosition] = useState(null);
    const [referralCode, setReferralCode] = useState('');

    // Get referral code from URL if present
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            setFormData(prev => ({ ...prev, referral_code: ref }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate unique referral code
            const newReferralCode = generateReferralCode(formData.clinic_name);

            // Prepare data without user's referral_code input (that goes to referred_by)
            const insertData = {
                clinic_name: formData.clinic_name,
                owner_name: formData.owner_name,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                current_system: formData.current_system || null,
                referral_code: newReferralCode,
                referred_by: formData.referral_code || null,
                status: 'pending',
            };

            // Insert into waitlist
            const { data, error } = await supabase
                .from('beta_waitlist')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Insert error:', error);
                throw error;
            }

            // Get waitlist position
            const { count } = await supabase
                .from('beta_waitlist')
                .select('*', { count: 'exact', head: true })
                .lte('created_at', data.created_at);

            setWaitlistPosition(count);
            setReferralCode(newReferralCode);
            setSubmitted(true);

            // Track with PostHog
            if (window.posthog) {
                window.posthog.capture('beta_signup', {
                    clinic_name: formData.clinic_name,
                    city: formData.city,
                    current_system: formData.current_system,
                    has_referral: !!formData.referral_code,
                });
            }

            addToast('Beta kaydınız alındı! 🎉', 'success');
        } catch (err) {
            console.error('Beta signup error:', err);
            if (err.code === '23505') {
                addToast('Bu e-posta adresi zaten kayıtlı.', 'error');
            } else {
                addToast('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateReferralCode = (clinicName) => {
        const cleaned = clinicName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 6);
        const random = Math.random().toString(36).substring(2, 6);
        return `${cleaned}${random}`.toUpperCase();
    };

    if (submitted) {
        return <BetaSuccessScreen
            position={waitlistPosition}
            referralCode={referralCode}
            email={formData.email}
        />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Dermdesk Logo"
                            className="h-10 w-10 object-contain rounded-lg"
                        />
                        <span className="text-xl font-bold text-gray-900">Dermdesk</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-teal-100 text-teal-800 px-3 py-1.5 rounded-full text-sm font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                            </span>
                            BETA AÇIK
                        </div>
                        <Link
                            to="/login"
                            className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
                        >
                            Giriş Yap
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Copy */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Star className="w-4 h-4" />
                            Beta programı başladı - İlk 50 klinik ücretsiz
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Estetik kliniğinizi
                            <span className="text-teal-600"> dijitalleştirin</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Randevularınızı, müşterilerinizi ve işlemlerinizi tek bir yerden yönetin.
                            Excel'e, WhatsApp'a veda edin.
                        </p>

                        {/* Social Proof */}
                        <div className="flex items-center gap-6 mb-8">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">50+</div>
                                <div className="text-sm text-gray-600">Beta Kullanıcısı</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300"></div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">4.9★</div>
                                <div className="text-sm text-gray-600">Kullanıcı Puanı</div>
                            </div>
                            <div className="w-px h-12 bg-gray-300"></div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">%100</div>
                                <div className="text-sm text-gray-600">Veri Güvenliği</div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Kredi kartı gerektirmez
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                3 ay ücretsiz kullanım
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                İstediğiniz zaman iptal
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div id="signup-form" className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Beta Programına Katıl
                            </h2>
                            <p className="text-gray-600">
                                İlk 50 klinik <span className="font-semibold text-teal-600">3 ay ücretsiz</span> kullanır
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Klinik Adı *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.clinic_name}
                                    onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                    placeholder="Örn: Güzellik Merkezi Nişantaşı"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    İsim Soyisim *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.owner_name}
                                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                    placeholder="Örn: Ayşe Yılmaz"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    E-posta *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="ornek@email.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Telefon *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="05XX XXX XX XX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Şehir *
                                </label>
                                <select
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="">Seçiniz</option>
                                    {TURKEY_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Şu anda nasıl yönetiyorsunuz?
                                </label>
                                <select
                                    value={formData.current_system}
                                    onChange={(e) => setFormData({ ...formData, current_system: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="">Seçiniz (opsiyonel)</option>
                                    <option value="Excel">Excel</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Defter">Defter/Ajanda</option>
                                    <option value="Başka CRM">Başka bir CRM</option>
                                    <option value="Hiçbiri">Herhangi bir sistem yok</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Referans Kodu (varsa)
                                </label>
                                <input
                                    type="text"
                                    value={formData.referral_code}
                                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                                    placeholder="ABCD1234"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none uppercase"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Referans kodu ile sırada 5 basamak öne geçin!
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        Beta'ya Katıl - Ücretsiz
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Kaydolarak <Link to="/privacy" className="text-teal-600 hover:underline">Gizlilik Politikası</Link>'nı ve <Link to="/terms" className="text-teal-600 hover:underline">Kullanım Koşulları</Link>'nı kabul etmiş olursunuz.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Neden Dermdesk?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Estetik klinikler için özel olarak tasarlandı. Sektörün ihtiyaçlarını anlıyoruz.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            Icon={Calendar}
                            title="Akıllı Randevu Sistemi"
                            description="WhatsApp'tan kurtulun. Randevuları tek yerden yönetin, çakışma olmadan planlayın."
                        />
                        <FeatureCard
                            Icon={Users}
                            title="Müşteri Yönetimi"
                            description="Tüm müşteri bilgileri, tedavi geçmişi ve notları tek bir yerde. Excel'e veda."
                        />
                        <FeatureCard
                            Icon={Package}
                            title="Stok Takibi"
                            description="Botox, dolgu ve diğer ürünlerinizin stok durumunu anlık takip edin."
                        />
                        <FeatureCard
                            Icon={CreditCard}
                            title="Finans Yönetimi"
                            description="Gelir-gider takibi, ödeme yönetimi, raporlama. Mali durumunuzu her an görün."
                        />
                        <FeatureCard
                            Icon={BarChart3}
                            title="Detaylı Raporlar"
                            description="Hangi hizmet daha çok tercih ediliyor? Hangi ay daha karlı? Veriye dayalı karar verin."
                        />
                        <FeatureCard
                            Icon={CheckCircle}
                            title="KVKK Uyumlu"
                            description="Tüm verileriniz şifreli olarak Türkiye'deki sunucularda güvenle saklanır."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="py-20 bg-teal-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Beta Kullanıcılarımız Ne Diyor?
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Dr. Ayşe Demir"
                            clinic="Güzellik Merkezi - Nişantaşı"
                            quote="Dermdesk sayesinde randevu karmaşası bitti. Artık tüm müşteri bilgilerim düzenli ve erişilebilir."
                            rating={5}
                        />
                        <TestimonialCard
                            name="Zeynep Yılmaz"
                            clinic="Estetik Kliniği - Kadıköy"
                            quote="Stok takibi özelliği harika. Botox ve dolgularımın durumunu anlık görebiliyorum."
                            rating={5}
                        />
                        <TestimonialCard
                            name="Merve Kaya"
                            clinic="Beauty Clinic - Bebek"
                            quote="WhatsApp'tan randevu almaktan yorulmuştum. Dermdesk her şeyi çok kolaylaştırdı."
                            rating={5}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Sık Sorulan Sorular
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <FAQItem
                            question="Beta programı ne kadar sürecek?"
                            answer="Beta programımız yaklaşık 3 ay sürecek. Bu süre boyunca tüm premium özellikleri ücretsiz kullanabileceksiniz."
                        />
                        <FAQItem
                            question="Kredi kartı bilgisi gerekli mi?"
                            answer="Hayır! Beta programına katılmak için kredi kartı bilgisi gerekmez. 3 ay boyunca tamamen ücretsiz kullanabilirsiniz."
                        />
                        <FAQItem
                            question="Verilerim güvende mi?"
                            answer="Kesinlikle. Tüm verileriniz şifreli olarak saklanır ve sadece siz erişebilirsiniz. KVKK uyumlu çalışıyoruz."
                        />
                        <FAQItem
                            question="Teknik destek alabilir miyim?"
                            answer="Elbette! Beta kullanıcılarımıza öncelikli destek sağlıyoruz. E-posta ile yanınızdayız."
                        />
                        <FAQItem
                            question="Beta sonrası ne olacak?"
                            answer="Beta sonunda uygun fiyatlı planlarımızı duyuracağız. Beta kullanıcılarımıza özel indirimler sunacağız."
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Hemen Başlayın, 3 Ay Ücretsiz Kullanın
                    </h2>
                    <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
                        İlk 50 klinik arasına girin. Kredi kartı gerektirmez, istediğiniz zaman iptal edebilirsiniz.
                    </p>
                    <button
                        onClick={() => {
                            document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-50 transition-colors shadow-xl"
                    >
                        Beta'ya Katıl
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img
                                    src="/logo.png"
                                    alt="Dermdesk Logo"
                                    className="h-8 w-8 object-contain rounded-lg"
                                />
                                <span className="text-white font-bold text-lg">Dermdesk</span>
                            </div>
                            <p className="text-sm max-w-xs">
                                Estetik klinikler için modern yönetim sistemi. Randevular, müşteriler ve envanter yönetimi tek bir platformda.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-4">Yasal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                                <li><Link to="/terms" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                            </ul>
                            <div className="mt-6">
                                <p className="text-sm text-gray-500">İletişim</p>
                                <a href="mailto:destek@dermdesk.net" className="text-sm hover:text-white transition-colors">destek@dermdesk.net</a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        © 2026 Dermdesk. Tüm hakları saklıdır.
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Success Screen Component
function BetaSuccessScreen({ position, referralCode, email }) {
    const shareUrl = `${window.location.origin}/beta?ref=${referralCode}`;
    const shareText = `Dermdesk Beta programına katıldım! Sen de katıl, estetik kliniğini dijitalleştir. Referans kodum: ${referralCode}`;

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Referans linki kopyalandı!');
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Referans linki kopyalandı!');
        }
    };

    const shareWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
    };

    const shareNative = async () => {
        if (navigator.share) {
            await navigator.share({ title: 'Dermdesk Beta', text: shareText, url: shareUrl });
        } else {
            copyReferralLink();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Hoş Geldiniz! 🎉
                </h1>

                <p className="text-xl text-gray-600 mb-8">
                    Beta programına başarıyla kaydoldunuz!
                </p>

                <div className="bg-teal-50 rounded-lg p-6 mb-8">
                    <div className="text-sm text-gray-600 mb-2">Sıradaki Yeriniz</div>
                    <div className="text-5xl font-bold text-teal-600 mb-2">#{position}</div>
                    <div className="text-sm text-gray-600">Toplam {position + 150} kişi arasında</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="font-semibold text-gray-900 mb-4">Sırada 5 Basamak Öne Geç! 🚀</h2>
                    <p className="text-gray-600 mb-4">
                        3 arkadaşını davet et, sırada 15 basamak öne geç ve beta erişimini hızlandır!
                    </p>

                    <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-xs text-gray-500 mb-1">Senin Referans Kodun</div>
                        <div className="text-2xl font-mono font-bold text-gray-900 mb-2">{referralCode}</div>
                        <button
                            onClick={copyReferralLink}
                            className="text-sm text-teal-600 hover:underline flex items-center gap-1 mx-auto"
                        >
                            <Copy className="w-4 h-4" />
                            Linki Kopyala
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={shareWhatsApp}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp'ta Paylaş
                        </button>
                        <button
                            onClick={shareNative}
                            className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Paylaş
                        </button>
                    </div>
                </div>

                <div className="text-left space-y-4 mb-8">
                    <h3 className="font-semibold text-gray-900">Sırada ne var?</h3>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-teal-600 font-bold">1</span>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">E-posta Onayı</div>
                            <div className="text-sm text-gray-600">{email} adresine onay linki gönderdik</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-teal-600 font-bold">2</span>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Erişim Daveti</div>
                            <div className="text-sm text-gray-600">Sıranız geldiğinde size haber vereceğiz (1-3 gün içinde)</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-teal-600 font-bold">3</span>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Hemen Başlayın</div>
                            <div className="text-sm text-gray-600">Kliniğinizi kurun ve 3 ay ücretsiz kullanın</div>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-500">
                    Sorularınız mı var? <a href="mailto:destek@dermdesk.net" className="text-teal-600 hover:underline">destek@dermdesk.net</a>
                </p>
            </div>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ Icon, title, description }) {
    return (
        <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

// Testimonial Card Component
function TestimonialCard({ name, clinic, quote, rating }) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex mb-4">
                {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
            </div>
            <p className="text-gray-700 mb-4 italic">"{quote}"</p>
            <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">{name}</div>
                <div className="text-sm text-gray-600">{clinic}</div>
            </div>
        </div>
    );
}

// FAQ Item Component
function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900">{question}</span>
                <ChevronDown className={clsx(
                    "w-5 h-5 text-gray-500 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>
            {isOpen && (
                <div className="px-6 pb-4 text-gray-600">
                    {answer}
                </div>
            )}
        </div>
    );
}
