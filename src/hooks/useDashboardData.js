import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getLocalISOString } from '../utils/dateUtils';

/**
 * Fetch dashboard stats and upcoming appointments
 */
async function fetchDashboardData(clinicId) {
    const today = getLocalISOString();

    // Parallel fetching for performance
    const [
        { data: todaysAppointments, count: todayCount },
        { count: clientCount },
        { data: clinicData },
        { data: upcoming }
    ] = await Promise.all([
        supabase
            .from('appointments')
            .select(`*, services (duration_min)`, { count: 'exact' })
            .eq('clinic_id', clinicId)
            .eq('date', today)
            .neq('status', 'Cancelled'),
        supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .eq('status', 'Active'),
        supabase
            .from('clinics')
            .select('settings_config')
            .eq('id', clinicId)
            .single(),
        supabase
            .from('appointments')
            .select(`
                id, 
                date,
                time, 
                status,
                client_id,
                clients (first_name, last_name, image_url), 
                services (name)
            `)
            .eq('clinic_id', clinicId)
            .gte('date', today)
            .neq('status', 'Cancelled')
            .order('date', { ascending: true })
            .order('time', { ascending: true })
            .limit(5)
    ]);

    // Calculate occupancy rate
    let occupancyRate = 0;
    if (clinicData?.settings_config && todaysAppointments) {
        const { working_days, working_start_hour, working_end_hour } = clinicData.settings_config;
        const dayName = new Date(today).toLocaleDateString('en-US', { weekday: 'long' });

        if (working_days && Array.isArray(working_days) && working_days.includes(dayName)) {
            if (working_start_hour && working_end_hour) {
                const startHour = parseInt(working_start_hour.split(':')[0]);
                const endHour = parseInt(working_end_hour.split(':')[0]);
                const totalWorkingMinutes = (endHour - startHour) * 60;

                if (totalWorkingMinutes > 0) {
                    const totalBookedMinutes = todaysAppointments.reduce((acc, apt) => {
                        const duration = apt.services?.duration_min || 30;
                        return acc + duration;
                    }, 0);

                    occupancyRate = Math.round((totalBookedMinutes / totalWorkingMinutes) * 100);
                    if (occupancyRate > 100) occupancyRate = 100;
                }
            }
        }
    }

    return {
        stats: {
            appointmentsToday: todayCount || 0,
            activeClients: clientCount || 0,
            occupancyRate
        },
        upcomingAppointments: upcoming || []
    };
}

/**
 * Custom hook for fetching home dashboard data with React Query
 * 
 * Features:
 * - Automatic caching with 30s stale time
 * - Background refetch every 2 minutes
 * - Intelligent focus-based refetching
 */
export function useDashboardData() {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const {
        data,
        isLoading: loading,
        isFetching,
        error,
        refetch
    } = useQuery({
        queryKey: ['dashboard', 'home', clinicId],
        queryFn: () => fetchDashboardData(clinicId),
        enabled: !!clinicId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 2 * 60 * 1000, // 2 minutes
        refetchIntervalInBackground: false,
    });

    return {
        stats: data?.stats || {
            appointmentsToday: 0,
            activeClients: 0,
            occupancyRate: 0
        },
        upcomingAppointments: data?.upcomingAppointments || [],
        loading,
        isFetching,
        error,
        refetch
    };
}
