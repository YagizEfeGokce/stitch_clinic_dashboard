import { useState, useRef, useEffect } from 'react';

export default function MonthPicker({ selectedMonth, onChange, onClose }) {
    const [year, setYear] = useState(parseInt(selectedMonth.split('-')[0]));
    const pickerRef = useRef(null);

    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleMonthSelect = (index) => {
        const m = index + 1;
        const formatted = `${year}-${String(m).padStart(2, '0')}`;
        onChange(formatted);
        onClose();
    };

    return (
        <div
            ref={pickerRef}
            className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-[280px] animate-in fade-in zoom-in-95 duration-200 select-none"
        >
            {/* Header: Year Selector */}
            <div className="flex justify-between items-center mb-4 px-1">
                <button
                    onClick={() => setYear(year - 1)}
                    className="size-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-bold"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <div className="font-bold text-slate-900 text-lg tracking-tight">{year}</div>
                <button
                    onClick={() => setYear(year + 1)}
                    className="size-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-bold"
                >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
                {months.map((m, index) => {
                    const isSelected = year === parseInt(selectedMonth.split('-')[0]) && (index + 1) === parseInt(selectedMonth.split('-')[1]);
                    return (
                        <button
                            key={m}
                            onClick={() => handleMonthSelect(index)}
                            className={`h-10 rounded-xl text-xs font-bold transition-all ${isSelected
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {m.slice(0, 3)}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-center">
                <button
                    onClick={() => {
                        const now = new Date();
                        const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        onChange(current);
                        onClose();
                    }}
                    className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                    Bulunduğumuz Ay
                </button>
            </div>
        </div>
    );
}
