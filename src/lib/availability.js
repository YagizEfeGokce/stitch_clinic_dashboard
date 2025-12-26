import { supabase } from './supabase';

export const checkWorkingHours = async (dateStr, timeStr, staffId) => {
    try {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        // 1. Fetch Clinic Settings
        const { data: clinic } = await supabase
            .from('clinic_settings')
            .select('working_days, working_start_hour, working_end_hour')
            .single();

        if (clinic) {
            // Check Clinic Days
            if (clinic.working_days && !clinic.working_days.includes(dayName)) {
                return { valid: false, message: `Clinic is closed on ${dayName}s.` };
            }

            // Check Clinic Hours
            if (clinic.working_start_hour && clinic.working_end_hour) {
                if (timeStr < clinic.working_start_hour || timeStr >= clinic.working_end_hour) {
                    return { valid: false, message: `Time is outside clinic hours (${clinic.working_start_hour} - ${clinic.working_end_hour}).` };
                }
            }
        }

        // 2. Fetch Staff Availability
        if (staffId) {
            const { data: staffAvail } = await supabase
                .from('staff_availability')
                .select('start_time, end_time, is_working')
                .eq('staff_id', staffId)
                .eq('day_of_week', dayName)
                .maybeSingle();

            // If staff availability is defined for this day, enforce it.
            // If NOT defined, we generally fallback to clinic hours (already checked) or assume available?
            // User requirement: "Staffların çalışmayı belirlediği saatler dışında randevu veremememiz lazım"
            // If they haven't set their schedule, we might assume they follow clinic hours.
            // But if they HAVE set it, we enforce it.

            if (staffAvail) {
                if (!staffAvail.is_working) {
                    return { valid: false, message: `Staff is not working on ${dayName}s.` };
                }

                if (timeStr < staffAvail.start_time || timeStr >= staffAvail.end_time) {
                    return { valid: false, message: `Time is outside staff's working hours (${staffAvail.start_time.slice(0, 5)} - ${staffAvail.end_time.slice(0, 5)}).` };
                }
            }
        }

        return { valid: true };

    } catch (error) {
        console.error('Availability Check Error:', error);
        // Fail safe: Allow if check fails? Or Block? Block is safer.
        return { valid: false, message: 'Could not verify working hours.' };
    }
};
