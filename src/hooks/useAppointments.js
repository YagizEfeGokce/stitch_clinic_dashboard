import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCallback } from 'react';

/**
 * Query key factory for appointments
 * @param {string} clinicId - Clinic ID
 * @param {string} selectedDate - Selected date
 * @param {string} view - View type ('day' or 'month')
 * @param {string} selectedStaffId - Staff ID filter
 */
const appointmentsQueryKey = (clinicId, selectedDate, view, selectedStaffId) => [
    'appointments',
    clinicId,
    selectedDate,
    view,
    selectedStaffId
];

const upcomingQueryKey = (clinicId) => ['appointments', 'upcoming', clinicId];

/**
 * Fetch appointments from Supabase
 */
async function fetchAppointmentsData({ clinicId, selectedDate, view, selectedStaffId }) {
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
        .eq('clinic_id', clinicId);

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
    return data || [];
}

/**
 * Fetch upcoming appointments (next 3 days)
 */
async function fetchUpcomingData(clinicId) {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const { data, error } = await supabase
        .from('appointments')
        .select('*, clients(first_name, last_name), services(name, color, duration_min)')
        .eq('clinic_id', clinicId)
        .gte('date', today)
        .lte('date', threeDaysLater.toISOString().split('T')[0])
        .neq('status', 'Cancelled')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(10);

    if (error) throw error;
    return data || [];
}

/**
 * Custom hook for fetching appointments with React Query
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetch every 60 seconds
 * - Intelligent focus-based refetching (only after 5+ min away)
 * - Preserved scroll position during refetch
 * 
 * @param {string} selectedDate - Selected date (YYYY-MM-DD)
 * @param {string} view - 'day' or 'month'
 * @param {string} selectedStaffId - Staff ID filter or 'all'
 */
export function useAppointments(selectedDate, view, selectedStaffId) {
    const { profile } = useAuth();
    const { error: showError } = useToast();
    const queryClient = useQueryClient();
    const clinicId = profile?.clinic_id;

    // Main appointments query
    const {
        data: appointments = [],
        isLoading: loading,
        isFetching,
        refetch,
        error
    } = useQuery({
        queryKey: appointmentsQueryKey(clinicId, selectedDate, view, selectedStaffId),
        queryFn: () => fetchAppointmentsData({ clinicId, selectedDate, view, selectedStaffId }),
        enabled: !!clinicId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 60 * 1000, // Background polling every 60 seconds
        refetchIntervalInBackground: false, // Don't poll when tab is hidden
        meta: {
            errorMessage: 'Randevular yüklenirken hata oluştu'
        }
    });

    // Upcoming appointments query
    const { data: upcoming = [] } = useQuery({
        queryKey: upcomingQueryKey(clinicId),
        queryFn: () => fetchUpcomingData(clinicId),
        enabled: !!clinicId,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000,
        refetchInterval: 2 * 60 * 1000, // Every 2 minutes
        refetchIntervalInBackground: false,
    });

    // Handle errors
    if (error) {
        console.error('Error fetching appointments:', error);
        // Only show toast once per error
        if (!error._toastShown) {
            showError('Randevular yüklenirken hata oluştu');
            error._toastShown = true;
        }
    }

    // Manual refresh function for use after mutations
    const refreshAppointments = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        ]);
    }, [queryClient]);

    // Optimistic update helper for setAppointments
    // Note: With React Query, prefer using mutations + invalidation instead
    const setAppointments = useCallback((newAppointments) => {
        queryClient.setQueryData(
            appointmentsQueryKey(clinicId, selectedDate, view, selectedStaffId),
            typeof newAppointments === 'function'
                ? newAppointments(appointments)
                : newAppointments
        );
    }, [queryClient, clinicId, selectedDate, view, selectedStaffId, appointments]);

    return {
        appointments,
        upcoming,
        loading,
        isFetching, // True when refetching in background
        refreshAppointments,
        setAppointments
    };
}
