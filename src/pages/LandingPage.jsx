import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, LayoutDashboard, Calendar, Users, Shield, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    const stagger = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // Smart Redirect Logic
    useEffect(() => {
        if (user) {
            navigate('/schedule');
        }
    }, [user, navigate]);

    // If user is logged in, we return nothing while redirecting (or a loader)
    if (user) return null;



    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">spa</span>
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            Dermdesk
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Özellikler</button>
                        <button onClick={() => scrollToSection('workflow')} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Nasıl Çalışır?</button>
                        <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Fiyatlar</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden sm:block font-bold text-slate-600 hover:text-primary transition-colors"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                        >
                            Ücretsiz Başla
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-slate-600">v3.0 Şimdi Yayında: Ekip Yönetimi</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]"
                    >
                        Estetik Kliniğinizi <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                            Profesyonelce Yönetin
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        Randevular, hasta takibi, stok yönetimi ve finansal raporlar.
                        Hepsi tek bir premium panelde. Kurulum gerektirmez.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <button
                            onClick={() => navigate('/login?plan=pro')}
                            className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            1 Ay Ücretsiz Dene (Beta)
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scrollToSection('features')}
                            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold text-lg rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            Özellikleri İncele
                        </button>
                    </motion.div>

                    {/* Product Showcase (Authentic) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl border border-slate-800"
                    >
                        {/* Browser Bar */}
                        <div className="h-8 flex items-center gap-2 px-4 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        </div>
                        {/* Image */}
                        <div className="rounded-xl overflow-hidden bg-white">
                            <img
                                src="/dashboard-preview.png"
                                alt="Dermdesk Hasta Takip Paneli"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Her Şey Kontrol Altında</h2>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Karmaşık Excel dosyalarından ve kağıt yığınlarından kurtulun.
                            Dermdesk ile kliniğinizin tüm operasyonunu dijitalleştirin.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Calendar,
                                title: "Akıllı Randevu Yönetimi",
                                desc: "Sürükle bırak takvim ve çakışma önleyici akıllı sistem ile hataları sıfıra indirin."
                            },
                            {
                                icon: Users,
                                title: "Detaylı Hasta Profilleri",
                                desc: "İşlem geçmişi, notlar ve iletişim bilgileri tek bir güvenli dosyada."
                            },
                            {
                                icon: LayoutDashboard,
                                title: "Stok Takibi",
                                desc: "Ürün ve sarf malzeme stoklarını takip edin, kritik seviyede uyarı alın."
                            },
                            {
                                icon: Zap,
                                title: "Hızlı Satış & Tahsilat",
                                desc: "İşlem sonrası hızlıca ödeme alın, gelirlerinizi anlık olarak kaydedin."
                            },
                            {
                                icon: TrendingUp,
                                title: "Gelişmiş Raporlar",
                                desc: "Gelir/Gider analizleri, personel performansı ve büyüme metrikleri."
                            },
                            {
                                icon: Shield,
                                title: "KVKK Uyumlu & Güvenli",
                                desc: "Verileriniz şifrelenir ve güvenle saklanır. Rol bazlı yetkilendirme ile tam kontrol."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                initial="initial"
                                whileInView="animate"
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                            >
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <feature.icon className="w-7 h-7 text-primary group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section (NEW) */}
            <section id="workflow" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">İş Akışı</span>
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Kliniğinizi Nasıl Düzenliyoruz?</h2>
                    </div>

                    <div className="relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 -z-10" />

                        <div className="grid lg:grid-cols-4 gap-8">
                            {[
                                { step: '01', title: 'Randevu Alma', desc: 'Telefon veya online kanaldan gelen randevuyu saniyeler içinde takvime işleyin.' },
                                { step: '02', title: 'Hasta Kabul', desc: 'Hasta geldiğinde profiline erişin, notlarınızı ve işlem detaylarını girin.' },
                                { step: '03', title: 'İşlem & Stok', desc: 'Yapılan işlemi tek tıkla kaydedin, kullanılan ürünleri stoktan düşün.' },
                                { step: '04', title: 'Ödeme & Kayıt', desc: 'Ödemeyi alın, sistem otomatik olarak cari hesaba ve gelire işlesin.' }
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100 relative group hover:-translate-y-1 transition-transform">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold mb-4 shadow-lg shadow-slate-900/20">
                                        {item.step}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-slate-50 border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Sıkça Sorulan Sorular</h2>
                        <p className="text-lg text-slate-500">Aklınıza takılanları sizin için cevapladık.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "Kurulum ücreti var mı?", a: "Hayır, Dermdesk tamamen bulut tabanlıdır. Üyelik oluşturup hemen kullanmaya başlayabilirsiniz." },
                            { q: "Verilerim güvende mi?", a: "Evet, tüm verileriniz 256-bit SSL şifreleme ile korunur ve günlük olarak yedeklenir. KVKK uyumludur." },
                            { q: "İstediğim zaman iptal edebilir miyim?", a: "Kesinlikle. Taahhüt yoktur, aboneliğinizi dilediğiniz zaman panonuzdan iptal edebilirsiniz." },
                            { q: "Personel sınırlaması var mı?", a: "Planınıza göre değişir. Pro planda sınırsız personel ekleyebilirsiniz." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                                <p className="text-slate-500">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-4xl font-black mb-4">Basit, Şeffaf Fiyatlandırma</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Gizli ücret yok. Taahhüt yok. İstediğiniz zaman iptal edin.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: 'Başlangıç', price: '₺999', features: ['5 Personel', 'Temel Raporlama', 'E-posta Desteği'] },
                            { name: 'Pro', price: '₺2499', features: ['Sınırsız Personel', 'Gelişmiş Analitik', 'Öncelikli Destek', 'API Erişimi'], popular: true },
                            { name: 'Enterprise', price: 'Özel', features: ['Atanmış Müşteri Temsilcisi', 'Özel Entegrasyonlar', 'SLA', 'Yerinde Kurulum Opsiyonu'] },
                        ].map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className={`relative p-8 rounded-3xl border ${plan.popular ? 'bg-slate-800/50 border-primary shadow-2xl shadow-primary/20' : 'bg-slate-800/30 border-white/10'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                                        En Popüler
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-black">{plan.price}</span>
                                    {plan.price !== 'Özel' && <span className="text-slate-400">/ay</span>}
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                            <span className="text-sm font-medium">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => {
                                        if (plan.name === 'Enterprise') {
                                            window.location.href = 'mailto:yagiz.gokce19@gmail.com';
                                        } else {
                                            navigate(`/login?plan=${plan.name === 'Başlangıç' ? 'free' : 'pro'}`);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                >
                                    {plan.name === 'Enterprise' ? 'İletişime Geç' : '1 Ay Ücretsiz Dene'}
                                </button>
                                {plan.name !== 'Enterprise' && (
                                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                                        Kredi kartı gerekmez.
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* COMPARISON TABLE */}
            <section className="py-24 bg-slate-900 border-t border-white/10 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h3 className="text-2xl font-bold text-white mb-4">Hangi Paket Size Uygun?</h3>
                        <p className="text-slate-400 text-lg">Özellikleri detaylıca karşılaştırın ve size en uygun olanı seçin.</p>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-white/10 shadow-2xl bg-slate-800/20 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-6 border-b border-white/10 text-slate-400 font-medium w-1/3">Özellikler</th>
                                    <th className="p-6 border-b border-white/10 text-white font-bold text-center w-1/5 text-lg">Başlangıç</th>
                                    <th className="p-6 border-b border-primary/30 text-primary font-bold text-center w-1/5 text-xl bg-primary/10">Pro</th>
                                    <th className="p-6 border-b border-white/10 text-white font-bold text-center w-1/5 text-lg">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 divide-y divide-white/5">
                                {[
                                    { name: 'Personel Sayısı', free: '2 Kişi', pro: 'Sınırsız', ent: 'Sınırsız' },
                                    { name: 'Aylık Randevu', free: '200 Adet', pro: 'Sınırsız', ent: 'Sınırsız' },
                                    { name: 'Hasta Kartı & Arşiv', free: true, pro: true, ent: true },
                                    { name: 'Stok & Envanter Takibi', free: false, pro: true, ent: true },
                                    { name: 'Gelir/Gider Takibi', free: true, pro: true, ent: true },
                                    { name: 'Otomatik E-posta Bildirimleri', free: true, pro: true, ent: true },
                                    { name: 'Müşteri Desteği', free: 'E-posta', pro: 'Öncelikli (WhatsApp)', ent: '7/24 Telefon' },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-5 font-medium border-r border-white/5">{row.name}</td>
                                        <td className="p-5 text-center border-r border-white/5">
                                            {typeof row.free === 'boolean' ? (
                                                row.free ?
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div> :
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 text-slate-500"><span className="material-symbols-outlined text-base">close</span></div>
                                            ) : <span className="text-white font-medium">{row.free}</span>}
                                        </td>
                                        <td className="p-5 text-center font-bold text-white bg-primary/5 border-x border-primary/20 relative">
                                            {typeof row.pro === 'boolean' ? (
                                                row.pro ?
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30"><CheckCircle2 className="w-5 h-5" /></div> :
                                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                            ) : <span className="text-white text-lg">{row.pro}</span>}
                                        </td>
                                        <td className="p-5 text-center border-l border-white/5">
                                            {typeof row.ent === 'boolean' ? (
                                                row.ent ?
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div> :
                                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                            ) : <span className="text-white font-medium">{row.ent}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Bottom Section */}
            <section className="py-24 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl lg:text-5xl font-black text-white mb-8">Kliniğinizi Büyütmeye Hazır Mısınız?</h2>
                    <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto">Beta sürecine özel 1 ay boyunca tüm özellikleri ücretsiz deneyin.</p>
                    <button
                        onClick={() => navigate('/login?plan=pro')}
                        className="px-10 py-5 bg-white text-primary font-bold text-xl rounded-2xl shadow-2xl hover:bg-slate-50 hover:scale-[1.02] transition-all"
                    >
                        Hemen Ücretsiz Dene
                    </button>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                    <p className="font-bold text-slate-900">© 2025 Dermdesk.</p>
                    <div className="flex gap-8 text-sm font-medium text-slate-500">
                        <a href="/privacy" className="hover:text-primary transition-colors">Gizlilik Politikası</a>
                        <a href="/terms" className="hover:text-primary transition-colors">Kullanım Şartları</a>
                        <a href="mailto:yagiz.gokce19@gmail.com" className="hover:text-primary">İletişim</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
