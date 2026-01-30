import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { completeOnboarding } from '../services/seedSampleData';

export default function Onboarding() {
    const { user, profile, loading: authLoading, refreshUserData } = useAuth();
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || authLoading) return;

        if (profile?.has_completed_onboarding) {
            navigate('/schedule', { replace: true });
            return;
        }
    }, [user, profile, authLoading, navigate]);

    const handleComplete = async (withSampleData) => {
        if (!user || !profile?.clinic_id) {
            error('Kullanıcı veya klinik bilgisi bulunamadı');
            return;
        }

        setLoading(true);

        try {
            await completeOnboarding(user.id, withSampleData, profile.clinic_id);

            await refreshUserData(user.id);

            if (withSampleData) {
                success('Sistem hazır! Hadi başlayalım 🎉');
            }

            window.location.href = '/schedule';
        } catch (err) {
            console.error('[Onboarding Error]', err);
            if (withSampleData) {
                error('Örnek veriler yüklenirken hata oluştu. Lütfen tekrar deneyin.');
            } else {
                error('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (profile?.has_completed_onboarding) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            <OnboardingModal
                onComplete={handleComplete}
                loading={loading}
            />
        </div>
    );
}
