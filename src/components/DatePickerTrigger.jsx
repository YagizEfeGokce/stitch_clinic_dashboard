import { useState, useRef, useEffect } from 'react';
import MiniCalendar from './MiniCalendar';

export default function DatePickerTrigger({ onSelectDate, selectedDate }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold transition-all shadow-sm
                    ${isOpen
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
            >
                <span className="material-symbols-outlined text-[20px] transition-colors">calendar_month</span>
                <span>Tarih Seç</span>
            </button>

            {isOpen && (
                <MiniCalendar
                    selectedDate={selectedDate}
                    onSelectDate={onSelectDate}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
