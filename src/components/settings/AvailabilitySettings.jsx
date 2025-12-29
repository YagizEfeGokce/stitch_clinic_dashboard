import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/logger';


const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilitySettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [clinicSettings, setClinicSettings] = useState(null);

    useEffect(() => {
        if (user) {
            const init = async () => {
                setLoading(true);
                await Promise.all([fetchAvailability(), fetchClinicSettings()]);
                setLoading(false);
            };
            init();
        }
    }, [user]);

    const fetchClinicSettings = async () => {
        try {
            const response = await supabase.from('clinics').select('settings_config').single();
            if (response && response.data?.settings_config) {
                setClinicSettings(response.data.settings_config);
            }
        } catch (error) {
            console.error('Error fetching clinic settings:', error);
        }
    };

    const fetchAvailability = async () => {
        try {
            const response = await supabase
                .from('staff_availability')
                .select('*')
                .eq('staff_id', user.id);

            // Defensive coding: Supabase client *should* return an object, but if it returns null/undefined
            if (!response) {
                console.error('Supabase returned null response for availability fetch');
                return;
            }

            const { data, error } = response;

            if (error) throw error;

            // Initialize missing days
            const initializedData = DAYS.map(day => {
                const existing = data ? data.find(d => d.day_of_week === day) : null;
                return existing || {
                    day_of_week: day,
                    is_working: ['Saturday', 'Sunday'].includes(day) ? false : true,
                    start_time: '09:00',
                    end_time: '17:00',
                    staff_id: user.id
                };
            });

            setAvailability(initializedData);
        } catch (error) {
            console.error('Error fetching availability:', error);
            toast.error('Could not load schedule');
        }
    };

    const updateDay = (index, field, value) => {
        const newAvail = [...availability];
        newAvail[index] = { ...newAvail[index], [field]: value };
        setAvailability(newAvail);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Validation: Check against Clinic Hours
            if (clinicSettings) {
                const { working_start_hour, working_end_hour } = clinicSettings;
                for (const day of availability) {
                    if (day.is_working) {
                        if (working_start_hour && working_end_hour) {
                            if (day.start_time < working_start_hour || day.end_time > working_end_hour) {
                                toast.error(`Invalid hours for ${day.day_of_week}. Must be between ${working_start_hour} - ${working_end_hour}`);
                                setSaving(false);
                                return;
                            }
                        }
                        if (day.start_time >= day.end_time) {
                            toast.error(`Invalid time range for ${day.day_of_week}. Start time must be before End time.`);
                            setSaving(false);
                            return;
                        }
                    }
                }
            }

            // Prepare payload
            const payload = availability.map(day => ({
                staff_id: user.id,
                day_of_week: day.day_of_week,
                start_time: day.start_time,
                end_time: day.end_time,
                is_working: day.is_working
            }));

            // Defensive coding for upsert
            const response = await supabase
                .from('staff_availability')
                .upsert(payload, { onConflict: 'staff_id,day_of_week' });

            if (!response) {
                throw new Error('Supabase client returned no response');
            }

            const { error } = response;

            if (error) {
                console.error('Supabase Upsert Error:', error);
                throw error;
            }

            await logActivity('Updated Availability', { count: payload.length });
            toast.success('Schedule updated successfully');

            await fetchAvailability();
        } catch (error) {
            console.error('Error saving availability:', error);
            const msg = error.message || 'Unknown error occurred';
            toast.error('Failed to save: ' + msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                    <h3 className="text-slate-900 text-xl font-bold leading-tight">My Schedule</h3>
                    <p className="text-slate-500 text-sm">Define your weekly working hours.</p>
                    {clinicSettings && (
                        <p className="text-xs text-primary font-medium bg-primary/5 inline-block px-2 py-1 rounded">
                            Clinic Hours: {clinicSettings.working_start_hour} - {clinicSettings.working_end_hour}
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {availability.map((day, index) => (
                        <div key={day.day_of_week} className={`p-4 transition-colors ${!day.is_working ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-32 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={day.is_working}
                                        onChange={(e) => updateDay(index, 'is_working', e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all"
                                    />
                                    <span className={`font-bold ${day.is_working ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {day.day_of_week}
                                    </span>
                                </div>

                                {day.is_working ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={day.start_time}
                                            onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                        />
                                        <span className="text-slate-400 text-sm font-medium">to</span>
                                        <input
                                            type="time"
                                            value={day.end_time}
                                            onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">OFF</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
