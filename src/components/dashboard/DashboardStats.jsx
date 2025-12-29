import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getLocalISOString } from '../../utils/dateUtils';

export default function DashboardStats({ user }) {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        todayRevenue: 0,
        newClients: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const today = getLocalISOString();
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

            // 1. Fetch Today's Appointments & Revenue
            const { data: appointments, error: aptError } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    status,
                    services ( price )
                `)
                .eq('date', today)
                .neq('status', 'Cancelled');

            if (aptError) throw aptError;

            // Calculate Metrics
            const todayAppointments = appointments.length;

            // Calculate Revenue: sum service prices
            // Note: service might be null if deleted, or array if join returns multiple (should be single)
            const todayRevenue = appointments.reduce((sum, apt) => {
                const price = Array.isArray(apt.services) ? apt.services[0]?.price : apt.services?.price;
                return sum + (price || 0);
            }, 0);

            // 2. Fetch New Clients (This Month)
            // Assuming 'created_at' exists on clients table. If not, this might fail or return 0. 
            // We'll wrap in try/catch specifically or check error.
            const { count: newClients, error: clientError } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonthStr); // simple filter

            if (clientError) {
                console.warn('Could not fetch new clients stats (maybe created_at missing)', clientError);
            }

            setStats({
                todayAppointments,
                todayRevenue,
                newClients: newClients || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-5 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100/60 shadow-sm"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-5 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Today's Appointments */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">calendar_today</span>
                </div>
                <div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Appointments Today</p>
                    <p className="text-3xl font-black text-slate-900 mt-0.5">{stats.todayAppointments}</p>
                </div>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="size-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">payments</span>
                </div>
                <div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Est. Revenue</p>
                    <p className="text-3xl font-black text-slate-900 mt-0.5">
                        ${stats.todayRevenue.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* New Clients */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="size-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">group_add</span>
                </div>
                <div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">New Clients <span className="text-xs normal-case font-medium text-slate-400">(Month)</span></p>
                    <p className="text-3xl font-black text-slate-900 mt-0.5">{stats.newClients}</p>
                </div>
            </div>
        </div>
    );
}
