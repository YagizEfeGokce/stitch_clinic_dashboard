import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TIMEOUTS } from '../utils/constants';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);
    const loadingRef = useRef(true);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const refreshUserData = async (userId, retries = 3) => {
        try {
            // Fetch Profile AND Clinic
            const { data, error } = await supabase
                .from('profiles')
                .select('id, role, full_name, avatar_url, clinic_id, clinics(id, name, branding_config, settings_config, subscription_tier, subscription_status, trial_ends_at)')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
                setRole(data.role);
                if (data.clinics) {
                    setClinic(data.clinics);
                }
            } else if (retries > 0) {
                // If no profile found (race condition with trigger), retry
                console.log(`Profile not found, retrying... (${retries})`);
                setTimeout(() => refreshUserData(userId, retries - 1), 1000);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        if (!supabase) return; // Skip if no client

        let mounted = true;

        // Safety timeout mechanism: Force app to load if Auth takes > 16s
        const timeoutId = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('Auth init timed out, forcing load.');
                setLoading(false);
            }
        }, TIMEOUTS.AUTH_FAILSAFE);

        const initAuth = async () => {
            try {
                // Timeout to prevent infinite hang
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth getSession 5s timeout')), TIMEOUTS.AUTH_INIT)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                        await refreshUserData(session.user.id).catch(e => console.error('Data fetch error:', e));
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.warn('Auth initialization skipped or timed out:', error.message);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await refreshUserData(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                setProfile(null);
                setClinic(null);
            } else if (event === 'TOKEN_REFRESHED') {
                // Just update the user session, do NOT re-fetch profile/clinic data
                // This prevents "flicker" or "re-fetch" on window focus/tab switch when token auto-refreshes
                if (session?.user) {
                    setUser(session.user);
                }
            }

            // Ensure loading is false on any auth change
            setLoading(false);
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
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
        // No manual upsert needed here.

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

    // ... (rest of methods)

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
        <AuthContext.Provider value={{ user, role, profile, clinic, setClinic, signIn, signOut, signUp, loading, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}
