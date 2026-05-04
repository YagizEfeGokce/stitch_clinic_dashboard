import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowRight, CheckCircle2, LayoutDashboard, Calendar, Users, Shield,
    Zap, TrendingUp, Sparkles, BarChart3, Clock, Lock, ChevronDown,
    Play, Star, ArrowUpRight
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

    useEffect(() => {
        if (user) {
            navigate('/schedule');
        }
    }, [user, navigate]);

    if (user) return null;

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    };

    const staggerContainer = {
        initial: {},
        whileInView: { transition: { staggerChildren: 0.1 } },
        viewport: { once: true, margin: '-80px' }
    };

    const staggerItem = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden noise-overlay">
            {/* === Navbar === */}
            <nav className="fixed w-full z-50 glass border-b border-white/20 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/logo.png" alt="Dermdesk" className="h-10 w-auto object-contain" />
                        <span className="text-lg font-bold tracking-tight text-slate-900">Dermdesk</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Özellikler</button>
                        <button onClick={() => scrollToSection('workflow')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Nasıl Çalışır?</button>
                        <button onClick={() => scrollToSection('stats')} className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Rakamlar</button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
                        >
                            Ücretsiz Başla
                        </button>
                    </div>
                </div>
            </nav>

            {/* === Hero Section === */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 overflow-hidden"
            >
                {/* Animated Mesh Gradient Background */}
                <div className="absolute inset-0 -z-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50" />
                    <div
                        className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full animate-mesh-gradient opacity-40"
                        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)' }}
                    />
                    <div
                        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full animate-pulse-glow opacity-30"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
                    />
                    <div
                        className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full animate-float opacity-25"
                        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)' }}
                    />
                </div>

                {/* Floating decorative elements */}
                <div className="absolute top-32 left-12 w-20 h-20 border border-primary/10 rounded-2xl animate-float hidden lg:block" />
                <div className="absolute bottom-40 right-20 w-16 h-16 border border-primary/10 rounded-full animate-float-delayed hidden lg:block" />
                <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-primary/20 rounded-full animate-pulse hidden lg:block" />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass shadow-sm mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-slate-700">Kliniğinizi Geleceğe Taşıyın</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[1.05]"
                    >
                        Estetik Kliniğinizi
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
                                Profesyonelce
                            </span>
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 10C50 2 100 2 150 6C200 10 250 4 298 8" stroke="rgba(13,148,136,0.3)" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                        </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400"> Yönetin</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        Randevular, hasta takibi, stok yönetimi ve finansal raporlar.
                        Hepsi tek, güçlü ve sezgisel bir platformda.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="group w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Hemen Başla
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="group w-full sm:w-auto px-8 py-4 bg-white/80 text-slate-700 font-bold text-lg rounded-2xl border border-slate-200/80 shadow-sm hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                        >
                            <Play className="w-5 h-5 text-primary" />
                            Tanıtımı İzle
                        </button>
                    </motion.div>

                    {/* Product Showcase with tilt effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="relative max-w-5xl mx-auto"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/10 to-teal-500/20 rounded-[2.5rem] blur-2xl opacity-60" />
                        <div className="relative rounded-3xl bg-slate-900 p-2 shadow-2xl border border-slate-700/50 overflow-hidden">
                            <div className="h-8 flex items-center gap-2 px-4 mb-1">
                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                            </div>
                            <div className="rounded-2xl overflow-hidden bg-white">
                                <img
                                    src="/dashboard-preview.png"
                                    alt="Dermdesk Klinik Yönetim Paneli"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </div>

                        {/* Floating stats badges */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="absolute -left-4 lg:-left-8 top-1/4 glass rounded-2xl p-4 shadow-lg hidden md:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900">500+</div>
                                    <div className="text-xs text-slate-500 font-medium">Aktif Kullanıcı</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="absolute -right-4 lg:-right-8 top-1/3 glass rounded-2xl p-4 shadow-lg hidden md:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <Star className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-slate-900">4.9</div>
                                    <div className="text-xs text-slate-500 font-medium">Kullanıcı Puanı</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-xs font-medium text-slate-400">Keşfet</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* === Stats Section === */}
            <section id="stats" className="py-20 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {[
                            { value: '50K+', label: 'Yönetilen Randevu', icon: Calendar },
                            { value: '500+', label: 'Aktif Klinik', icon: LayoutDashboard },
                            { value: '%99.9', label: 'Uptime Garantisi', icon: Shield },
                            { value: '<2dk', label: 'Ortalama Destek Yanıtı', icon: Clock },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                variants={staggerItem}
                                className="text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors group"
                            >
                                <div className="w-12 h-12 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                    <stat.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === Features Section (Bento Grid) === */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeInUp} className="text-center mb-16">
                        <span className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-3">Özellikler</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Her Şey Kontrol Altında
                        </h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                            Karmaşık Excel dosyalarından ve kağıt yığınlarından kurtulun.
                            Dermdesk ile kliniğinizin tüm operasyonunu dijitalleştirin.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                        {/* Large feature card */}
                        <motion.div
                            {...fadeInUp}
                            className="md:col-span-2 lg:col-span-2 lg:row-span-2 p-8 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Calendar className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Akıllı Randevu Yönetimi</h3>
                                <p className="text-slate-500 leading-relaxed font-medium mb-6 max-w-lg">
                                    Sürükle-bırak takvim ve çakışma önleyici akıllı sistem ile randevu karmaşasına son verin. Otomatik hatırlatmalar ile iptalleri minimize edin.
                                </p>
                                <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                    <img src="/dashboard-preview.png" alt="Randevu Takvimi" className="w-full h-48 object-cover object-top" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Standard cards */}
                        {[
                            {
                                icon: Users,
                                title: 'Detaylı Hasta Profilleri',
                                desc: 'İşlem geçmişi, notlar ve iletişim bilgileri tek bir güvenli dosyada. Hasta hikayelerinizi eksiksiz tutun.',
                                gradient: 'from-blue-500/5 to-transparent'
                            },
                            {
                                icon: LayoutDashboard,
                                title: 'Stok Takibi',
                                desc: 'Ürün ve sarf malzeme stoklarını takip edin, kritik seviyede otomatik uyarı alın.',
                                gradient: 'from-amber-500/5 to-transparent'
                            },
                            {
                                icon: Zap,
                                title: 'Hızlı Satış & Tahsilat',
                                desc: 'İşlem sonrası hızlıca ödeme alın, gelirlerinizi anlık olarak kaydedin.',
                                gradient: 'from-purple-500/5 to-transparent'
                            },
                            {
                                icon: BarChart3,
                                title: 'Gelişmiş Raporlar',
                                desc: 'Gelir/Gider analizleri, personel performansı ve büyüme metrikleri ile veriye dayalı kararlar alın.',
                                gradient: 'from-emerald-500/5 to-transparent'
                            },
                            {
                                icon: Shield,
                                title: 'KVKK Uyumlu & Güvenli',
                                desc: 'Verileriniz şifrelenir ve güvenle saklanır. Rol bazlı yetkilendirme ile tam kontrol.',
                                gradient: 'from-rose-500/5 to-transparent'
                            },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                {...fadeInUp}
                                transition={{ ...fadeInUp.transition, delay: i * 0.1 }}
                                className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full -translate-y-1/2 translate-x-1/2`} />
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm border border-slate-100">
                                        <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium">
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === Workflow Section === */}
            <section id="workflow" className="py-24 bg-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeInUp} className="text-center mb-20">
                        <span className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-3">İş Akışı</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Kliniğinizi Nasıl Düzenliyoruz?
                        </h2>
                    </motion.div>

                    <div className="relative">
                        {/* Connector Line */}
                        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent -translate-y-1/2" />

                        <div className="grid lg:grid-cols-4 gap-8">
                            {[
                                { step: '01', title: 'Randevu Alma', desc: 'Telefon veya online kanaldan gelen randevuyu saniyeler içinde takvime işleyin.' },
                                { step: '02', title: 'Hasta Kabul', desc: 'Hasta geldiğinde profiline erişin, notlarınızı ve işlem detaylarını girin.' },
                                { step: '03', title: 'İşlem & Stok', desc: 'Yapılan işlemi tek tıkla kaydedin, kullanılan ürünleri stoktan düşün.' },
                                { step: '04', title: 'Ödeme & Kayıt', desc: 'Ödemeyi alın, sistem otomatik olarak cari hesaba ve gelire işlesin.' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    className="relative group"
                                >
                                    <div className="bg-slate-50 p-8 rounded-3xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-sm mb-6 shadow-lg shadow-slate-900/20 group-hover:bg-primary group-hover:shadow-primary/25 transition-colors">
                                            {item.step}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                        <p className="text-slate-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* === Testimonials Section === */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeInUp} className="text-center mb-16">
                        <span className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-3">Referanslar</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Kullanıcılarımız Ne Diyor?
                        </h2>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {[
                            {
                                name: 'Dr. Ayşe Demir',
                                clinic: 'Güzellik Merkezi - Nişantaşı',
                                quote: 'Dermdesk sayesinde randevu karmaşası tamamen bitti. Artık tüm müşteri bilgilerim düzenli ve erişilebilir.',
                                rating: 5
                            },
                            {
                                name: 'Zeynep Yılmaz',
                                clinic: 'Estetik Kliniği - Kadıköy',
                                quote: 'Stok takibi özelliği muhteşem. Botox ve dolgularımın durumunu anlık görebiliyorum. Asla stoksuz kalmıyorum.',
                                rating: 5
                            },
                            {
                                name: 'Merve Kaya',
                                clinic: 'Beauty Clinic - Bebek',
                                quote: 'WhatsApp\'tan randevu almaktan yorulmuştum. Dermdesk ile her şey çok kolaylaştı, müşterilerim de çok memnun.',
                                rating: 5
                            },
                        ].map((testimonial, i) => (
                            <motion.div
                                key={i}
                                variants={staggerItem}
                                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-700 mb-6 leading-relaxed font-medium">"{testimonial.quote}"</p>
                                <div className="border-t border-slate-100 pt-4">
                                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                                    <div className="text-sm text-slate-500 font-medium">{testimonial.clinic}</div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === FAQ Section === */}
            <section className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeInUp} className="text-center mb-16">
                        <span className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-3">SSS</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Sıkça Sorulan Sorular
                        </h2>
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="space-y-4">
                        {[
                            { q: 'Kurulum ücreti var mı?', a: 'Hayır, Dermdesk tamamen bulut tabanlıdır. Üyelik oluşturup hemen kullanmaya başlayabilirsiniz.' },
                            { q: 'Verilerim güvende mi?', a: 'Evet, tüm verileriniz 256-bit SSL şifreleme ile korunur ve günlük olarak yedeklenir. KVKK tam uyumludur.' },
                            { q: 'İstediğim zaman iptal edebilir miyim?', a: 'Kesinlikle. Taahhüt yoktur, aboneliğinizi dilediğiniz zaman panonuzdan iptal edebilirsiniz.' },
                            { q: 'Personel sınırlaması var mı?', a: 'Planınıza göre değişir. Pro planda sınırsız personel ekleyebilirsiniz.' },
                        ].map((faq, i) => (
                            <motion.div
                                key={i}
                                variants={staggerItem}
                                className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-primary/20 transition-colors"
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-3">
                                    <ArrowUpRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    {faq.q}
                                </h3>
                                <p className="text-slate-500 leading-relaxed font-medium pl-8">{faq.a}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* === CTA Section === */}
            <section className="py-24 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400">%100 Güvenli & KVKK Uyumlu</span>
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">
                            Kliniğinizi Büyütmeye
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Hazır Mısınız?</span>
                        </h2>

                        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-medium">
                            Dermdesk ile randevu karmaşasına, kayıp verilere ve manuel takibe son verin.
                            Kliniğinizi dijitalleştirmenin en akıllı yolu.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="group px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-2xl shadow-2xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                            >
                                Ücretsiz Başla
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => window.open('mailto:yagiz.gokce19@gmail.com', '_blank')}
                                className="px-10 py-5 bg-white/5 text-white font-bold text-lg rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                            >
                                Demo Talep Et
                            </button>
                        </div>

                        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Kredi kartı gerekmez
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                14 gün ücretsiz deneme
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Anında kurulum
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* === Footer === */}
            <footer className="bg-white border-t border-slate-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/logo.png" alt="Dermdesk" className="h-10 w-auto" />
                                <span className="text-xl font-bold text-slate-900">Dermdesk</span>
                            </div>
                            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                                Estetik klinikleri için modern yönetim sistemi. Randevular, müşteriler ve envanter yönetimi tek bir platformda.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-4">Ürün</h3>
                            <ul className="space-y-3 text-sm font-medium text-slate-500">
                                <li><button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors">Özellikler</button></li>
                                <li><button onClick={() => scrollToSection('workflow')} className="hover:text-primary transition-colors">Nasıl Çalışır?</button></li>
                                <li><button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Fiyatlandırma</button></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-4">Destek</h3>
                            <ul className="space-y-3 text-sm font-medium text-slate-500">
                                <li><button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Gizlilik Politikası</button></li>
                                <li><button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Kullanım Koşulları</button></li>
                                <li><a href="mailto:yagiz.gokce19@gmail.com" className="hover:text-primary transition-colors">İletişim</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-400">© 2026 Dermdesk. Tüm hakları saklıdır.</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium text-slate-400">Tüm sistemler çalışıyor</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
