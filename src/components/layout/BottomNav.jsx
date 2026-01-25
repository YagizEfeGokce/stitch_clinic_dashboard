import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Settings } from 'lucide-react';

/**
 * Mobile Bottom Navigation Component
 * Only visible on screens < md (768px)
 * Provides quick access to main sections
 */
export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 md:hidden safe-area-bottom">
            <div className="grid grid-cols-4 h-16 items-center justify-items-center px-2">
                <NavItem to="/overview" icon={Home} label="Ana Sayfa" />
                <NavItem to="/schedule" icon={Calendar} label="Takvim" />
                <NavItem to="/clients" icon={Users} label="Müşteriler" />
                <NavItem to="/settings" icon={Settings} label="Ayarlar" />
            </div>
            {/* Safe area spacer for iOS home indicator */}
            <div className="h-safe-area-bottom bg-white/95" />
        </nav>
    );
}

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            className="flex flex-col items-center justify-center gap-1 w-full h-full min-h-[44px] min-w-[44px] group no-underline touch-manipulation"
        >
            {({ isActive }) => (
                <>
                    <div className={`relative p-1.5 rounded-xl transition-colors ${isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600 group-active:bg-slate-100'
                        }`}>
                        <Icon
                            size={22}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="transition-all"
                        />
                    </div>
                    <span className={`text-[10px] leading-tight ${isActive
                            ? 'font-bold text-primary'
                            : 'font-semibold text-slate-400 group-hover:text-slate-600'
                        }`}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );
}
