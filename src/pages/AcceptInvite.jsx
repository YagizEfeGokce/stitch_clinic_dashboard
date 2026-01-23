import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';

export default function AcceptInvite() {
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        password: '',
        confirmPassword: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('invite');

    useEffect(() => {
        const fetchInvite = async () => {
            if (!token) {
                setError('Geçersiz davet linki.');
                setLoading(false);
                return;
            }

            try {
                // Fetch invitation details
                const { data, error: fetchError } = await supabase
                    .from('invitations')
                    .select('*, clinics:clinic_id(name)')
                    .eq('token', token)
                    .eq('status', 'pending')
                    .single();

                if (fetchError || !data) {
                    throw new Error('Davet bulunamadı veya süresi dolmuş.');
                }

                // Check if expired
                if (new Date(data.expires_at) < new Date()) {
                    throw new Error('Bu davetin süresi dolmuş. Lütfen yeni bir davet isteyin.');
                }

                setInviteData(data);
            } catch (err) {
                console.error('Invite fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Create the user account
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: inviteData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        invited_to_clinic: inviteData.clinic_id,
                        invited_role: inviteData.role
                    }
                }
            });

            if (signUpError) throw signUpError;

            // 2. Update invitation status
            await supabase
                .from('invitations')
                .update({ status: 'accepted' })
                .eq('id', inviteData.id);

            // 3. Update profile with clinic_id and role
            if (authData.user) {
                await supabase
                    .from('profiles')
                    .update({
                        clinic_id: inviteData.clinic_id,
                        role: inviteData.role,
                        full_name: formData.fullName
                    })
                    .eq('id', authData.user.id);
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Accept invite error:', err);
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Spinner size="xl" />
                    <p className="mt-4 text-slate-600 font-medium">Davet kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid token)
    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-red-600">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Geçersiz Davet</h1>
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

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-green-600">celebration</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Hoş Geldiniz!</h1>
                    <p className="text-slate-600 mb-6">
                        Hesabınız oluşturuldu ve <strong>{inviteData.clinics?.name}</strong> ekibine katıldınız.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Spinner size="sm" />
                        <span>Giriş sayfasına yönlendiriliyorsunuz...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Registration form
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl text-primary">group_add</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Ekibe Katıl</h1>
                    <p className="text-slate-600">
                        <strong>{inviteData.clinics?.name}</strong> ekibine katılmak için hesabınızı oluşturun.
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                        E-posta: <strong>{inviteData.email}</strong>
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">person</span>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="Adınız Soyadınız"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Şifre</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-xl">lock</span>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="Şifreyi tekrar girin"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Spinner size="md" color="white" />
                                <span>Hesap Oluşturuluyor...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">how_to_reg</span>
                                <span>Ekibe Katıl</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
