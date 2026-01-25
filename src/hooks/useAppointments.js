import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function useAppointments(selectedDate, view, selectedStaffId) {
    const { profile } = useAuth();
    const { error: showError } = useToast();

    // State
    const [appointments, setAppointments] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Function
    const refreshAppointments = useCallback(async () => {
        try {
            setLoading(true);
            if (!profile?.clinic_id) return;

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    clients (
                        id,
                        first_name,
                        last_name,
                        phone,
                        image_url
                    ),
                    services (
                        id,
                        name,
                        color,
                        duration_min,
                        price
                    ),
                    profiles:staff_id (
                        id,
                        full_name
                    )
                `)
                .eq('clinic_id', profile.clinic_id);

            // Date Filtering
            if (view === 'month') {
                const date = new Date(selectedDate);
                const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

                query = query
                    .gte('date', startOfMonth)
                    .lte('date', endOfMonth);
            } else {
                // Day View: Exact match
                query = query.eq('date', selectedDate);
            }

            // Staff Filtering
            if (selectedStaffId && selectedStaffId !== 'all') {
                query = query.eq('staff_id', selectedStaffId);
            }

            const { data, error } = await query
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);

            // Sidebar: Fetch Upcoming (Next 3 days)
            const today = new Date().toISOString().split('T')[0];
            const threeDaysLater = new Date();
            threeDaysLater.setDate(threeDaysLater.getDate() + 3);

            const { data: upcomingData } = await supabase
                .from('appointments')
                .select('*, clients(first_name, last_name), services(name, color, duration_min)')
                .eq('clinic_id', profile.clinic_id)
                .gte('date', today)
                .lte('date', threeDaysLater.toISOString().split('T')[0])
                .neq('status', 'Cancelled')
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(10);

            setUpcoming(upcomingData || []);

        } catch (error) {
            console.error('Error fetching appointments:', error);
            showError('Randevular yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [profile?.clinic_id, selectedDate, view, selectedStaffId]);

    // Effect
    useEffect(() => {
        refreshAppointments();

        // Optional: Realtime Subscription could go here

    }, [refreshAppointments]);

    return {
        appointments,
        upcoming,
        loading,
        refreshAppointments,
        setAppointments
    };
}
