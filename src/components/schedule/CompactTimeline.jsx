import { useMemo } from 'react';
import CompactTimelineCard from './CompactTimelineCard';

/**
 * CompactTimeline - List-based timeline where appointments are listed by time
 * No absolute positioning - just a clean list grouped by time.
 */
export default function CompactTimeline({
    appointments = [],
    workingHours = { start: 9, end: 18 },
    onAppointmentClick,
    onAddClick,
    onStatusChange,
    staffList = []
}) {
    // Group appointments by time slot (rounded to 30 min for grouping)
    const groupedAppointments = useMemo(() => {
        const groups = new Map();

        appointments
            .filter(apt => apt.time && apt.status !== 'Cancelled')
            .forEach(apt => {
                const [h, m] = apt.time.split(':').map(Number);
                // Round to nearest 30 minutes for grouping
                const roundedMin = Math.floor(m / 30) * 30;
                const timeKey = `${h.toString().padStart(2, '0')}:${roundedMin.toString().padStart(2, '0')}`;

                if (!groups.has(timeKey)) {
                    groups.set(timeKey, []);
                }
                groups.get(timeKey).push(apt);
            });

        // Sort by time
        return new Map([...groups.entries()].sort((a, b) => {
            const [aH, aM] = a[0].split(':').map(Number);
            const [bH, bM] = b[0].split(':').map(Number);
            return (aH * 60 + aM) - (bH * 60 + bM);
        }));
    }, [appointments]);

    const hasAppointments = groupedAppointments.size > 0;

    return (
        <div className="relative px-4 pb-8">
            {/* List of time slots with appointments */}
            <div className="flex flex-col">
                {hasAppointments ? (
                    Array.from(groupedAppointments.entries()).map(([timeKey, aptsAtTime]) => (
                        <div key={timeKey} className="flex gap-4 py-3 border-b border-slate-100 last:border-b-0">
                            {/* Time Label */}
                            <div className="w-16 shrink-0 pt-2">
                                <span className="text-sm font-bold text-primary">{timeKey}</span>
                            </div>

                            {/* Appointments at this time */}
                            <div className="flex-1 flex flex-col gap-2">
                                {aptsAtTime.map((apt) => (
                                    <CompactTimelineCard
                                        key={apt.id}
                                        appointment={apt}
                                        onClick={() => onAppointmentClick?.(apt)}
                                        staffName={staffList.find(s => s.id === apt.staff_id)?.full_name}
                                        onStatusChange={onStatusChange}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 opacity-40">event_available</span>
                        <p className="text-sm">Bugün için randevu yok</p>
                    </div>
                )}
            </div>

            {/* Add Button - Inline, not FAB to avoid overlap */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Yeni Randevu Ekle
                </button>
            </div>
        </div>
    );
}
