import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
    const { user, profile, loading: authLoading, refreshUserData } = useAuth(); // Get profile and loading from AuthContext
    const navigate = useNavigate();

    const [clinicName, setClinicName] = useState('');
    const [existingName, setExistingName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            if (!user || authLoading) return;

            // 1. If already marked as onboarded, go to schedule
            if (profile?.has_completed_onboarding) {
                navigate('/schedule', { replace: true });
                return;
            }

            // 2. Fetch Clinic Details to see if we are an INVITED member or OWNER
            // If we are NOT the owner, or if the clinic is already named (not default), skip this step.
            try {
                const { data: clinicData, error } = await supabase
                    .from('clinics')
                    .select('name, id')
                    .eq('id', profile?.clinic_id)
                    .single();

                if (clinicData) {
                    const isDefaultName = clinicData.name === 'My New Clinic' || clinicData.name === 'My Clinic';
                    const isOwner = profile?.role === 'owner';

                    // If user is NOT owner, or clinic name is already set (not default)
                    // Then we skip the "Name your clinic" step and just mark onboarded.
                    if (!isOwner || !isDefaultName) {
                        setLoading(true);
                        await supabase
                            .from('profiles')
                            .update({ has_completed_onboarding: true })
                            .eq('id', user.id);

                        await refreshUserData(user.id);
                        navigate('/schedule', { replace: true });
                    }
                }
            } catch (err) {
                console.error("Onboarding check error:", err);
            }
        };

        checkStatus();
    }, [user, profile, authLoading, navigate, refreshUserData]);

    const handleComplete = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Get user's clinic_id first
            const { data: profileData, error: fetchError } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', user.id)
                .single();

            if (fetchError) throw fetchError;
            if (!profileData?.clinic_id) throw new Error('No clinic associated with this account.');

            // 2. Mark Profile as Onboarded (Name is already set during sign up)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    has_completed_onboarding: true
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Update Clinic Name
            const { error: clinicError } = await supabase
                .from('clinics')
                .update({
                    name: clinicName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profileData.clinic_id);

            if (clinicError) throw clinicError;

            // 4. Force refresh of context data
            await refreshUserData(user.id);

            // 5. Force a hard reload to ensure all application state (Context, RLS checks, etc.) 
            // is perfectly synced with the new clinic association. 
            // This prevents "clinic_id undefined" errors on first load.
            window.location.href = '/schedule';
        } catch (error) {
            console.error(error);
            alert('Failed to update profile: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                    <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 mx-auto">
                        <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
                        Hoş Geldiniz, {existingName || 'Doktor'}
                    </h1>
                    <p className="text-center text-slate-500 mb-8">Klinik çalışma alanınızı kuralım.</p>

                    <form onSubmit={handleComplete} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-1.5">Klinik Adı</label>
                            <input
                                type="text"
                                required
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="örn. Aura Estetik"
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Kuruluyor...' : 'Başlayın'}
                            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
