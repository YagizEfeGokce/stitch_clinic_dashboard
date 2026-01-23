import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        // Parse the hash fragment from URL (Supabase sends tokens in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('URL params:', { accessToken: !!accessToken, type, hash: window.location.hash });

        const initSession = async () => {
            try {
                // If we have tokens in the URL, set the session
                if (accessToken && refreshToken) {
                    const { data, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (sessionError) {
                        console.error('Session error:', sessionError);
                        setError('Geçersiz veya süresi dolmuş link. Lütfen tekrar şifre sıfırlama isteği gönderin.');
                    } else if (data.session) {
                        setIsReady(true);
                    } else {
                        setError('Oturum oluşturulamadı. Lütfen tekrar deneyin.');
                    }
                } else {
                    // No tokens in URL, check if we already have a session
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        setIsReady(true);
                    } else {
                        setError('Geçersiz veya süresi dolmuş link. Lütfen tekrar şifre sıfırlama isteği gönderin.');
                    }
                }
            } catch (err) {
                console.error('Init session error:', err);
                setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
                setCheckingSession(false);
            }
        };

        initSession();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setSuccess(true);

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Password update error:', err);
            setError(err.message || 'Şifre güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Spinner size="xl" />
                    <p className="mt-4 text-slate-600 font-medium">Doğrulanıyor...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Şifre Güncellendi!</h1>
                    <p className="text-slate-600 mb-6">
                        Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Spinner size="sm" />
                        <span>Giriş sayfasına yönlendiriliyorsunuz...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-red-600">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Geçersiz Link</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-primary">password</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Yeni Şifre Belirle</h1>
                    <p className="text-slate-600">
                        Hesabınız için yeni bir şifre oluşturun.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Yeni Şifre</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">lock</span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="En az 6 karakter"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Şifre Tekrar</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">lock</span>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="Şifreyi tekrar girin"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Spinner size="md" color="white" />
                                <span>Güncelleniyor...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                <span>Şifreyi Güncelle</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
