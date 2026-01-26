import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Ana Sayfaya Dön
                </button>

                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
                    <h1 className="text-3xl font-black mb-8">Gizlilik Politikası</h1>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-500 mb-6">Son Güncelleme: 12 Ocak 2026</p>

                        <h3>1. Veri Sorumlusu</h3>
                        <p>
                            Dermdesk ("Biz", "Şirket"), kullanıcılarımızın gizliliğine saygı duyar. Bu Gizlilik Politikası, hizmetlerimizi kullandığınızda topladığımız verileri nasıl işlediğimizi açıklar.
                        </p>

                        <h3>2. Toplanan Veriler</h3>
                        <p>Hizmetlerimizi kullanırken aşağıdaki bilgileri toplayabiliriz:</p>
                        <ul>
                            <li><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi, klinik bilgileri.</li>
                            <li><strong>Hasta Verileri:</strong> Kliniğiniz tarafından sisteme girilen randevu ve hasta kayıtları (Bu veriler şifreli saklanır ve tarafımızca işlenmez).</li>
                            <li><strong>Kullanım Verileri:</strong> IP adresi, tarayıcı tipi, cihaz bilgileri.</li>
                        </ul>

                        <h3>3. Verilerin Kullanımı</h3>
                        <p>Topladığımız verileri şu amaçlarla kullanırız:</p>
                        <ul>
                            <li>Hizmetlerimizi sağlamak ve sürdürmek.</li>
                            <li>Teknik destek sunmak.</li>
                            <li>Güvenliği sağlamak ve dolandırıcılığı önlemek.</li>
                            <li>Yasal yükümlülükleri yerine getirmek.</li>
                        </ul>

                        <h3>4. Veri Güvenliği</h3>
                        <p>
                            Verileriniz endüstri standardı güvenlik önlemleri (SSL şifreleme, RLS politikaları) ile korunmaktadır. Ancak internet üzerinden yapılan hiçbir iletimin %100 güvenli olmadığını hatırlatırız.
                        </p>

                        <h3>5. Üçüncü Taraf Hizmetleri</h3>
                        <p>
                            Bazı hizmetleri sağlamak için güvenilir üçüncü taraflarla (örn. Stripe, Iyzico, Resend) çalışmaktayız. Bu sağlayıcıların kendi gizlilik politikaları geçerlidir.
                        </p>

                        <h3>6. İletişim</h3>
                        <p>
                            Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz: <a href="mailto:yagiz.gokce19@gmail.com" className="text-primary hover:underline">yagiz.gokce19@gmail.com</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
