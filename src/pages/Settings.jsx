import { useState, useEffect } from 'react';
import BrandingSettings from '../components/settings/BrandingSettings';
import StaffList from '../components/settings/StaffList';
import ProfileEditModal from '../components/settings/ProfileEditModal';
import DataManagementSettings from '../components/settings/DataManagementSettings';

import ActivityLogs from '../components/settings/ActivityLogs';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState(''); // Init verify later
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Password Update State
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);

    // Role State
    const [role, setRole] = useState(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
                setRole(data.role);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tabs based on role
    const tabs = role === 'staff'
        ? ['Security']
        : ['General', 'Team', 'Data', 'Logs', 'Security'];

    // Ensure activeTab is valid
    useEffect(() => {
        if (role && !activeTab) {
            setActiveTab(tabs[0]);
        }
        // If current tab is not allowed for this role, switch to first allowed
        if (role && activeTab && !tabs.includes(activeTab)) {
            setActiveTab(tabs[0]);
        }
    }, [role, activeTab, tabs]);


    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("Passwords don't match");
            return;
        }
        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setPassLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            toast.success("Password updated successfully");
            setPasswords({ new: '', confirm: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error("Failed to update password");
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center bg-background-light/95 backdrop-blur-sm p-4 pb-2 justify-between border-b border-slate-100 transition-colors duration-300">
                <div className="w-10"></div> {/* Spacer for alignment */}
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">Settings</h2>
                <div className="w-10"></div>
            </header>

            {/* Profile Summary */}
            <div className="px-4 pt-6 pb-2">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 transition-colors duration-300">
                    <div className="relative">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-16 w-16 border-2 border-primary p-0.5 bg-slate-200" style={{ backgroundImage: `url("${profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User') + '&background=random'}")` }}>
                        </div>
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                        <p className="text-slate-900 text-lg font-bold leading-tight">{profile?.full_name || 'Dr. User'}</p>
                        <p className="text-primary text-sm font-medium leading-normal capitalize">{profile?.role?.replace('_', ' ') || 'Medical Director'}</p>
                        <p className="text-slate-500 text-xs mt-1">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-slate-400 hover:text-primary transition-colors p-2"
                    >
                        <span className="material-symbols-outlined">edit_square</span>
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-[60px] z-20 bg-background-light px-4 py-3 transition-colors duration-300 overflow-x-auto no-scrollbar">
                <div className="flex h-12 min-w-max items-center rounded-xl bg-slate-100 p-1 shadow-inner">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`group flex cursor-pointer h-full px-4 items-center justify-center rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                        >
                            <span className={`text-sm font-bold leading-normal whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-slate-500'
                                }`}>{tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 px-4 space-y-6">
                {activeTab === 'Team' && (
                    <>
                        <div className="relative">
                            <div className="flex w-full items-center rounded-xl bg-white shadow-sm border border-slate-100 h-12 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <div className="flex items-center justify-center pl-4 text-primary">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </div>
                                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 px-3 text-base focus:ring-0 h-full" placeholder="Search staff members..." />
                            </div>
                        </div>
                        <StaffList searchTerm={searchTerm} />
                    </>
                )}
                {activeTab === 'General' && <BrandingSettings />}

                {activeTab === 'Data' && <DataManagementSettings />}
                {activeTab === 'Logs' && <ActivityLogs />}

                {activeTab === 'Security' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
                            <h3 className="text-slate-900 text-lg font-bold leading-tight">Change Password</h3>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={passLoading}
                                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {passLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-red-50 rounded-xl border border-red-100 p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-red-900 text-lg font-bold leading-tight">Sign Out</h3>
                                <p className="text-red-600/80 text-sm mt-1">End your current session.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    // Window reload handled by AuthContext or just let standard redirect happen?
                                    // AuthContext usually updates state, triggering redirect in App.jsx
                                }}
                                className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl shadow-sm hover:bg-red-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <ProfileEditModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={profile}
                onSuccess={fetchProfile}
            />
        </div>
    );
}
