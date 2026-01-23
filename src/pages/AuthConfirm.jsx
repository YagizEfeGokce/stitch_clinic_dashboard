import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { handleInvitationAccepted } from '../services/betaUserService';
import { Spinner } from '../components/ui/Spinner';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * AuthConfirm Page
 * Handles Supabase invitation token verification and password creation
 * This is where users land after clicking the invitation link in their email
 */
export default function AuthConfirm() {
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleInvitationToken = async () => {
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type');

            // Check if this is an invitation link
            if (type !== 'invite' || !tokenHash) {
                setError('Geçersiz davet linki. Lütfen email\'inizdeki linki kullanın.');
                setLoading(false);
                return;
            }

            try {
                // Verify the invitation token
                const { data, error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'invite'
                });

                if (verifyError) {
                    console.error('Token verification error:', verifyError);
                    setError('Davet linki geçersiz veya süresi dolmuş.');
                    setLoading(false);
                    return;
                }

                // Extract invitation metadata
                const metadata = data.user?.user_metadata || {};
                setInvitationData({
                    email: data.user?.email,
                    clinicName: metadata.clinic_name,
                    ownerName: metadata.owner_name,
                    waitlistId: metadata.beta_waitlist_id
                });

                // Pre-fill name if available
                if (metadata.owner_name) {
                    setFullName(metadata.owner_name);
                }

                setLoading(false);
            } catch (err) {
                console.error('Invitation handling error:', err);
                setError('Davet işlenirken bir hata oluştu.');
                setLoading(false);
            }
        };

        handleInvitationToken();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (!fullName || fullName.trim().length < 2) {
            setError('Lütfen geçerli bir ad soyad girin.');
            return;
        }

        setSubmitting(true);

        try {
            // Get current session (user is already created by verifyOtp)
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Oturum bulunamadı');
            }

            // Update user password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
                data: {
                    full_name: fullName
                }
            });

            if (updateError) {
                throw updateError;
            }

            // Handle invitation acceptance (add to beta_users table)
            // Note: This is also handled by database trigger, but we call it explicitly for safety
            await handleInvitationAccepted(
                session.user.id,
                session.user.email,
                invitationData?.waitlistId
            );

            setSuccess(true);

            // Redirect to onboarding after success
            setTimeout(() => {
                navigate('/onboarding');
            }, 2000);

        } catch (err) {
            console.error('Password setup error:', err);
            setError(err.message || 'Hesap oluşturulurken bir hata oluştu.');
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Spinner size="xl" />
                    <p className="mt-4 text-slate-600 font-medium">Davet doğrulanıyor...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid token)
    if (error && !invitationData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Geçersiz Davet</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                    >
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
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Hoş Geldiniz! 🎉</h1>
                    <p className="text-slate-600 mb-6">
                        Hesabınız başarıyla oluşturuldu. Beta programına katıldınız!
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Spinner size="sm" />
                        <span>Yönlendiriliyorsunuz...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Password setup form
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <img
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop"
                    alt="Clinic Aesthetics"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-12">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 backdrop-blur-md text-green-400 mb-6 border border-green-500/30">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4">
                            Beta Programa <span className="text-teal-300">Hoş Geldiniz!</span>
                        </h1>
                        <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                            {invitationData?.clinicName || 'Kliniğiniz'} için Dermdesk hesabınızı oluşturun.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-slate-50/30">
                <div className="max-w-md w-full bg-white lg:bg-transparent lg:shadow-none rounded-3xl lg:rounded-none p-8 lg:p-0 shadow-2xl lg:shadow-none border lg:border-none border-slate-100">
                    <div className="text-center lg:text-left mb-10">
                        <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 mb-6">
                            <CheckCircle className="w-7 h-7" />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Hesabınızı Oluşturun
                        </h2>
                        <p className="text-slate-500 font-medium mt-2">
                            Şifrenizi belirleyin ve hemen başlayın
                        </p>
                    </div>

                    {/* Invitation Info Badge */}
                    <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-teal-600">business</span>
                            </div>
                            <div>
                                <p className="font-semibold text-teal-900 text-sm">
                                    {invitationData?.clinicName || 'Beta Programı'}
                                </p>
                                <p className="text-xs text-teal-600">{invitationData?.email}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Ad Soyad</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">person</span>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                                    placeholder="Dr. Ahmet Yılmaz"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">E-posta</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">mail</span>
                                <input
                                    type="email"
                                    value={invitationData?.email || ''}
                                    disabled
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 ml-1">Davet edilen email adresi</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Şifre</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 ml-1">En az 6 karakter</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Şifre Tekrar</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">lock</span>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-teal-600 text-white font-bold text-lg shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:shadow-2xl hover:shadow-teal-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {submitting ? (
                                <>
                                    <Spinner size="md" color="white" />
                                    <span>Hesap Oluşturuluyor...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Hesabı Oluştur ve Başla</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
