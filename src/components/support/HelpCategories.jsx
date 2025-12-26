export default function HelpCategories() {
    return (
        <section className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Browse by Category</h3>
            <div className="grid grid-cols-2 gap-4">
                <button className="group rounded-2xl aspect-[4/3] bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all shadow-sm">
                    <div className="p-3.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[28px]">calendar_month</span>
                    </div>
                    <span className="font-bold text-sm text-slate-800 tracking-wide">Appointments</span>
                </button>
                <button className="group rounded-2xl aspect-[4/3] bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all shadow-sm">
                    <div className="p-3.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[28px]">clinical_notes</span>
                    </div>
                    <span className="font-bold text-sm text-slate-800 tracking-wide">Records</span>
                </button>
                <button className="group rounded-2xl aspect-[4/3] bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all shadow-sm">
                    <div className="p-3.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                    </div>
                    <span className="font-bold text-sm text-slate-800 tracking-wide">Billing</span>
                </button>
                <button className="group rounded-2xl aspect-[4/3] bg-white border border-slate-100 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-all shadow-sm">
                    <div className="p-3.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                    </div>
                    <span className="font-bold text-sm text-slate-800 tracking-wide">Inventory</span>
                </button>
            </div>
        </section>
    );
}
