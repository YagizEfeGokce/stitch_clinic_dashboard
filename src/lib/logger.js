import { supabase } from './supabase';

export const logActivity = async (action, details = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Anonymous logs not supported for now

        const { error } = await supabase
            .from('activity_logs')
            .insert([
                {
                    user_id: user.id,
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
