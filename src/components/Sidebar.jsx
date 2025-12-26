import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const { role, clinic, profile, user } = useAuth();
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const getLinkClass = ({ isActive }) =>
        isActive
            ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-colors"
            : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors";

    const rawRole = role || user?.user_metadata?.role || user?.app_metadata?.role;
    // If we have a role string, check it. If no role but user exists, assume admin for now (fallback).
    // This allows the current user to access if DB entry is missing, but will block 'staff' once assigned.
    const isAdminOrDoctor = rawRole
        ? ['admin', 'doctor', 'owner'].some(r => String(rawRole).toLowerCase().includes(r))
        : false; // Default to false (safe) instead of !!user (unsafe)

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-[24px]">local_hospital</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{clinic?.clinic_name || 'Stitch Clinic'}</h1>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dashboard</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto">
                    {isAdminOrDoctor && (
                        <NavLink to="/" end className={getLinkClass}>
                            <span className="material-symbols-outlined">dashboard</span>
                            Dashboard
                        </NavLink>
                    )}

                    <NavLink to="/schedule" className={getLinkClass}>
                        <span className="material-symbols-outlined">calendar_month</span>
                        Schedule
                    </NavLink>

                    <NavLink to="/clients" className={getLinkClass}>
                        <span className="material-symbols-outlined">group</span>
                        Clients
                    </NavLink>

                    <NavLink to="/inventory" className={getLinkClass}>
                        <span className="material-symbols-outlined">inventory_2</span>
                        Inventory
                    </NavLink>

                    {isAdminOrDoctor && (
                        <>
                            <NavLink to="/services" className={getLinkClass}>
                                <span className="material-symbols-outlined">medical_services</span>
                                Services
                            </NavLink>

                            <div className="my-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Business</div>
                            <NavLink to="/finance" className={getLinkClass}>
                                <span className="material-symbols-outlined">payments</span>
                                Finance
                            </NavLink>
                            <NavLink to="/performance" className={getLinkClass}>
                                <span className="material-symbols-outlined">monitoring</span>
                                Performance
                            </NavLink>
                        </>
                    )}

                    <div className="my-2 border-t border-slate-100"></div>

                    {isAdminOrDoctor && (
                        <NavLink to="/settings" className={getLinkClass}>
                            <span className="material-symbols-outlined">settings</span>
                            Settings
                        </NavLink>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors w-full text-left"
                    >
                        <div className="size-10 rounded-full bg-slate-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url("${profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User') + '&background=random'}")` }}></div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                                {profile?.full_name || user?.email?.split('@')[0] || 'Medical Staff'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">View Profile</p>
                        </div>
                    </button>
                </div>
            </div>
        </aside>
    );
}
