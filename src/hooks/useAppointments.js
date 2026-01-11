import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalISOString } from '../utils/dateUtils';
import { useToast } from '../context/ToastContext';

export function useAppointments(selectedDate, view, selectedStaffId) {
    const [appointments, setAppointments] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    const fetchUpcoming = useCallback(async () => {
        const today = getLocalISOString();
        // Simple logic: Get next 5 appointments from today onwards
        let query = supabase
            .from('appointments')
            .select(`
                id, client_id, date, time, status,
                clients (first_name, last_name, image_url),
                services (name)
            `)
            .gte('date', today)
            .neq('status', 'Cancelled')
            .order('date', { ascending: true })
            .order('time', { ascending: true })
            .limit(5);

        // Filter upcoming by staff if selected (and not 'all')
        if (selectedStaffId && selectedStaffId !== 'all') {
            query = query.eq('staff_id', selectedStaffId);
        }

        const { data } = await query;

        if (data) {
            setUpcoming(data.map(apt => ({
                ...apt,
                clients: Array.isArray(apt.clients) ? apt.clients[0] : apt.clients,
                services: Array.isArray(apt.services) ? apt.services[0] : apt.services
            })));
        }
    }, [selectedStaffId]);

    const fetchAppointments = useCallback(async (retryCount = 0) => {
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Timeout promise - Increase to 15s for slow connections
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            // Execute complex fetch logic
            const performFetch = async () => {
                let query = supabase
                    .from('appointments')
                    .select(`
                        *,
                        services ( * ),
                        clients ( id, first_name, last_name, image_url, phone, notes )
                    `)
                    .order('date', { ascending: true }) // Also order by date for monthly view
                    .order('time', { ascending: true });

                // Date Filter
                if (view === 'day') {
                    query = query.eq('date', selectedDate);
                } else {
                    const [year, month] = selectedDate.split('-');
                    const startDate = `${year}-${month}-01`;
                    const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${year}-${month}-${lastDayOfMonth}`;
                    query = query.gte('date', startDate).lte('date', endDate);
                }

                // Staff Filter
                if (selectedStaffId && selectedStaffId !== 'all') {
                    query = query.eq('staff_id', selectedStaffId);
                }

                const { data, error } = await query;
                if (error) throw error;

                return (data || []).map(apt => ({
                    ...apt,
                    clients: Array.isArray(apt.clients) ? apt.clients[0] : apt.clients,
                    services: Array.isArray(apt.services) ? apt.services[0] : apt.services
                }));
            };

            // Race against timeout
            const mergedData = await Promise.race([performFetch(), timeoutPromise]);

            setAppointments(mergedData);
            fetchUpcoming();
        } catch (error) {
            console.error('Critical error loading dashboard:', error);

            const isNetworkError = error.message === 'TIMEOUT' || error.message?.includes('fetch');
            if (isNetworkError && retryCount < 2) {
                console.warn(`Retry attempt ${retryCount + 1} for dashboard...`);
                return fetchAppointments(retryCount + 1);
            }
            showError('Randevular yüklenemedi. Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    }, [view, selectedDate, selectedStaffId, fetchUpcoming, showError]);

    // Initial Fetch
    useEffect(() => {
        fetchAppointments();
        fetchUpcoming();
    }, [fetchAppointments, fetchUpcoming]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('dashboard_appointments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments'
                },
                () => {
                    fetchAppointments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAppointments]);

    return {
        appointments,
        upcoming,
        loading,
        refreshAppointments: fetchAppointments,
        setAppointments // Exported for optimistic updates
    };
}
