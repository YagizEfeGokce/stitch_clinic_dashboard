import { NavLink } from 'react-router-dom';

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 pt-2">
            <div className="grid grid-cols-5 h-16 items-center justify-items-center px-2">
                <NavItem to="/schedule" icon="calendar_month" label="Schedule" />
                <NavItem to="/marketing" icon="campaign" label="Marketing" />
                <NavItem to="/inventory" icon="inventory_2" label="Stock" />
                <NavItem to="/finance" icon="payments" label="Finance" />
                <NavItem to="/settings" icon="settings" label="Settings" />
            </div>
            <div className="h-5 w-full"></div>
        </nav>
    );
}

function NavItem({ to, icon, label }) {
    return (
        <NavLink to={to} className="flex flex-col items-center gap-1 w-full h-full justify-center group no-underline">
            {({ isActive }) => (
                <>
                    <div className={`relative p - 1.5 rounded - xl transition - colors ${isActive ? 'bg-primary/10 text-primary' : 'group-hover:bg-slate-50 text-slate-400 group-hover:text-slate-600'} `}>
                        <span className={`material - symbols - outlined ${isActive ? 'fill-current' : ''} `}>{icon}</span>
                    </div>
                    <span className={`text - [10px] ${isActive ? 'font-bold text-primary' : 'font-semibold text-slate-400 group-hover:text-slate-600'} `}>
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );
}
