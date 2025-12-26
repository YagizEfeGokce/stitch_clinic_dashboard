export default function Gallery() {
    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Gallery</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-slate-200 rounded-2xl border-2 border-slate-100 relative group overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                            <span className="material-symbols-outlined text-white">visibility</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
