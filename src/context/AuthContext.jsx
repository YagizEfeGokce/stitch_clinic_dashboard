import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

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

    const refreshUserData = async (userId) => {
        try {
            // Fetch Profile AND Clinic in one go using the foreign key relation
            const { data, error } = await supabase
                .from('profiles')
                .select('*, clinics(*)')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
                setRole(data.role);
                // Set clinic from the joined data. 
                // Note: 'clinics' will be an object if relation is 1:1 or N:1, or array if 1:N.
                // Based on schema: profiles.clinic_id -> clinics.id (Many to One).
                // So Supabase returns it as an object (single) or null.
                if (data.clinics) {
                    setClinic(data.clinics);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout mechanism: Force app to load if Auth takes > 16s
        const timeoutId = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('Auth init timed out, forcing load.');
                setLoading(false);
            }
        }, 16000);

        const initAuth = async () => {
            try {
                // Timeout to prevent infinite hang
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth getSession 5s timeout')), 5000)
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
        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // console.log('Auth State Change:', event);

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

    const withTimeout = (promise, ms = 30000) => {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
        );
        return Promise.race([promise, timeout]);
    };

    const signIn = async (email, password) => {
        return await withTimeout(supabase.auth.signInWithPassword({ email, password }));
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    const signUp = async (email, password, fullName) => {
        const result = await withTimeout(supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName } // saved to metadata
            }
        }));

        // We rely on the DB trigger 'on_auth_user_created' to create the profile and clinic.
        // No manual upsert needed here.

        return result;
    };

    return (
        <AuthContext.Provider value={{ user, role, profile, clinic, setClinic, signIn, signOut, signUp, loading, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}
