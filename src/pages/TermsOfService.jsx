import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
                    <h1 className="text-3xl font-black mb-8">Kullanım Şartları</h1>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-500 mb-6">Son Güncelleme: 12 Ocak 2026</p>

                        <h3>1. Kabul</h3>
                        <p>
                            Dermdesk'e kayıt olarak veya hizmetlerimizi kullanarak bu şartları kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız, lütfen hizmetlerimizi kullanmayın.
                        </p>

                        <h3>2. Hesap Güvenliği</h3>
                        <p>
                            Kullanıcı hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmamalı ve hesabınızdaki şüpheli aktiviteleri derhal bize bildirmelisiniz.
                        </p>

                        <h3>3. Abonelik ve Ödemeler</h3>
                        <ul>
                            <li>Hizmetlerimiz abonelik tabanlıdır.</li>
                            <li>Ödemeler seçilen dönem başında peşin tahsil edilir.</li>
                            <li>Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz. İptal durumunda o ayın/yılın sonuna kadar hizmet almaya devam edersiniz.</li>
                        </ul>

                        <h3>4. Yasaklanmış Faaliyetler</h3>
                        <p>Aşağıdaki eylemler kesinlikle yasaktır:</p>
                        <ul>
                            <li>Sistemi yasa dışı amaçlarla kullanmak.</li>
                            <li>Sistemin güvenliğini test etmek veya zafiyet aramak (izinsiz).</li>
                            <li>Diğer kullanıcıların verilerine erişmeye çalışmak.</li>
                        </ul>

                        <h3>5. Sorumluluk Reddi</h3>
                        <p>
                            Dermdesk, hizmetin kesintisiz veya hatasız olacağını garanti etmez. Tıbbi kararlar ve teşhisler tamamen doktorun/uzmanın sorumluluğundadır. Dermdesk sadece idari bir araçtır.
                        </p>

                        <h3>6. Değişiklikler</h3>
                        <p>
                            Bu şartları zaman zaman güncelleyebiliriz. Önemli değişiklikleri size e-posta veya panel üzerinden bildireceğiz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
