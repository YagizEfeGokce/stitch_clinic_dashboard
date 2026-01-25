import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { completeBetaSignup } from '../services/betaUserService';

export default function BetaSignup() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [waitlistData, setWaitlistData] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    // 1. Validate Token on Mount
    useEffect(() => {
        if (!token) {
            setError('Geçersiz davet bağlantısı.');
            setVerifying(false);
            return;
        }

        checkToken();
    }, [token]);

    const checkToken = async () => {
        try {
            const { data, error } = await supabase
                .from('beta_waitlist')
                .select('*')
                .eq('invite_token', token)
                .single();

            if (error || !data) {
                console.error('Token check error:', error);
                setError('Davet bağlantısı bulunamadı veya geçersiz.');
            } else if (new Date(data.token_expires_at) < new Date()) {
                setError('Bu davet bağlantısının süresi dolmuş.');
            } else if (data.status === 'converted') {
                setError('Bu davet zaten kullanılmış.');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setWaitlistData(data);
            }
        } catch (err) {
            setError('Bağlantı kontrol edilirken bir hata oluştu.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            addToast('Şifreler eşleşmiyor.', 'error');
            return;
        }

        if (formData.password.length < 6) {
            addToast('Şifre en az 6 karakter olmalı.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Updated Flow using Edge Function
            // This ensures user is created, confirmed, and linked atomically
            const result = await completeBetaSignup(
                token,
                waitlistData.email,
                formData.password,
                {
                    clinic_name: waitlistData.clinic_name,
                    full_name: waitlistData.owner_name
                }
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            // After successful creation, sign them in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: waitlistData.email,
                password: formData.password
            });

            if (signInError) {
                console.error('Auto login failed:', signInError);
                addToast('Hesabınız oluşturuldu. Lütfen giriş yapın.', 'success');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                addToast('Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => navigate('/dashboard'), 1500);
            }

        } catch (err) {
            console.error('Signup error:', err);
            addToast(err.message || 'Kayıt olurken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-slate-800">Davet Kontrol Ediliyor...</h2>
                    <p className="text-slate-500 mt-2">Lütfen bekleyin.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">!</div>
                    <h2 className="text-xl font-bold text-slate-800">Bağlantı Hatası</h2>
                    <p className="text-slate-500 mt-2 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Hoş Geldiniz!</h1>
                    <p className="text-slate-500 mt-2">
                        <span className="font-semibold text-primary">{waitlistData.clinic_name}</span> için hesabınızı oluşturun.
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                        <input
                            type="email"
                            value={waitlistData.email}
                            disabled
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            required
                            placeholder="En az 6 karakter"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
                        <input
                            type="password"
                            required
                            placeholder="Şifrenizi doğrulayın"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 mt-4"
                    >
                        {loading ? 'Hesap Oluşturuluyor...' : 'Kaydı Tamamla'}
                    </button>
                </form>
            </div>
        </div>
    );
}
