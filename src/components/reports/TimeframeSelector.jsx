export default function TimeframeSelector({ range, onRangeChange }) {

    return (
        <section className="mt-4 flex flex-col gap-4">
            <div className="px-6 flex items-center justify-between">
                <h2 className="text-[22px] font-bold text-slate-900 leading-tight">Timeframe</h2>
                <button
                    onClick={() => onRangeChange('30days')}
                    className="text-rose-400 text-sm font-bold hover:text-primary transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Presets */}
            <div className="flex px-6 gap-3 overflow-x-auto no-scrollbar pb-2">
                {[
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'month', label: 'This Month' },
                    { id: 'custom', label: 'Custom' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onRangeChange(item.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${range === item.id
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Date Inputs - Mocked for visual for now, but good to have */}
            <div className="mx-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">From</label>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
                            <span className="text-sm font-bold text-slate-700">Sept 5, 2023</span>
                        </div>
                    </div>
                    <div className="text-slate-300 mt-6">
                        <span className="material-symbols-outlined">arrow_right_alt</span>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">To</label>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="material-symbols-outlined text-slate-400 text-lg">event</span>
                            <span className="text-sm font-bold text-slate-700">Sept 30, 2023</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters - Visual Only for now */}
            <div className="px-6 space-y-3 mt-2">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Filters</h3>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">stethoscope</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Staff Member</p>
                            <p className="text-sm font-bold text-slate-900">All Practitioners</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">location_on</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Location</p>
                            <p className="text-sm font-bold text-slate-900">Beverly Hills Main</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </div>
            </div>
        </section>
    );
}
