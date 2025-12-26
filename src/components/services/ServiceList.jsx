export default function ServiceList({ services, onEdit, onDelete }) {
    if (services.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm border-dashed">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                    <span className="material-symbols-outlined text-3xl">medical_services</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Services Found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Add your first treatment to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
                <div
                    key={service.id}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {service.name}
                        </h3>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(service)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                                onClick={() => onDelete(service.id)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                        {service.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span className="text-sm font-semibold">{service.duration_min} min</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                            ${service.price}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
