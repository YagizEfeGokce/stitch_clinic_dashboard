export default function FormatSelector({ format, onFormatChange }) {

    return (
        <section className="px-6 py-6 pb-24">
            <h2 className="text-[22px] font-bold text-slate-900 mb-4">Format</h2>
            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => onFormatChange('pdf')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'pdf'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30 hover:text-slate-600'
                        }`}
                >
                    <span className="material-symbols-outlined text-3xl mb-2">picture_as_pdf</span>
                    <span className="text-sm font-bold">PDF</span>
                </button>
                <button
                    onClick={() => onFormatChange('csv')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'csv'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30 hover:text-slate-600'
                        }`}
                >
                    <span className="material-symbols-outlined text-3xl mb-2">csv</span>
                    <span className="text-sm font-bold">CSV</span>
                </button>
                <button
                    onClick={() => onFormatChange('excel')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${format === 'excel'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-primary/30 hover:text-slate-600'
                        }`}
                >
                    <span className="material-symbols-outlined text-3xl mb-2">table_view</span>
                    <span className="text-sm font-bold">Excel</span>
                </button>
            </div>
        </section>
    );
}
