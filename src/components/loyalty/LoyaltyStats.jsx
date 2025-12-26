export default function LoyaltyStats() {
    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col gap-1 rounded-2xl p-4 bg-white shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-[20px]">group</span>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Members</p>
                </div>
                <p className="text-slate-900 text-2xl font-bold leading-tight">1,240</p>
                <p className="text-green-600 text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                </p>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl p-4 bg-white shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-[20px]">loyalty</span>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Redeemed</p>
                </div>
                <p className="text-slate-900 text-2xl font-bold leading-tight">45k <span className="text-sm font-medium text-slate-400">pts</span></p>
                <p className="text-green-600 text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +5%
                </p>
            </div>

            {/* Full width stat */}
            <div className="col-span-2 flex items-center justify-between rounded-2xl p-4 bg-primary/5 border border-primary/20">
                <div className="flex flex-col">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg. Client Spend</p>
                    <p className="text-primary text-2xl font-bold leading-tight mt-1">$850.00</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-primary">payments</span>
                </div>
            </div>
        </div>
    );
}
