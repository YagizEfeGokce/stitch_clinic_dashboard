import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TIMEOUTS } from '../utils/constants';
import { setSentryUser, clearSentryUser, setContext } from '../lib/sentry';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const loadingRef = useRef(true);
    // Track if this is the initial profile load (blocks UI) vs background refresh (silent)
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const refreshUserData = async (userId, retries = 3) => {
        // Only block UI on initial load, not on background refreshes
        const isInitial = isInitialLoadRef.current;
        if (isInitial) {
            setProfileLoading(true);
        }

        try {
            // 1. Fetch Profile First (Simple query, less likely to fail)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                throw profileError;
            }

            if (profileData) {
                setProfile(profileData);
                setRole(profileData.role);

                // Set Sentry user context for better error tracking
                setSentryUser({
                    id: userId,
                    email: profileData.email || '',
                    full_name: profileData.full_name,
                });


                // 2. Fetch Clinic if we have a clinic_id
                if (profileData.clinic_id) {
                    const { data: clinicData, error: clinicError } = await supabase
                        .from('clinics')
                        .select('*')
                        .eq('id', profileData.clinic_id)
                        .maybeSingle();

                    if (!clinicError && clinicData) {
                        setClinic(clinicData);
                    } else if (clinicError) {
                        console.warn('Error fetching clinic:', clinicError);
                    }
                }

                // Mark initial load as complete - future refreshes won't block UI
                isInitialLoadRef.current = false;
            } else if (retries > 0) {
                // Retry logic if profile creation is lagging behind auth
                console.log(`Profile not found, retrying... (${retries})`);
                setTimeout(() => refreshUserData(userId, retries - 1), 1000);
            }
        } catch (error) {
            console.error('Fatal error in refreshUserData:', error);
        } finally {
            if (isInitial) {
                setProfileLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!supabase) return;

        let mounted = true;

        // Failsafe: If event doesn't fire in 3s, kill loading
        const failsafeTimer = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('Auth event ignored/delayed, forcing app load.');
                setLoading(false);
            }
        }, 3000);

        // Setup Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                setUser(session?.user ?? null);

                // Only fetch profile if we actually have a user and it's a relevant event
                if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                    refreshUserData(session.user.id).catch(e => console.warn('Profile sync warning:', e));
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                setProfile(null);
                setClinic(null);
                clearSentryUser(); // Clear Sentry user context on logout
            }

            // Always clear loading on the first meaningful event, cancelling the failsafe
            setLoading(false);
            clearTimeout(failsafeTimer);
        });

        return () => {
            mounted = false;
            clearTimeout(failsafeTimer);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    const signUp = async (email, password, fullName, planTier = 'pro') => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    plan_tier: planTier // 'free' or 'pro'
                }
            }
        });

        // We rely on the DB trigger 'on_auth_user_created' to create the profile and clinic.
        return result;
    };

    const [configError, setConfigError] = useState(false);

    useEffect(() => {
        if (!supabase) {
            setConfigError(true);
            setLoading(false);
            return;
        }

        loadingRef.current = loading;
    }, [loading]);

    if (configError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Configuration Missing</h2>
                    <p className="text-slate-600">
                        Please create a <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">.env</code> file in the project root with your Supabase credentials.
                    </p>
                    <div className="text-left bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto">
                        <pre>VITE_SUPABASE_URL=your_url</pre>
                        <pre>VITE_SUPABASE_ANON_KEY=your_key</pre>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, role, profile, clinic, setClinic, signIn, signOut, signUp, loading, profileLoading, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}
