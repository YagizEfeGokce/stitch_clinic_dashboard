import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-green-600">mark_email_read</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">E-posta Gönderildi!</h1>
                    <p className="text-slate-600 mb-6">
                        <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik.
                        Lütfen gelen kutunuzu kontrol edin.
                    </p>
                    <p className="text-sm text-slate-500 mb-6">
                        E-posta birkaç dakika içinde gelmezse, spam klasörünü kontrol edin.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-primary">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Şifremi Unuttum</h1>
                    <p className="text-slate-600">
                        E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">E-posta Adresi</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">mail</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="ornek@dermdesk.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Spinner size="md" color="white" />
                                <span>Gönderiliyor...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                <span>Sıfırlama Linki Gönder</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-slate-600 font-medium hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        </div>
    );
}
