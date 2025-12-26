export default function CampaignEffectiveness() {
    return (
        <section className="bg-gradient-to-br from-secondary to-white rounded-3xl p-6 shadow-sm border border-primary/10">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[24px]">campaign</span>
                </div>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide">Active</span>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-1">Botox Summer Campaign</h3>
            <p className="text-slate-500 text-sm mb-4">High engagement across social channels</p>
            <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-bold text-slate-900">24%</p>
                <p className="text-sm font-medium text-slate-500 mb-1">Conversion Rate</p>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-slate-100">
                <div className="bg-primary h-2 rounded-full" style={{ width: '24%' }}></div>
            </div>
        </section>
    );
}
