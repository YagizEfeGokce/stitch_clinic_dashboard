import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [clinic, setClinic] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUserData = async (userId) => {
        try {
            // Safety timeout: Don't block auth for more than 4s trying to get profile
            const fetchPromise = Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
                supabase.from('clinic_settings').select('*').limit(1).maybeSingle()
            ]);

            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([{ data: null }, { data: null }]), 1500));

            const [profileRes, clinicRes] = await Promise.race([fetchPromise, timeoutPromise]);

            if (profileRes?.data) {
                setProfile(profileRes.data);
                setRole(profileRes.data.role);
            }
            if (clinicRes?.data) setClinic(clinicRes.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout mechanism: Force app to load if Auth takes > 2.5s
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth init timed out, forcing load.');
                setLoading(false);
            }
        }, 2500);

        const initAuth = async () => {

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    setUser(session?.user ?? null);

                    // CRITICAL: Unblock UI immediately, don't wait for role
                    setLoading(false);

                    if (session?.user) {
                        // Fetch data in background
                        refreshUserData(session.user.id).catch(e => console.error('Data fetch error:', e));
                    }
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setUser(session?.user ?? null);
            if (session?.user) {
                await refreshUserData(session.user.id);
            } else {
                setRole(null);
                setProfile(null);
                setClinic(null);
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

    const signUp = async (email, password, fullName) => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName } // saved to metadata
            }
        });

        if (result.data?.user && !result.error) {
            // Attempt to ensure profile exists, but don't block if trigger handles it
            await supabase.from('profiles').upsert([
                { id: result.data.user.id, email: email, full_name: fullName, role: 'staff' }
            ], { onConflict: 'id', ignoreDuplicates: true });
        }

        return result;
    };

    return (
        <AuthContext.Provider value={{ user, role, profile, clinic, setClinic, signIn, signOut, signUp, loading, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}
