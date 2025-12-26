export default function KPICard({ title, amount, percentage, period = "vs last month", icon, color = "primary" }) {
    const colorClasses = {
        primary: "text-primary bg-primary/10",
        blue: "text-blue-600 bg-blue-100",
        purple: "text-purple-600 bg-purple-100",
    };

    const iconColor = colorClasses[color] || colorClasses.primary;

    return (
        <div className="p-5 bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col gap-3 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <span className={`material-symbols-outlined text-[48px] ${color === 'primary' ? 'text-primary' : `text-${color}-500`}`}>{icon}</span>
            </div>

            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                    <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </div>
                <span className="text-sm font-medium text-slate-500">{title}</span>
            </div>

            <div>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">{amount}</h3>
            </div>

            <div className="flex items-center gap-1.5 mt-auto">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                </span>
                <span className="text-sm font-semibold text-emerald-600">{percentage}</span>
                <span className="text-xs text-slate-500 ml-1">{period}</span>
            </div>
        </div>
    );
}
