import { useState, useMemo } from 'react';

export default function MiniCalendar({ selectedDate, onSelectDate, onClose }) {
    // Initialize viewDate to selectedDate or today
    const [viewDate, setViewDate] = useState(() => {
        return selectedDate ? new Date(selectedDate) : new Date();
    });

    // Helper: Days in month logic
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        // Adjust for Monday start if needed. Let's use Monday start for Turkey context (Pazartesi=1)
        // If 0 (Sun), becomes 6. If 1 (Mon), becomes 0.
        // let adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        // However, user screenshot showed "Pt Sa Ca..." which is Mon-Sun or Sun-Sat. 
        // Let's stick to standard internal logic, render Mon-Sun headers.

        // Standard Monday Start Calculation:
        // Sun(0) -> 6
        // Mon(1) -> 0
        const mondayStartOffset = (startDayOfWeek + 6) % 7;

        const days = [];

        // Pad previous month
        for (let i = 0; i < mondayStartOffset; i++) {
            days.push({ day: null });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            // Local date string construction to avoid timezone issues
            const d = new Date(year, month, i);
            // Format to YYYY-MM-DD manually
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            days.push({
                day: i,
                date: dateStr,
                isToday: dateStr === new Date().toISOString().split('T')[0]
            });
        }

        return days;
    }, [viewDate]);

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (date) => {
        onSelectDate(date);
        if (onClose) onClose();
    };

    // Turkish Short Days (Mon-Sun)
    const weekDays = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];

    // Month Names
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    return (
        <div
            className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-[280px] z-[60] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <div className="text-sm font-bold text-slate-800">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, index) => {
                    if (!cell.day) {
                        return <div key={index}></div>;
                    }

                    const isSelected = cell.date === selectedDate;

                    return (
                        <button
                            key={cell.date}
                            onClick={() => handleDateClick(cell.date)}
                            className={`
                                h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                                ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-slate-700 hover:bg-slate-100'}
                                ${cell.isToday && !isSelected ? 'ring-1 ring-primary text-primary' : ''}
                            `}
                        >
                            {cell.day}
                        </button>
                    );
                })}
            </div>

            {/* Quick Select Today */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                <button
                    onClick={() => handleDateClick(new Date().toISOString().split('T')[0])}
                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                    Bugün
                </button>
            </div>
        </div>
    );
}
