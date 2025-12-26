import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // Only for Sign Up
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error) throw error;

                navigate('/onboarding');
            } else {
                // Login
                const { data, error } = await signIn(email, password);
                if (error) throw error;

                // Check role for redirect
                if (data?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();

                    if (profile?.role === 'staff') {
                        navigate('/schedule');
                    } else {
                        navigate('/schedule');
                    }
                } else {
                    navigate('/schedule');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Authentication failed.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                        <span className="material-symbols-outlined text-3xl">spa</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="text-slate-500 mt-2">{isSignUp ? 'Join Stitch Clinic CRM today' : 'Sign in to your dashboard'}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-slate-900"
                                placeholder="Dr. Sarah Smith"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-slate-900"
                            placeholder="doctor@stitchclinic.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-slate-900"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>}
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                    </button>
                </div>
            </div>
        </div>
    );
}
