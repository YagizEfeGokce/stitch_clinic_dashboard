export default function StaffPerformance({ staffData = [] }) {


    return (
        <section>
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-slate-900 text-lg font-bold">Staff Availability</h2>
                <button className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors">See All</button>
            </div>
            <div className="flex flex-col gap-3">
                {staffData.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-sm">No staff performance data available</div>
                ) : (
                    staffData.map((member) => (
                        <div key={member.id} className="flex items-center bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary/20 transition-all">
                            <div className="bg-cover bg-center rounded-full size-12 mr-4" style={{ backgroundImage: `url('${member.image}')` }}></div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{member.name}</h3>
                                <p className="text-xs text-slate-500">{member.role}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">{member.booked}%</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Booked</p>
                                </div>
                                <div className="relative size-10">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${member.booked}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
