import React from 'react';

export default function ClientHistoryTimeline({ appointments, transactions }) {
    // 1. Merge and Normalize Data
    const events = [
        ...appointments.map(a => ({
            id: `appt-${a.id}`,
            date: new Date(a.date + 'T' + (a.time || '00:00')),
            type: 'appointment',
            title: 'Appointment',
            subtitle: a.services?.name || 'Service',
            status: a.status,
            amount: null,
            icon: 'calendar_today'
        })),
        ...transactions.map(t => ({
            id: `tx-${t.id}`,
            date: new Date(t.date),
            type: 'transaction',
            title: 'Transaction',
            subtitle: t.payment_method || 'Payment',
            status: 'Completed',
            amount: t.amount,
            icon: 'payments'
        }))
    ].sort((a, b) => b.date - a.date); // Newest first

    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p>No history found for this client.</p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2 mt-4">
            {events.map((event) => (
                <div key={event.id} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${event.type === 'appointment' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'
                        }`}>
                        <span className="material-symbols-outlined text-[10px]">{event.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {event.date.toLocaleDateString()}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${event.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    event.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-600'
                                }`}>
                                {event.status}
                            </span>
                        </div>
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-slate-900 font-bold">{event.title}: {event.subtitle}</h4>
                                {event.type === 'appointment' && (
                                    <p className="text-slate-500 text-sm mt-1">
                                        {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                            {event.amount && (
                                <span className={`font-bold ${event.amount > 0 ? 'text-slate-900' : 'text-red-500'}`}>
                                    ${Math.abs(event.amount).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
