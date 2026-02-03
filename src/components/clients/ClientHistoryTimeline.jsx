import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatUtils';
import { User, Calendar, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, X } from 'lucide-react';

const STATUS_CONFIG = {
    'Completed': { label: 'Tamamlandı', color: 'bg-green-100 text-green-700', icon: CheckCircle, dotColor: 'bg-green-500' },
    'Cancelled': { label: 'İptal Edildi', color: 'bg-red-100 text-red-700', icon: XCircle, dotColor: 'bg-red-500' },
    'NoShow': { label: 'Gelmedi', color: 'bg-slate-100 text-slate-600', icon: AlertCircle, dotColor: 'bg-slate-400' },
    'Scheduled': { label: 'Planlandı', color: 'bg-blue-100 text-blue-700', icon: Calendar, dotColor: 'bg-blue-500' },
    'Confirmed': { label: 'Onaylandı', color: 'bg-primary/10 text-primary', icon: CheckCircle, dotColor: 'bg-primary' },
    'Pending': { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700', icon: Clock, dotColor: 'bg-yellow-500' }
};

const PAYMENT_STATUS = {
    'Paid': { label: 'Ödendi', color: 'bg-green-100 text-green-700' },
    'Unpaid': { label: 'Ödenmedi', color: 'bg-yellow-100 text-yellow-700' },
    'Partial': { label: 'Kısmi Ödendi', color: 'bg-orange-100 text-orange-700' }
};

export default function ClientHistoryTimeline({ appointments, transactions }) {
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [groupBy, setGroupBy] = useState('date'); // 'date' or 'status'

    // 1. Merge and Normalize Data
    const events = [
        ...appointments.map(a => ({
            id: `appt-${a.id}`,
            rawId: a.id,
            date: new Date(a.date + 'T' + (a.time || '00:00')),
            type: 'appointment',
            title: 'Randevu',
            subtitle: a.services?.name || 'Hizmet',
            status: a.status,
            paymentStatus: a.payment_status,
            notes: a.notes,
            amount: a.services?.price || null,
            duration: a.services?.duration_min,
            serviceColor: a.services?.color,
            category: a.services?.category,
            staff: a.staff, // Now includes staff info from API
            icon: 'calendar_today',
            raw: a
        })),
        ...transactions.map(t => ({
            id: `tx-${t.id}`,
            rawId: t.id,
            date: new Date(t.date),
            type: 'transaction',
            title: 'Ödeme',
            subtitle: t.payment_method || 'Ödeme',
            status: 'Completed',
            amount: t.amount,
            notes: t.notes,
            icon: 'payments',
            raw: t
        }))
    ].sort((a, b) => b.date - a.date); // Newest first

    // Group by status if selected
    const groupedEvents = groupBy === 'status'
        ? events.reduce((acc, event) => {
            const status = event.status || 'Other';
            if (!acc[status]) acc[status] = [];
            acc[status].push(event);
            return acc;
        }, {})
        : { all: events };

    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                <p>Bu müşteri için geçmiş bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">history</span>
                    Geçmiş ({events.length})
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setGroupBy('date')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${groupBy === 'date' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Tarihe Göre
                    </button>
                    <button
                        onClick={() => setGroupBy('status')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${groupBy === 'status' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Duruma Göre
                    </button>
                </div>
            </div>

            {/* Timeline */}
            {Object.entries(groupedEvents).map(([group, groupItems]) => (
                <div key={group}>
                    {/* Group Header */}
                    {groupBy === 'status' && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[group]?.dotColor || 'bg-slate-300'}`}></div>
                            <h4 className="font-bold text-slate-700">
                                {STATUS_CONFIG[group]?.label || group} ({groupItems.length})
                            </h4>
                        </div>
                    )}

                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 ml-2">
                        {groupItems.map((event) => {
                            const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG['Scheduled'];

                            return (
                                <div
                                    key={event.id}
                                    className="relative cursor-pointer"
                                    onClick={() => event.type === 'appointment' && setSelectedAppointment(event)}
                                >
                                    {/* Dot */}
                                    <div className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${event.type === 'appointment' ? statusConfig.dotColor : 'bg-emerald-500'
                                        } text-white`}>
                                        <span className="material-symbols-outlined text-[10px]">{event.icon}</span>
                                    </div>

                                    {/* Content Card */}
                                    <div className={`p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all ${event.type === 'appointment' ? 'bg-white hover:border-primary/30' : 'bg-emerald-50'
                                        }`}>
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {event.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs font-medium text-slate-500">
                                                    {event.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="text-slate-900 font-bold flex items-center gap-2">
                                                    {event.subtitle}
                                                    {event.category && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                            {event.category}
                                                        </span>
                                                    )}
                                                </h4>

                                                {/* Duration */}
                                                {event.duration && (
                                                    <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {event.duration} dakika
                                                    </p>
                                                )}

                                                {/* Notes preview */}
                                                {event.notes && (
                                                    <p className="text-slate-500 text-sm mt-1 italic line-clamp-1">
                                                        "{event.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right Side: Staff + Amount */}
                                            <div className="flex items-center gap-4">
                                                {/* Staff Info */}
                                                {event.type === 'appointment' && (
                                                    <div className="flex items-center gap-2">
                                                        {event.staff ? (
                                                            <>
                                                                {event.staff.avatar_url ? (
                                                                    <img
                                                                        src={event.staff.avatar_url}
                                                                        alt={event.staff.full_name}
                                                                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <User className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                )}
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium text-slate-800">{event.staff.full_name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                                        {event.staff.role === 'doctor' ? 'Hekim' :
                                                                            event.staff.role === 'owner' ? 'Klinik Sahibi' : 'Personel'}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 italic whitespace-nowrap">
                                                                Personel atanmadı
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Amount */}
                                                {event.amount && (
                                                    <span className={`font-bold text-lg whitespace-nowrap ${event.type === 'transaction' && event.amount > 0 ? 'text-emerald-600' : 'text-slate-900'
                                                        }`}>
                                                        {event.type === 'transaction' && event.amount > 0 ? '+' : ''}
                                                        {formatCurrency(Math.abs(event.amount))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Payment Status Badge */}
                                        {event.paymentStatus && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                                <CreditCard size={14} className="text-slate-400" />
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS[event.paymentStatus]?.color || 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {PAYMENT_STATUS[event.paymentStatus]?.label || event.paymentStatus}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedAppointment(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-900">Randevu Detayları</h2>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Service */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                <div className={`w-3 h-12 rounded-full`} style={{ backgroundColor: selectedAppointment.serviceColor || '#3b82f6' }}></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedAppointment.subtitle}</h3>
                                    {selectedAppointment.category && (
                                        <p className="text-sm text-slate-500">{selectedAppointment.category}</p>
                                    )}
                                </div>
                                {selectedAppointment.amount && (
                                    <span className="ml-auto font-bold text-lg text-primary">{formatCurrency(selectedAppointment.amount)}</span>
                                )}
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                        <Calendar size={14} />
                                        Tarih
                                    </div>
                                    <p className="font-bold text-slate-900">
                                        {selectedAppointment.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                        <Clock size={14} />
                                        Saat
                                    </div>
                                    <p className="font-bold text-slate-900">
                                        {selectedAppointment.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        {selectedAppointment.duration && ` (${selectedAppointment.duration} dk)`}
                                    </p>
                                </div>
                            </div>

                            {/* Staff */}
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                                    <User size={14} />
                                    Uygulayan Personel
                                </div>
                                {selectedAppointment.staff ? (
                                    <div className="flex items-center gap-3">
                                        {selectedAppointment.staff.avatar_url ? (
                                            <img
                                                src={selectedAppointment.staff.avatar_url}
                                                alt={selectedAppointment.staff.full_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-slate-900">{selectedAppointment.staff.full_name}</p>
                                            <p className="text-sm text-slate-500">
                                                {selectedAppointment.staff.role === 'doctor' ? 'Hekim' :
                                                    selectedAppointment.staff.role === 'owner' ? 'Klinik Sahibi' : 'Personel'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic">Personel atanmadı</p>
                                )}
                            </div>

                            {/* Status & Payment */}
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${STATUS_CONFIG[selectedAppointment.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                                    {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                                </span>
                                {selectedAppointment.paymentStatus && (
                                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${PAYMENT_STATUS[selectedAppointment.paymentStatus]?.color || 'bg-slate-100 text-slate-600'}`}>
                                        {PAYMENT_STATUS[selectedAppointment.paymentStatus]?.label || selectedAppointment.paymentStatus}
                                    </span>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedAppointment.notes && (
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Notlar</p>
                                    <p className="text-slate-800 font-medium">{selectedAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
