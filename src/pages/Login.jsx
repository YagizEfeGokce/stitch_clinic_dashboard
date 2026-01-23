import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { translateError } from '../utils/errorHelpers';
import { Spinner } from '../components/ui/Spinner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { signIn } = useAuth();

    // Handle regular login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error } = await signIn(email, password);
            if (error) throw error;

            // Check role for redirect
            if (data?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role;
                if (role === 'super_admin') {
                    navigate('/super-admin');
                } else if (role === 'admin' || role === 'owner' || role === 'doctor' || role === 'super_admin') {
                    navigate('/overview');
                } else {
                    navigate('/schedule');
                }
            } else {
                navigate('/schedule');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(translateError(err.message || 'Giriş yapılamadı.'));
            setLoading(false);
        }
    };

    // Login Screen
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image Board */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <img
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop"
                    alt="Clinic Aesthetics"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-12">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white mb-6 border border-white/20">
                            <span className="material-symbols-outlined text-4xl">spa</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4">
                            Dermdesk <span className="text-primary-300">CRM</span>
                        </h1>
                        <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                            Estetik kliniğinizi hassasiyetle yönetin. Müşteriler, randevular ve envanter—hepsi tek bir premium panelde.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                        <span>&copy; 2026 Dermdesk</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-slate-50/30">
                <div className="max-w-md w-full bg-white lg:bg-transparent lg:shadow-none rounded-3xl lg:rounded-none p-8 lg:p-0 shadow-2xl lg:shadow-none border lg:border-none border-slate-100">
                    <div className="text-center lg:text-left mb-10">
                        {/* Mobile Icon */}
                        <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
                            <span className="material-symbols-outlined text-3xl">spa</span>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Hoş Geldiniz
                        </h2>
                        <p className="text-slate-500 font-medium mt-2">
                            Giriş yapmak için bilgilerinizi girin.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <span className="material-symbols-outlined text-xl">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">E-posta Adresi</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">mail</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                                    placeholder="doktor@dermdesk.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Şifre</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-slate-500 hover:text-primary font-medium transition-colors"
                            >
                                Şifremi Unuttum
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Spinner size="md" color="white" />
                                    <span>İşleniyor...</span>
                                </>
                            ) : (
                                <span>Giriş Yap</span>
                            )}
                        </button>
                    </form>

                    {/* Waitlist Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Henüz davet almadınız mı?{' '}
                            <Link to="/" className="text-primary font-semibold hover:underline">
                                Bekleme listesine katılın
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
