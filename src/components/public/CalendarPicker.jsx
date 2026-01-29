import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

/**
 * CalendarPicker - Calendly-style calendar with month view
 * Turkish locale, shows working days, configurable advance booking
 */
export default function CalendarPicker({ selectedDate, onSelectDate, clinicSettings }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Working days from clinic settings
    const workingDays = clinicSettings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Advance booking days from clinic settings (default 30)
    const advanceDays = clinicSettings?.online_booking_advance_days || 30;

    // Bounds: today to X days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = addDays(today, advanceDays);

    // Navigation handlers
    const prevMonth = () => {
        const newMonth = subMonths(currentMonth, 1);
        if (isSameMonth(newMonth, today) || isAfter(newMonth, today)) {
            setCurrentMonth(newMonth);
        }
    };

    const nextMonth = () => {
        const newMonth = addMonths(currentMonth, 1);
        if (isBefore(startOfMonth(newMonth), maxDate)) {
            setCurrentMonth(newMonth);
        }
    };

    // Go to today
    const goToToday = () => {
        setCurrentMonth(new Date());
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (isWorkingDay(new Date())) {
            onSelectDate(todayStr);
        }
    };

    // Check if a date is a working day
    function isWorkingDay(date) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        return workingDays.includes(dayName);
    }

    // Check if a date is selectable
    function isDateSelectable(date) {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const isInRange = dateOnly >= today && dateOnly <= maxDate;
        const isWorking = isWorkingDay(date);

        return isInRange && isWorking;
    }

    // Generate calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const weeks = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(day));
            day = addDays(day, 1);
        }
        weeks.push(week);
    }

    // Day names in Turkish
    const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    // Can navigate prev/next?
    const canGoPrev = !isSameMonth(currentMonth, today);
    const canGoNext = isBefore(startOfMonth(addMonths(currentMonth, 1)), maxDate);

    // Is today in current month view?
    const isTodayVisible = isSameMonth(currentMonth, new Date());

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Month Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <button
                    onClick={prevMonth}
                    disabled={!canGoPrev}
                    className={`p-2 rounded-lg transition-colors ${canGoPrev
                        ? 'hover:bg-slate-200 text-slate-700'
                        : 'text-slate-300 cursor-not-allowed'
                        }`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: tr })}
                    </h3>

                    {/* Today Button */}
                    {!isTodayVisible && (
                        <button
                            onClick={goToToday}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                            <CalendarDays className="w-3 h-3" />
                            Bugün
                        </button>
                    )}
                </div>

                <button
                    onClick={nextMonth}
                    disabled={!canGoNext}
                    className={`p-2 rounded-lg transition-colors ${canGoNext
                        ? 'hover:bg-slate-200 text-slate-700'
                        : 'text-slate-300 cursor-not-allowed'
                        }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 border-b border-slate-100">
                {dayLabels.map((label, i) => (
                    <div
                        key={label}
                        className={`py-2 text-center text-xs font-bold ${i >= 5 ? 'text-slate-400' : 'text-slate-500'
                            }`}
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="p-2">
                {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="grid grid-cols-7 gap-1">
                        {week.map((date, dayIdx) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isCurrentMonth = isSameMonth(date, currentMonth);
                            const isSelected = selectedDate === dateStr;
                            const isToday = isSameDay(date, new Date());
                            const isSelectable = isDateSelectable(date);

                            return (
                                <button
                                    key={dayIdx}
                                    type="button"
                                    onClick={() => isSelectable && isCurrentMonth && onSelectDate(dateStr)}
                                    disabled={!isSelectable || !isCurrentMonth}
                                    className={`
                                        relative aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all
                                        ${!isCurrentMonth
                                            ? 'text-slate-200'
                                            : isSelected
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                : isToday
                                                    ? 'bg-primary/10 text-primary font-bold'
                                                    : isSelectable
                                                        ? 'text-slate-700 hover:bg-primary/10 hover:text-primary'
                                                        : 'text-slate-300 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {format(date, 'd')}

                                    {/* Today dot indicator */}
                                    {isToday && !isSelected && isCurrentMonth && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Today Quick Select (always visible) */}
            {isTodayVisible && isWorkingDay(new Date()) && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={goToToday}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                    >
                        <CalendarDays className="w-4 h-4" />
                        Bugün - {format(new Date(), 'd MMMM, EEEE', { locale: tr })}
                    </button>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-primary/10 rounded border border-primary/30"></span>
                    <span className="text-slate-500">Bugün</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-slate-100 rounded"></span>
                    <span className="text-slate-500">Kapalı</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[10px]">({advanceDays} gün)</span>
                </div>
            </div>
        </div>
    );
}
