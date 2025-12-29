export default function StaffAvailability({ staffList, appointments }) {
    // Calculate Occupancy for each staff
    // Mock capacity: 40 hours/week * 4 = 160 hours/month standard

    // We'll calculate current month's booked hours
    const now = new Date();
    const currentMonthApts = appointments.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && a.status !== 'Cancelled';
    });

    const metrics = staffList.map(staff => {
        const staffApts = currentMonthApts.filter(a => a.staff_id === staff.id);
        const bookedMinutes = staffApts.reduce((sum, a) => sum + (a.services?.duration_min || 30), 0);
        const bookedHours = Math.round(bookedMinutes / 60);

        // Dynamic capacity mock: Assume 160 hours is 100%
        // But for visual variety, let's say capacity is 160.
        const capacity = 160;
        const percentage = Math.round((bookedHours / capacity) * 100);

        return {
            ...staff,
            bookedHours,
            percentage: Math.min(percentage, 100) // Cap at 100
        };
    }).sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Personel Müsaitliği</h3>
                <p className="text-xs text-slate-500">Bu ayın kaynak kullanımı</p>
            </div>

            <div className="space-y-5">
                {metrics.map(staff => (
                    <div key={staff.id}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm">
                                    {staff.avatar_url ? (
                                        <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-xs font-bold text-slate-500">
                                            {staff.full_name?.charAt(0) || 'P'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{staff.full_name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{staff.role || 'Personel'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold ${staff.percentage > 85 ? 'text-red-500' : 'text-slate-900'}`}>
                                    {staff.percentage}%
                                </span>
                                <p className="text-[10px] text-slate-400 font-medium">{staff.bookedHours}/160 sa</p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${staff.percentage > 85 ? 'bg-red-500' :
                                    staff.percentage > 50 ? 'bg-primary' :
                                        'bg-emerald-400'
                                    }`}
                                style={{ width: `${staff.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}

                {metrics.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <span className="material-symbols-outlined text-3xl mb-2 opacity-50">person_off</span>
                        <p className="text-sm">Personel metriği bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
}
