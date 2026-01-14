import { useMemo } from 'react';
import { getLocalISOString } from '../../utils/dateUtils';

export default function CalendarStrip({ selectedDate, onSelectDate }) {
    const days = useMemo(() => {
        // Parse selectedDate (YYYY-MM-DD) or fallback to Today
        // We want the calendar strip to SHOW the selected date.
        const baseDate = selectedDate ? new Date(selectedDate) : new Date();

        // Handle potential invalid date
        const validBaseDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

        const currentDayOfBase = validBaseDate.getDay(); // 0 (Sun) - 6 (Sat)

        // Adjust for Monday start (Turkey standard)
        // If Sunday (0), go back 6 days. If Monday (1), go back 0.
        const diff = currentDayOfBase === 0 ? 6 : currentDayOfBase - 1;

        const weekStart = new Date(validBaseDate);
        weekStart.setDate(validBaseDate.getDate() - diff);

        const today = new Date();
        const todayStr = getLocalISOString(today);

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);

            // Normalize to YYYY-MM-DD for comparison using Local Time
            const dateStr = getLocalISOString(date);

            const isSelected = selectedDate === dateStr;
            const isPast = dateStr < todayStr;

            weekDays.push({
                day: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
                date: date.getDate(),
                fullDate: dateStr,
                status: isSelected ? 'active' : isPast ? 'past' : 'future'
            });
        }
        return weekDays;
    }, [selectedDate]);

    return (
        <div className="w-full overflow-x-auto hide-scrollbar pb-4 pt-1 px-2 sm:px-5">
            <div className="flex items-center justify-between gap-0.5 sm:gap-3 w-full">
                {days.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectDate(item.fullDate)}
                        className={`flex flex-col items-center justify-center flex-1 min-w-[2.7rem] sm:min-w-[4.5rem] h-20 rounded-[14px] sm:rounded-[20px] border transition-all active:scale-95
              ${item.status === 'active'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105 border-transparent z-10'
                                : 'bg-white border-slate-100 hover:border-primary/30'
                            }
              ${item.status === 'past' ? 'opacity-60 grayscale' : ''}
            `}
                    >
                        <span className={`text-xs font-semibold mb-1 ${item.status === 'active' ? 'text-white/80' : 'text-slate-400'}`}>
                            {item.day}
                        </span>
                        <span className={`text-lg font-bold ${item.status === 'active' ? 'text-white' : 'text-slate-800'}`}>
                            {item.date}
                        </span>
                        {item.status === 'active' && (
                            <span className="mt-1 size-1 rounded-full bg-white"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
