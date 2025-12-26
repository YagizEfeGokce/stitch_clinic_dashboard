import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpcomingSidebar = ({ appointments }) => {
    const navigate = useNavigate();

    const getRelativeDateLabel = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (dateStr === today) return 'Today';
        if (dateStr === tomorrow) return 'Tomorrow';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sticky top-24">
            <div className="mb-4">
                <h3 className="font-bold text-slate-900">Upcoming</h3>
            </div>

            {appointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No upcoming appointments.
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map(apt => (
                        <div key={apt.id} className="flex gap-3 items-start relative group cursor-pointer hover:bg-slate-50 transition-colors rounded-lg p-1 -mx-1" onClick={() => navigate(`/clients/${apt.client_id}`)}>
                            {/* Date Badge */}
                            <div className="flex flex-col items-center justify-center min-w-[3rem] bg-indigo-50 text-indigo-700 rounded-lg py-1.5 px-1">
                                <span className="text-[10px] font-bold uppercase">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-lg font-bold leading-none">{new Date(apt.date).getDate()}</span>
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : 'Client'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{apt.services?.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        {getRelativeDateLabel(apt.date)}
                                    </span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {apt.time?.substring(0, 5)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UpcomingSidebar;
