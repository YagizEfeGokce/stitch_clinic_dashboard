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
            const { data, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:user_id (full_name, email, role)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    );

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
                                        <td className="p-4 text-slate-500 font-mono text-xs truncate max-w-xs" title={JSON.stringify(log.details)}>
                                            {JSON.stringify(log.details)}
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
