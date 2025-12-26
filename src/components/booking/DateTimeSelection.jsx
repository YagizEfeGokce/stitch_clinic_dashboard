import { useState } from 'react';
import { getLocalISOString } from '../../utils/dateUtils';

export default function DateTimeSelection({ onSelect }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    // Generate next 14 days
    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            dateObj: d,
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: d.getDate(),
            fullDate: getLocalISOString(d)
        };
    });

    const timeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'
    ];

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onSelect({ date: selectedDate, time: selectedTime });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Select Date & Time</h2>

            {/* Date Strip */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-4 -mx-2 px-2 hide-scrollbar">
                {dates.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedDate(item.fullDate)}
                        className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-2xl border transition-all active:scale-95
                            ${selectedDate === item.fullDate
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-primary/50'
                            }`}
                    >
                        <span className={`text-xs font-bold uppercase mb-1 ${selectedDate === item.fullDate ? 'text-white/80' : 'text-slate-400'}`}>
                            {item.day}
                        </span>
                        <span className={`text-xl font-bold leading-none ${selectedDate === item.fullDate ? 'text-white' : 'text-slate-800'}`}>
                            {item.date}
                        </span>
                    </button>
                ))}
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-3">Available Slots</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {timeSlots.map((time, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-4 rounded-xl border font-semibold transition-all
                            ${selectedTime === time
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                            }`}
                    >
                        {time}
                    </button>
                ))}
            </div>

            <button
                disabled={!selectedDate || !selectedTime}
                onClick={handleConfirm}
                className="mt-auto w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
            >
                Continue
            </button>
        </div>
    );
}
