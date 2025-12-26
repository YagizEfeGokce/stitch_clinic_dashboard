import { useMemo } from 'react';

export default function MonthView({ currentDate, appointments, onSelectDate }) {
    // Helper to get days in month
    const calendarDays = useMemo(() => {
        const year = new Date(currentDate).getFullYear();
        const month = new Date(currentDate).getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        // Adjust for Monday start if preferred, but standard is usually Sunday for US or Monday for EU.
        // Let's assume standard Sunday start for simplicity (0-6)

        const days = [];

        // Pad previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ day: null });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                date: dateStr,
                isToday: dateStr === new Date().toISOString().split('T')[0]
            });
        }

        return days;
    }, [currentDate]);

    // Group appointments by date
    const appointmentsByDate = useMemo(() => {
        const map = {};
        appointments.forEach(apt => {
            const date = apt.date; // YYYY-MM-DD
            if (!map[date]) map[date] = [];
            map[date].push(apt);
        });
        return map;
    }, [appointments]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((cell, index) => {
                    if (!cell.day) {
                        return <div key={index} className="bg-slate-50/30 min-h-[100px] border-b border-r border-slate-50"></div>;
                    }

                    const apts = appointmentsByDate[cell.date] || [];
                    const isSelected = cell.date === currentDate;

                    return (
                        <div
                            key={cell.date}
                            onClick={() => onSelectDate(cell.date)}
                            className={`min-h-[100px] p-2 border-b border-r border-slate-100 transition-colors cursor-pointer hover:bg-primary/5
                                ${cell.isToday ? 'bg-slate-50' : 'bg-white'}
                                ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                                    ${cell.isToday ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}
                                `}>
                                    {cell.day}
                                </span>
                                {apts.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                        {apts.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                {apts.slice(0, 3).map(apt => (
                                    <div key={apt.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                                        {apt.clients?.first_name}
                                    </div>
                                ))}
                                {apts.length > 3 && (
                                    <div className="text-[10px] text-slate-400 pl-1">
                                        + {apts.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
