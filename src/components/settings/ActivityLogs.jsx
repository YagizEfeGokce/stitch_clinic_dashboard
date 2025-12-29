import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Attempt 1: Fetch with Relations (Requires correct FK to profiles)
            const { data, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:user_id (full_name, role)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) setLogs(data);

        } catch (error) {
            console.error('Error fetching joined logs:', error);

            // Attempt 2: Fallback to raw logs (Diagnose if table exists but relation is broken)
            try {
                const { data: rawData, error: rawError } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (rawData) {
                    setLogs(rawData); // Show raw logs at least
                    setLogs(rawData); // Show raw logs at least
                    // Show the specific error from the first attempt to help debugging
                    alert(`Relation Error: ${error.message}\nHint: The database relation between logs and profiles is still not recognized. Try reloading Supabase schema cache.`);
                } else if (rawError) {
                    console.error('Raw fetch failed:', rawError);
                }
            } catch (fallbackErr) {
                console.error('Fallback failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        (log.profiles?.full_name || 'Unknown').toLowerCase().includes(search.toLowerCase())
    );

    const formatDetails = (log) => {
        try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (!details) return '-';

            if (log.action === 'Created Appointment') {
                return `Appt: ${details.time} on ${details.date}`;
            }
            if (log.action === 'Rescheduled Appointment') {
                return `Moved to ${details.new_time} (${details.date})`;
            }
            if (log.action === 'Removed Logo') return 'Logo deleted';
            else if (log.action === 'Updated Branding Settings') {
                return `Updated branding colors/settings`;
            } else if (log.action === 'Created Inventory Item') {
                return `Added product: ${details.item_name || 'Item'}`;
            } else if (log.action === 'Updated Inventory Item') {
                const changes = Array.isArray(details.changes) ? details.changes.join(', ') : 'details';
                return `Updated product ${details.item_name || ''}: ${changes}`;
            } else if (log.action === 'Deleted Inventory Item') {
                return `Deleted product: ${details.item_name || details.item_id}`;
            } else if (log.action === 'Created Client') {
                return `Added client: ${details.client_name || 'Client'}`;
            } else if (log.action === 'Updated Client') {
                const changes = Array.isArray(details.changes) ? details.changes.join(', ') : 'details';
                return `Updated client ${details.client_name || ''}: ${changes}`;
            } else if (log.action === 'Deleted Client') {
                return `Deleted client: ${details.client_name || details.client_id}`;
            } else if (log.action === 'Created Service') {
                return `Added service: ${details.service_name || 'Service'}`;
            } else if (log.action === 'Updated Service') {
                const changes = Array.isArray(details.changes) ? details.changes.join(', ') : 'details';
                return `Updated service ${details.service_name || ''}: ${changes}`;
            } else if (log.action === 'Deleted Service') {
                return `Deleted service: ${details.service_name || details.service_id}`;
            }

            return JSON.stringify(details);
        } catch {
            return JSON.stringify(log.details);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                    <h3 className="text-slate-900 text-xl font-bold leading-tight">Activity Logs</h3>
                    <p className="text-slate-500 text-sm">Audit trail of recent system actions.</p>
                </div>
                <button onClick={fetchLogs} className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">refresh</span>
                </button>
            </div>

            <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-bold text-slate-700">Time</th>
                                <th className="p-4 font-bold text-slate-700">User</th>
                                <th className="p-4 font-bold text-slate-700">Action</th>
                                <th className="p-4 font-bold text-slate-700">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">Loading logs...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">No logs found.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-500">
                                            {format(new Date(log.created_at), 'MMM d, HH:mm')}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{log.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400 capitalize">{log.profiles?.role || 'User'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono text-xs truncate max-w-xs">
                                            {formatDetails(log)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
