import { supabase } from './supabase';

export const logActivity = async (action, details = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Anonymous logs not supported for now

        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id')
            .eq('id', user.id)
            .single();

        if (!profile?.clinic_id) {
            console.warn('No clinic_id found for user, skipping log.');
            return;
        }

        const { error } = await supabase
            .from('activity_logs')
            .insert([
                {
                    user_id: user.id,
                    clinic_id: profile.clinic_id,
                    action,
                    details
                }
            ]);

        if (error) {
            console.error('Failed to log activity:', error);
        }
    } catch (err) {
        console.error('Logger Exception:', err);
    }
};
