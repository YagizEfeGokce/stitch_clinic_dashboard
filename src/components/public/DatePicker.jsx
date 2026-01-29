import { useState } from 'react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * DatePicker - Shows next 30 days for selection
 * Mobile-friendly horizontal scroll
 */
export default function DatePicker({ selectedDate, onSelectDate, clinicSettings }) {
    // Generate next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
            dateObj: date,
            isoDate: format(date, 'yyyy-MM-dd'),
            dayName: format(date, 'EEE', { locale: tr }),
            dayNumber: format(date, 'd'),
            monthName: format(date, 'MMM', { locale: tr }),
            isToday: i === 0
        };
    });

    // Check if day is a working day
    const workingDays = clinicSettings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    function isWorkingDay(date) {
        const dayName = format(date, 'EEEE'); // Full day name in English
        return workingDays.includes(dayName);
    }

    return (
        <div className="relative">
            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4">
                {dates.map((item) => {
                    const isSelected = selectedDate === item.isoDate;
                    const isWorking = isWorkingDay(item.dateObj);

                    return (
                        <button
                            key={item.isoDate}
                            onClick={() => isWorking && onSelectDate(item.isoDate)}
                            disabled={!isWorking}
                            className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all shrink-0 ${isSelected
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : isWorking
                                        ? 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:shadow-md'
                                        : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white/80' : isWorking ? 'text-slate-400' : 'text-slate-300'
                                }`}>
                                {item.dayName}
                            </span>
                            <span className={`text-xl font-bold leading-none my-1 ${isSelected ? 'text-white' : isWorking ? 'text-slate-800' : 'text-slate-300'
                                }`}>
                                {item.dayNumber}
                            </span>
                            <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : isWorking ? 'text-slate-400' : 'text-slate-300'
                                }`}>
                                {item.monthName}
                            </span>
                            {item.isToday && (
                                <span className={`absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                    }`}>
                                    Bugün
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
