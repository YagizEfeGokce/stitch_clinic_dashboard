import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRef, useEffect } from 'react';
import { X } from 'lucide-react'; // Using Lucide as requested for close icon (optional, but requested)

export default function Sidebar({ isOpen, onClose }) {
    const { role, clinic, profile, user } = useAuth();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);

    // Close on outside click (mobile)
    useEffect(() => {
        function handleClickOutside(event) {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose && onClose();
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const getLinkClass = ({ isActive }) =>
        isActive
            ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-colors"
            : "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold transition-colors";

    const rawRole = role || user?.user_metadata?.role || user?.app_metadata?.role;
    const isAdminOrDoctor = rawRole
        ? ['admin', 'doctor', 'owner'].some(r => String(rawRole).toLowerCase().includes(r))
        : false;

    // Mobile Overlay
    const Overlay = () => (
        <div
            className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
    );

    return (
        <>
            <Overlay />
            <aside
                ref={sidebarRef}
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 h-screen transition-transform duration-300 ease-in-out
                    md:static md:translate-x-0 md:flex md:flex-col
                    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {clinic?.branding_config?.logo_url ? (
                                <div className="size-10 rounded-full overflow-hidden shadow-sm border border-slate-100 bg-white shrink-0">
                                    <img src={clinic.branding_config.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="size-10 rounded-full overflow-hidden shadow-sm border border-slate-100 bg-white shrink-0">
                                    <img src="/logo.png" alt="Dermdesk Logo" className="w-full h-full object-contain p-1" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none truncate">{clinic?.name || 'Dermdesk'}</h1>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Panel</span>
                            </div>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="h-px bg-slate-100 w-full my-4"></div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                        <div onClick={onClose} className="flex flex-col gap-2">
                            {isAdminOrDoctor && (
                                <NavLink to="/overview" end className={getLinkClass}>
                                    <span className="material-symbols-outlined">dashboard</span>
                                    Panel
                                </NavLink>
                            )}

                            <NavLink to="/schedule" className={getLinkClass}>
                                <span className="material-symbols-outlined">calendar_month</span>
                                Takvim
                            </NavLink>

                            <NavLink to="/clients" className={getLinkClass}>
                                <span className="material-symbols-outlined">group</span>
                                Müşteriler
                            </NavLink>

                            <NavLink to="/inventory" className={getLinkClass}>
                                <span className="material-symbols-outlined">inventory_2</span>
                                Envanter
                            </NavLink>

                            {isAdminOrDoctor && (
                                <>
                                    <NavLink to="/services" className={getLinkClass}>
                                        <span className="material-symbols-outlined">medical_services</span>
                                        Hizmetler
                                    </NavLink>

                                    <div className="my-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mt-6">YÖNETİM</div>
                                    <NavLink to="/finance" className={getLinkClass}>
                                        <span className="material-symbols-outlined">payments</span>
                                        Finans
                                    </NavLink>
                                    <NavLink to="/performance" className={getLinkClass}>
                                        <span className="material-symbols-outlined">monitoring</span>
                                        Performans
                                    </NavLink>
                                </>
                            )}

                            <div className="my-2 border-t border-slate-100"></div>

                            {isAdminOrDoctor && (
                                <NavLink to="/settings" className={getLinkClass}>
                                    <span className="material-symbols-outlined">settings</span>
                                    Ayarlar
                                </NavLink>
                            )}
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-slate-100 mt-auto bg-white">
                        <button
                            onClick={() => {
                                onClose && onClose();
                                navigate('/settings');
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors w-full text-left group"
                        >
                            <div className="size-10 rounded-full bg-slate-200 bg-cover bg-center shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundImage: `url("${profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (profile?.full_name || 'User') + '&background=random'}")` }}></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                    {profile?.full_name || user?.email?.split('@')[0] || 'Personel'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">Profili Gör</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
