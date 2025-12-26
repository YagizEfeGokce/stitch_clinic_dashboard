import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalISOString } from '../utils/dateUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionCenter from '../components/ActionCenter';

export default function Home() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        appointmentsToday: 0,
        activeClients: 0,
        revenueMonth: 0,
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Compute display name safely
    const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Doctor';

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = getLocalISOString();

            // Perform parallel fetching
            // Note: Profile is handled by AuthContext now

            const todaysAppointmentsPromise = supabase
                .from('appointments')
                .select(`
                    *,
                    services (duration_min)
                `, { count: 'exact' })
                .eq('date', today)
                .neq('status', 'Cancelled');

            const activeClientsPromise = supabase
                .from('clients')
                .select('*', { count: 'exact', head: true }) // head: true means we only want count, lighter payload
                .eq('status', 'Active');

            const settingsPromise = supabase
                .from('clinic_settings')
                .select('working_start_hour, working_end_hour, working_days')
                .single();

            const upcomingPromise = supabase
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
                .gte('date', today)
                .neq('status', 'Cancelled')
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(5);

            // Execute all requests in parallel
            const [
                { data: todaysAppointments, count: todayCount },
                { count: clientCount },
                { data: settings },
                { data: upcoming }
            ] = await Promise.all([
                todaysAppointmentsPromise,
                activeClientsPromise,
                settingsPromise,
                upcomingPromise
            ]);

            // Name handling removed from here as it's derived from context

            // --- CALCULATE OCCUPANCY RATE ---
            let occupancyRate = 0;
            if (settings && todaysAppointments) {
                const dayName = new Date(today).toLocaleDateString('en-US', { weekday: 'long' });

                // Only calculate if today is a working day
                if (settings.working_days && settings.working_days.includes(dayName)) {
                    const startHour = parseInt(settings.working_start_hour.split(':')[0]);
                    const endHour = parseInt(settings.working_end_hour.split(':')[0]);
                    const totalWorkingMinutes = (endHour - startHour) * 60;

                    if (totalWorkingMinutes > 0) {
                        const totalBookedMinutes = todaysAppointments.reduce((acc, apt) => {
                            // Default to 30 mins if service duration is missing
                            const duration = apt.services?.duration_min || 30;
                            return acc + duration;
                        }, 0);

                        occupancyRate = Math.round((totalBookedMinutes / totalWorkingMinutes) * 100);
                        // Cap at 100% just in case of overbooking
                        if (occupancyRate > 100) occupancyRate = 100;
                    }
                }
            }

            setStats({
                appointmentsToday: todayCount || 0,
                activeClients: clientCount || 0,
                occupancyRate: occupancyRate
            });
            setUpcomingAppointments(upcoming || []);

        } catch (error) {
            console.error('Error fetching home stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRelativeDateLabel = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (dateStr === today) return 'Today';
        if (dateStr === tomorrow) return 'Tomorrow';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-1 mb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Good Morning, {displayName} 👋
                        </h1>
                        <p className="text-slate-500 font-medium">Here's what's happening at Stitch Clinic today.</p>
                    </div>
                </div>
            </header>

            {/* Action Center - Now visible on Home too */}
            <ActionCenter />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{stats.appointmentsToday}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Appointments Today</span>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{stats.activeClients}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Active Patients</span>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform col-span-2 md:col-span-1">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{stats.occupancyRate}%</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Occupancy Rate</span>
                </div>
            </div>

            {/* Quick Access Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <Link to="/schedule" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-slate-900">View Schedule</span>
                        <span className="block text-[10px] text-slate-500">Manage appointments</span>
                    </div>
                </Link>
                <Link to="/clients" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                    <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">person_add</span>
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-slate-900">New Patient</span>
                        <span className="block text-[10px] text-slate-500">Register profile</span>
                    </div>
                </Link>
                <Link to="/finance" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-slate-900">Record Payment</span>
                        <span className="block text-[10px] text-slate-500">Add transaction</span>
                    </div>
                </Link>
            </div>

            {/* Upcoming Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Up Next</h2>
                    <Link to="/schedule" className="text-sm font-bold text-primary hover:text-primary-dark">View Schedule</Link>
                </div>

                {upcomingAppointments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">No upcoming appointments.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingAppointments.map(apt => (
                            <Link
                                key={apt.id}
                                to={`/clients/${apt.client_id}`}
                                className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                                <div className="flex flex-col items-center justify-center min-w-[4rem] bg-indigo-50 text-indigo-700 rounded-lg py-2 px-1 text-center group-hover:bg-indigo-100 transition-colors">
                                    <span className="text-[10px] font-extrabold uppercase leading-none mb-1">{getRelativeDateLabel(apt.date)}</span>
                                    <span className="text-sm font-bold leading-none">{apt.time.substring(0, 5)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                        {apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : 'Unknown Client'}
                                    </h4>
                                    <p className="text-sm text-slate-500 truncate">{apt.services?.name || 'Consultation'}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${apt.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700' :
                                    apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {apt.status}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
