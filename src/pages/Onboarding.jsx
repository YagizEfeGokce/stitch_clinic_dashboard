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
        // Redirect if already onboarded
        if (!authLoading && profile?.has_completed_onboarding) {
            navigate('/schedule', { replace: true });
        }
    }, [profile, authLoading, navigate]);

    useEffect(() => {
        // Fetch user's existing name to greet them
        const loadUserName = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (data?.full_name) {
                setExistingName(data.full_name);
            }
        };
        loadUserName();
    }, [user]);

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

            // 4. Force refresh of context data to update Sidebar immediately
            await refreshUserData(user.id);

            // Navigate implies success
            navigate('/schedule');
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
                        Welcome, {existingName || 'Doctor'}
                    </h1>
                    <p className="text-center text-slate-500 mb-8">Let's set up your clinic workspace.</p>

                    <form onSubmit={handleComplete} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-1.5">Clinic Name</label>
                            <input
                                type="text"
                                required
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="e.g. Aura Aesthetics"
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Setting up...' : 'Get Started'}
                            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
