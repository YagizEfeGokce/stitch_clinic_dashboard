import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [clinicName, setClinicName] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleComplete = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Update User Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    clinic_name: clinicName,
                    has_completed_onboarding: true
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update Global Clinic Settings
            // Fetch existing ID to avoid duplicates, or create new
            const { data: existingSettings } = await supabase
                .from('clinic_settings')
                .select('id')
                .limit(1)
                .maybeSingle();

            const { error: settingsError } = await supabase
                .from('clinic_settings')
                .upsert({
                    id: existingSettings?.id, // Update if exists, else insert (auto-gen ID)
                    clinic_name: clinicName,
                    // Set defaults if new
                    primary_color: existingSettings ? undefined : '#0F172A',
                    secondary_color: existingSettings ? undefined : '#F43F5E'
                });

            if (settingsError) console.warn("Settings update warning:", settingsError);

            if (profileError) throw profileError;
            // Navigate implies success
            navigate('/schedule');
        } catch (error) {
            console.error(error);
            alert('Failed to update profile. Please try again.');
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

                    <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Setup Your Clinic</h1>
                    <p className="text-center text-slate-500 mb-8">Let's personalize your workspace.</p>

                    <form onSubmit={handleComplete} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-1.5">Your Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Dr. Ray"
                                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold outline-none"
                            />
                        </div>

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
