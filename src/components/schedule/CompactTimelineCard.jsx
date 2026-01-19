import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

/**
 * CompactTimelineCard - Appointment card for the compact timeline view
 * Shows client info, service, duration badge, status, and quick actions
 */
export default function CompactTimelineCard({
    appointment,
    onClick,
    staffName,
    onStatusChange
}) {
    const { clients, services, time, status, notes } = appointment;
    const { success, error: showError } = useToast();
    const [updating, setUpdating] = useState(false);

    const clientName = clients
        ? `${clients.first_name} ${clients.last_name}`
        : 'İsimsiz Hasta';

    const serviceName = services?.name || 'İşlem Belirtilmedi';
    const duration = services?.duration_min || 30;
    const imageUrl = clients?.image_url;

    // Quick status update
    const handleConfirm = async (e) => {
        e.stopPropagation();
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'Confirmed' })
                .eq('id', appointment.id);

            if (error) throw error;
            success('Randevu onaylandı');
            onStatusChange?.();
        } catch (err) {
            showError('Onaylama başarısız');
        } finally {
            setUpdating(false);
        }
    };

    const handleComplete = async (e) => {
        e.stopPropagation();
        setUpdating(true);
        try {
            // 1. Update appointment status
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'Completed' })
                .eq('id', appointment.id);

            if (error) throw error;

            // 2. Auto-add transaction (revenue) for the service
            const servicePrice = services?.price || 0;
            if (servicePrice > 0 && clients?.id) {
                await supabase.from('transactions').insert({
                    clinic_id: appointment.clinic_id,
                    client_id: clients.id,
                    amount: servicePrice,
                    type: 'income',
                    category: 'Hizmet Geliri',
                    description: `${serviceName} - ${clientName}`,
                    date: appointment.date,
                    appointment_id: appointment.id
                });
            }

            success('Randevu tamamlandı ve gelir eklendi');
            onStatusChange?.();
        } catch (err) {
            console.error('Complete error:', err);
            showError('İşlem başarısız');
        } finally {
            setUpdating(false);
        }
    };

    // Status styling
    const getStatusStyles = (s) => {
        const statusLower = s?.toLowerCase();
        switch (statusLower) {
            case 'completed':
                return 'bg-green-50 border-green-200 text-green-700';
            case 'confirmed':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'scheduled':
            case 'pending':
                return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'noshow':
                return 'bg-red-50 border-red-200 text-red-600';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-600';
        }
    };

    const getStatusText = (s) => {
        const map = {
            'scheduled': 'Planlandı',
            'confirmed': 'Onaylandı',
            'pending': 'Bekliyor',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal',
            'noshow': 'Gelmedi'
        };
        return map[s?.toLowerCase()] || s;
    };

    // Card border color based on status
    const getBorderColor = (s) => {
        const statusLower = s?.toLowerCase();
        switch (statusLower) {
            case 'completed': return 'border-l-green-500';
            case 'confirmed': return 'border-l-blue-500';
            case 'scheduled':
            case 'pending': return 'border-l-amber-500';
            case 'noshow': return 'border-l-red-500';
            default: return 'border-l-primary';
        }
    };

    const isScheduled = status?.toLowerCase() === 'scheduled' || status?.toLowerCase() === 'pending';
    const isConfirmed = status?.toLowerCase() === 'confirmed';

    return (
        <div
            onClick={onClick}
            className={`
                group flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 
                shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                border-l-4 ${getBorderColor(status)}
            `}
        >
            {/* Avatar */}
            <div
                className="w-10 h-10 rounded-full bg-slate-100 bg-cover bg-center shrink-0 ring-2 ring-white"
                style={{
                    backgroundImage: imageUrl
                        ? `url("${imageUrl}")`
                        : `url("https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=0d9488&color=fff")`
                }}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 truncate">{clientName}</h4>
                    {notes?.toLowerCase().includes('vip') && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded uppercase">
                            VIP
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 truncate">{serviceName}</p>
            </div>

            {/* Time & Duration */}
            <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-sm font-bold text-primary">{time?.slice(0, 5)}</span>
                <span className="text-xs text-slate-400 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {duration} dk
                </span>
            </div>

            {/* Status Badge */}
            <div className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusStyles(status)}`}>
                {getStatusText(status)}
            </div>

            {/* Quick Action Buttons */}
            {isScheduled && (
                <button
                    onClick={handleConfirm}
                    disabled={updating}
                    className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    title="Randevuyu Onayla"
                >
                    {updating ? '...' : 'Onayla'}
                </button>
            )}

            {isConfirmed && (
                <button
                    onClick={handleComplete}
                    disabled={updating}
                    className="shrink-0 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    title="Randevuyu Tamamla"
                >
                    {updating ? '...' : 'Tamamla'}
                </button>
            )}

            {/* Hover Action */}
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
            </div>
        </div>
    );
}
