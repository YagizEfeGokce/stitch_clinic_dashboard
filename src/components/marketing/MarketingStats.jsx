export default function MarketingStats() {
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {/* Stat Card 1 */}
            <div className="snap-center shrink-0 min-w-[200px] flex-1 flex flex-col gap-1 rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                    <p className="text-slate-500 text-sm font-medium">Total ROI</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">245%</p>
                <p className="text-primary text-xs font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 12% vs last month
                </p>
            </div>
            {/* Stat Card 2 */}
            <div className="snap-center shrink-0 min-w-[200px] flex-1 flex flex-col gap-1 rounded-2xl p-5 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-purple-500 text-[20px]">campaign</span>
                    <p className="text-slate-500 text-sm font-medium">Active</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">3</p>
                <p className="text-slate-500 text-xs font-medium mt-1">Campaigns running</p>
            </div>
            {/* Stat Card 3 */}
            <div className="snap-center shrink-0 min-w-[200px] flex-1 flex flex-col gap-1 rounded-2xl p-5 bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-slate-900 text-[20px]">payments</span>
                    <p className="text-slate-500 text-sm font-medium">Spend</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">$4.2k</p>
                <p className="text-slate-500 text-xs font-medium mt-1">Total this month</p>
            </div>
        </div>
    );
}
