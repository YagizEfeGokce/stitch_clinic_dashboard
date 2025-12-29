export default function TimelineItem({
    time,
    ampm,
    patientName,
    treatment,
    status = 'future',
    image,
    isActive = false,
    duration, // New prop
    notes,    // New prop
    onClick // Added missing prop
}) {
    const isPast = status === 'past';

    return (
        <div
            onClick={onClick}
            className={`flex gap-8 cursor-pointer ${isPast ? 'opacity-60 grayscale-[50%]' : ''}`}
        >
            <div className="flex flex-col items-end min-w-[5rem] shrink-0 pt-3 gap-1 text-right">
                <span className={`text-sm font-bold leading-none ${isActive ? 'text-primary' : 'text-slate-800'}`}>{time}</span>
                <span className={`text-xs font-medium leading-none ${isActive ? 'text-primary/70' : 'text-slate-400'}`}>{ampm}</span>
            </div>

            <div className="relative flex-1 group">
                {/* Connector Line */}
                <div className={`absolute -left-[23px] top-4 w-3 h-3 rounded-full z-10
          ${isActive
                        ? 'bg-primary ring-4 ring-primary/20'
                        : 'bg-slate-300 ring-4 ring-background-light'}`}
                ></div>
                <div className="absolute -left-[18px] top-7 w-[2px] h-full bg-slate-200 -z-0"></div>

                {/* Card */}
                <div className={`
          flex flex-col p-4 bg-white rounded-[20px] border shadow-card transition-all duration-300
          ${isActive
                        ? 'p-5 rounded-[24px] shadow-float border-l-4 border-l-primary relative overflow-hidden border-t-white border-r-white border-b-white'
                        : 'border-slate-100 opacity-90'}
        `}>
                    {isActive && (
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                    )}

                    <div className="flex items-start justify-between z-10 w-full">
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div
                                className={`rounded-full bg-slate-100 bg-cover bg-center shrink-0 ${isActive ? 'size-14 ring-2 ring-white shadow-sm' : 'size-12'}`}
                                style={{ backgroundImage: `url("${image}")` }}
                            ></div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`${isActive ? 'text-lg' : 'text-base'} font-bold text-slate-900 truncate`}>{patientName}</h3>

                                {isActive ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="px-2 py-0.5 rounded-md bg-accent/20 text-xs font-bold text-rose-900 tracking-wide uppercase">VIP</span>
                                        <span className="text-sm text-slate-500">First Consultation</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-slate-500 truncate">{treatment}</p>
                                        {/* Added Duration and Notes for inactive state as requested */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                            {duration && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {duration} min</span>}
                                            {notes && <span className="flex items-center gap-1 max-w-[150px] truncate" title={notes}><span className="material-symbols-outlined text-[14px]">sticky_note_2</span> {notes}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Trailing Icon/Button */}
                            {!isActive && status === 'completed' && (
                                <div className="flex items-center justify-center size-8 rounded-full bg-green-50 text-green-600 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                </div>
                            )}
                            {!isActive && status !== 'completed' && (
                                <div className="flex items-center justify-center size-8 rounded-full bg-slate-100 text-slate-400 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                                </div>
                            )}
                            {isActive && (
                                <button className="text-slate-400 hover:text-primary transition-colors shrink-0">
                                    <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Card Extras */}
                    {isActive && (
                        <div className="flex flex-col gap-4 z-10 mt-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <span className="material-symbols-outlined text-primary text-[20px]">syringe</span>
                                    <span className="text-sm font-semibold">{treatment}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">schedule</span>
                                    <span className="text-sm">45 mins • Dr. Ray</span>
                                </div>
                            </div>

                            {/* Before/After Preview (Context) */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previous Treatment</span>
                                    <span className="text-xs font-medium text-primary cursor-pointer hover:underline">View Gallery</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 h-24">
                                    <div className="relative w-full h-full rounded-lg overflow-hidden group">
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/40 px-1.5 rounded backdrop-blur-sm">Before</span>
                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuApGVTDWk8aLKUagWYUFrIfM3MRQzW6OM-7TSsi5nqdz5YovnohNtWXzc8G5nDLuRhfEPAV_eF6zXwV9Dp7pGIS8Uztw3my0eLMJ-jNuTxqMgQWPa2z3rxE7R6svspYBKfxG9ybKOmW4J397rkOiQU9vdlcHitkAqmAiDpqggvBU6lV3daBbWOQ2hjso2JOnpMfNDQvDVTmkIrdqAmBmHGQonFyM7I0-LTNhbnrL5kGyYN6skdkU3Mh-EgXZ21Nl9s7aGuJZu06urfz")' }}></div>
                                    </div>
                                    <div className="relative w-full h-full rounded-lg overflow-hidden group">
                                        <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-primary/80 px-1.5 rounded backdrop-blur-sm z-10">After</span>
                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC9knjMXZmiUZw2Y33hDV4oeeElJjCSZ6voBpoyhA0J_Oqu4ecU2xfg4ezq0NeKqGiEXBkVa5zz_k_4G4hF-A_kAvQaJLUBl2uYBBwTJLNBRgMSTRfhZDMv-nRc3VzPXyFuJsR_3-SRfuFPDZzrRi1wl1JsevbJxE0EtZ3fkYQ2Z-89bC1otZWMdzzIBvZxtt4IrBFRrktrRBezZOYBfLR5WA4WLTStFqS7OowJJyTLlZMjXAxVXzgwmDFcB9ai_uk7MmoObNEpnlM3")' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-[1fr_auto] gap-3">
                                <button className="flex items-center justify-center gap-2 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                    Send Reminder
                                </button>
                                <button className="flex items-center justify-center size-12 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
