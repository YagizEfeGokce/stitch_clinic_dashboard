import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';

export default function VerifyEmail() {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleEmailVerification = async () => {
            try {
                // Check if user is now authenticated after clicking email link
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session) {
                    setStatus('success');
                    // Redirect to schedule after 3 seconds
                    setTimeout(() => {
                        navigate('/schedule');
                    }, 3000);
                } else {
                    throw new Error('Doğrulama başarısız. Lütfen tekrar deneyin.');
                }
            } catch (err) {
                console.error('Email verification error:', err);
                setError(err.message || 'Bir hata oluştu.');
                setStatus('error');
            }
        };

        handleEmailVerification();
    }, [navigate]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <Spinner size="xl" />
                    <p className="mt-4 text-slate-600 font-medium">E-posta adresiniz doğrulanıyor...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-green-600">verified</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">E-posta Doğrulandı!</h1>
                    <p className="text-slate-600 mb-6">
                        Hesabınız başarıyla aktifleştirildi. Artık tüm özellikleri kullanabilirsiniz.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Spinner size="sm" />
                        <span>Panele yönlendiriliyorsunuz...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-red-600">error</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Doğrulama Başarısız</h1>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined">login</span>
                    Giriş Sayfasına Git
                </button>
            </div>
        </div>
    );
}
