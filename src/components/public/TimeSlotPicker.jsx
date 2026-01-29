import { useState, useEffect } from 'react';
import { supabasePublic } from '../../lib/supabasePublic';
import { format, parseISO } from 'date-fns';

/**
 * TimeSlotPicker - Shows available time slots for a given date
 * Fetches existing appointments and filters out booked times
 */
export default function TimeSlotPicker({
    clinicId,
    serviceId,
    selectedDate,
    selectedTime,
    onSelectTime,
    clinicSettings
}) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedDate || !clinicId) {
            setSlots([]);
            return;
        }

        async function fetchAvailableSlots() {
            try {
                setLoading(true);
                setError(null);

                // Get clinic working hours from settings
                const workingStart = clinicSettings?.working_start_hour || '09:00';
                const workingEnd = clinicSettings?.working_end_hour || '18:00';
                const workingDays = clinicSettings?.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

                // Check if selected day is a working day - use native JS
                const dateObj = parseISO(selectedDate);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = dayNames[dateObj.getDay()];

                if (!workingDays.includes(dayName)) {
                    setSlots([]);
                    setError('Bu gün klinik kapalı');
                    return;
                }

                // Fetch existing appointments for this date
                const { data: appointments, error: fetchError } = await supabasePublic
                    .from('appointments')
                    .select('time')
                    .eq('clinic_id', clinicId)
                    .eq('date', selectedDate)
                    .neq('status', 'Cancelled');

                if (fetchError) {
                    console.error('[TimeSlotPicker] Error fetching appointments:', fetchError);
                }

                const bookedTimes = new Set((appointments || []).map(a => a.time?.slice(0, 5)));

                // Generate 30-minute slots
                const generatedSlots = [];
                const [startHour, startMin] = workingStart.split(':').map(Number);
                const [endHour, endMin] = workingEnd.split(':').map(Number);

                let currentHour = startHour;
                let currentMin = startMin;

                while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
                    const isBooked = bookedTimes.has(timeStr);

                    // Check if slot is in the past (for today)
                    const now = new Date();
                    const today = format(now, 'yyyy-MM-dd');
                    const currentTimeStr = format(now, 'HH:mm');
                    const isPast = selectedDate === today && timeStr <= currentTimeStr;

                    generatedSlots.push({
                        time: timeStr,
                        display: timeStr,
                        available: !isBooked && !isPast
                    });

                    // Increment by 30 minutes
                    currentMin += 30;
                    if (currentMin >= 60) {
                        currentMin = 0;
                        currentHour += 1;
                    }
                }

                setSlots(generatedSlots);

            } catch (err) {
                console.error('[TimeSlotPicker] Error:', err);
                setError('Saatler yüklenemedi');
            } finally {
                setLoading(false);
            }
        }

        fetchAvailableSlots();
    }, [selectedDate, clinicId, clinicSettings]);

    if (!selectedDate) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Önce bir tarih seçin</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-slate-400 mt-2">Uygun saatler yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const availableSlots = slots.filter(s => s.available);

    if (availableSlots.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p className="text-sm">Bu tarihte uygun saat bulunmuyor</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
                <button
                    key={slot.time}
                    type="button"
                    onClick={() => slot.available && onSelectTime(slot.time)}
                    disabled={!slot.available}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${selectedTime === slot.time
                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                            : slot.available
                                ? 'bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                        }`}
                >
                    {slot.display}
                </button>
            ))}
        </div>
    );
}
