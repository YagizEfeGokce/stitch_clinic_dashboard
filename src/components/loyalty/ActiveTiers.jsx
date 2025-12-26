export default function ActiveTiers() {
    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-slate-900 text-lg font-bold">Active Tiers</h2>
                <button className="text-primary text-sm font-bold hover:underline">Edit Tiers</button>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-5 px-5 snap-x">
                {/* Silver Tier */}
                <div className="min-w-[280px] snap-center rounded-2xl bg-white p-4 shadow-md border-l-4 border-slate-300 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl">verified</span>
                    </div>
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Entry Level</p>
                                <h3 className="text-slate-900 text-xl font-bold mt-1">Silver</h3>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">0 - 1k pts</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">1 pt per $1 spent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">Birthday Treat</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gold Tier */}
                <div className="min-w-[280px] snap-center rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-white p-4 shadow-md border-l-4 border-[#FFD700] relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl text-yellow-600">verified</span>
                    </div>
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-yellow-600/70 text-xs font-bold uppercase tracking-widest">Popular</p>
                                <h3 className="text-slate-900 text-xl font-bold mt-1">Gold</h3>
                            </div>
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-md">1k - 5k pts</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-600 text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">1.5 pts per $1 spent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-600 text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">5% Off Products</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platinum Tier */}
                <div className="min-w-[280px] snap-center rounded-2xl bg-white p-4 shadow-md border-l-4 border-rose-300 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl text-rose-300">verified</span>
                    </div>
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-rose-300 text-xs font-bold uppercase tracking-widest">Premium</p>
                                <h3 className="text-slate-900 text-xl font-bold mt-1">Rose Gold</h3>
                            </div>
                            <span className="bg-rose-50 text-rose-400 text-xs font-bold px-2 py-1 rounded-md">5k+ pts</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-300 text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">2 pts per $1 spent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-300 text-sm">check_circle</span>
                                <span className="text-sm text-slate-600">Priority Booking</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
