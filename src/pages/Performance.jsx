import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import KPICard from '../components/finance/KPICard';
import ServiceAnalytics from '../components/performance/ServiceAnalytics';
import ClientGrowthChart from '../components/performance/ClientGrowthChart';
import StaffAvailability from '../components/performance/StaffAvailability';
import MonthPicker from '../components/ui/MonthPicker';

export default function Performance() {
    // const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [clients, setClients] = useState([]);
    const [staffList, setStaffList] = useState([]);

    // Filter State
    const [filter, setFilter] = useState('This Month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filter, selectedMonth]); // Fetch heavily depends on filter? Actually fetchData fetches all, filtering is local usually.
    // Wait, fetchData fetches 'gte 2023-01-01'. So local filtering is fine.
    // I will keep fetchData only on mount to avoid spam, unless we need dynamic fetch. 
    // The current fetchData fetches EVERYTHING from 2023. So we only need to re-render when filter changes.
    // But let's add [filter, selectedMonth] to useEffect just in case we change fetch logic later, 
    // or simply keep it [] and rely on local filtering variables recalculation.
    // Better: keep [] for fetch, filtering is derived state.

    const fetchData = async () => {
        try {
            // setLoading(true); // Don't block UI on re-fetch

            // 1. Fetch Appointments (All time for analytics)
            const { data: aptData, error: aptError } = await supabase
                .from('appointments')
                .select('*, profiles:staff_id(full_name, role, avatar_url), services:service_id(name, duration_min)')
                .gte('date', '2023-01-01');

            if (aptError) console.error('Error fetching appointments:', aptError);

            // 2. Fetch Clients (for growth)
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id, created_at');

            if (clientError) console.error('Error fetching clients:', clientError);

            // 3. Fetch Staff Profiles
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*');

            if (profileError) console.error('Error fetching profiles:', profileError);

            setAppointments(aptData || []);
            setClients(clientData || []);
            setStaffList(profileData || []);
        } catch (error) {
            console.error('Critical error fetching performance data:', error);
        } finally {
            // setLoading(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('performance_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => fetchData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'clients' },
                () => fetchData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // --- Helper Logic ---
    const getDateRange = () => {
        const now = new Date();
        let start, end;

        if (filter === 'This Month') {
            const y = now.getFullYear();
            const m = now.getMonth();
            start = new Date(y, m, 1, 0, 0, 0); // Start of month 00:00
            end = new Date(y, m + 1, 0, 23, 59, 59); // End of month 23:59
        } else if (filter === 'Custom Month') {
            const [y, m] = selectedMonth.split('-').map(Number);
            start = new Date(y, m - 1, 1, 0, 0, 0);
            end = new Date(y, m, 0, 23, 59, 59);
        } else {
            // All Time
            start = new Date(2023, 0, 1);
            end = new Date(new Date().getFullYear() + 1, 0, 1);
        }
        return { start, end };
    };

    const { start, end } = getDateRange();

    const currentApts = appointments.filter(a => {
        // Safe string comparison or robust Date parsing
        // a.date is YYYY-MM-DD. We treat it as local date at 00:00 or simple string comparison if range matches.
        // Let's use robust Date object comparison but setting time to 12:00 to avoid timezone shifts jumping days.
        const [y, m, d] = a.date.split('-').map(Number);
        const aptDate = new Date(y, m - 1, d, 12, 0, 0);

        return aptDate >= start && aptDate <= end;
    });

    // --- KPIs ---

    // 1. Total Appointments
    const totalVisits = currentApts.filter(a => a.status !== 'Cancelled').length;

    // 2. New Clients (in period)
    const newClients = clients.filter(c => {
        const d = new Date(c.created_at);
        return d >= start && d <= end;
    }).length;

    // 3. Completion Rate
    const completed = currentApts.filter(a => a.status === 'Completed').length;
    const completionRate = currentApts.length > 0
        ? Math.round((completed / currentApts.length) * 100)
        : 0;

    // 4. Rebooking Rate (Clients with >= 2 completed appointments)
    // First, count completed visits per client
    const clientVisitCounts = currentApts
        .filter(a => a.status === 'Completed' && a.client_id)
        .reduce((acc, a) => {
            acc[a.client_id] = (acc[a.client_id] || 0) + 1;
            return acc;
        }, {});

    const totalClientsWithVisits = Object.keys(clientVisitCounts).length;
    const returningClients = Object.values(clientVisitCounts).filter(count => count >= 2).length;

    const rebookingRate = totalClientsWithVisits > 0
        ? Math.round((returningClients / totalClientsWithVisits) * 100)
        : 0;

    return (
        <div className="p-5 pb-32">
            <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Operational Performance</h1>
                <p className="text-sm text-slate-500">Analytics on services, staff, and growth.</p>
            </div>

            {/* Filter & Month Selection - RELATIVE for Positioning */}
            <div className="flex flex-wrap items-center gap-3 mb-6 relative">
                <div className="flex bg-white p-1 rounded-xl shadow-sm ring-1 ring-slate-100">
                    {['This Month', 'Custom Month', 'All Time'].map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                setFilter(f);
                                if (f === 'This Month') {
                                    const now = new Date();
                                    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                                    setIsPickerOpen(false);
                                }
                                if (f === 'Custom Month') {
                                    setIsPickerOpen(!isPickerOpen);
                                } else {
                                    setIsPickerOpen(false);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                ? 'bg-primary text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Custom Month Picker */}
                {isPickerOpen && (
                    <MonthPicker
                        selectedMonth={selectedMonth}
                        onChange={(val) => {
                            setSelectedMonth(val);
                            // Keep filter
                        }}
                        onClose={() => setIsPickerOpen(false)}
                    />
                )}

                {/* Selected Month Label */}
                {filter === 'Custom Month' && !isPickerOpen && (
                    <div
                        onClick={() => setIsPickerOpen(true)}
                        className="text-sm font-bold text-slate-500 flex items-center gap-2 animate-in fade-in cursor-pointer hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                )}
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Visits</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{totalVisits}</p>
                    </div>
                    <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined">calendar_month</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">New Clients</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{newClients}</p>
                    </div>
                    <div className="size-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                        <span className="material-symbols-outlined">group_add</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Completion Rate</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</p>
                    </div>
                    <div className={`size-12 rounded-xl flex items-center justify-center ${completionRate > 80 ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                        <span className="material-symbols-outlined">fact_check</span>
                    </div>
                </div>
            </div>

            {/* Main Grids */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ClientGrowthChart clients={clients} />
                    </div>
                    <div className="lg:col-span-1">
                        <ServiceAnalytics appointments={currentApts} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StaffAvailability staffList={staffList} appointments={appointments} />

                    {/* Operational Health Card (Inline) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 text-lg mb-6">Operational Health</h3>

                        <div className="space-y-6">
                            {/* Cancellation Rate */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-semibold text-slate-600">Cancellation Rate</span>
                                    <span className="text-xl font-bold text-slate-900">
                                        {currentApts.length > 0 ? Math.round((currentApts.filter(a => a.status === 'Cancelled').length / currentApts.length) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${currentApts.length > 0 ? (currentApts.filter(a => a.status === 'Cancelled').length / currentApts.length) * 100 : 0}%` }}></div>
                                </div>
                            </div>

                            {/* Rebooking Rate (Calculated: Clients with > 1 visit / Total Clients with visits) */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-semibold text-slate-600">Rebooking Rate</span>
                                    <span className="text-xl font-bold text-slate-900">{rebookingRate}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${rebookingRate}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Based on clients with 2+ completed visits</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
