import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../lib/logger';
import { appointmentsAPI, appointmentMaterialsAPI } from '../../lib/api';
import AppointmentMaterialsSection from './AppointmentMaterialsSection';
import { ButtonSpinner } from '../ui/Spinner';

export default function AppointmentModal({ appointment, onClose, onUpdate }) {
    const { role } = useAuth();
    const { success, error: toastError } = useToast();

    const [loading, setLoading] = useState(false);
    const [currentNotes, setCurrentNotes] = useState(appointment?.notes || '');
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [newTime, setNewTime] = useState(appointment?.time || '09:00');
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [newDate, setNewDate] = useState(appointment?.date || '');

    // Reassign State
    const [staffList, setStaffList] = useState([]);
    const [isReassigning, setIsReassigning] = useState(false);
    const [targetStaffId, setTargetStaffId] = useState('');

    // Materials & Completion Dialog State
    const [materialsInfo, setMaterialsInfo] = useState({ count: 0, hasInsufficientStock: false });
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [appointmentMaterials, setAppointmentMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    // Handle materials info change callback - MUST be before any conditional returns
    const handleMaterialsChange = useCallback((info) => {
        setMaterialsInfo(info);
    }, []);

    // Sync state if appointment prop updates
    useEffect(() => {
        if (appointment) {
            setCurrentNotes(appointment.notes || '');
            setNewTime(appointment.time || '09:00');
            setNewDate(appointment.date || '');
            setIsEditingTime(false);
            setIsEditingDate(false);
            setIsReassigning(false);
            setTargetStaffId(appointment.staff_id || '');
        }
    }, [appointment]);

    // Fetch Staff List (Admin/Doctor Only)
    useEffect(() => {
        if ((role === 'admin' || role === 'doctor' || role === 'owner' || role === 'super_admin') && staffList.length === 0) {
            const fetchStaff = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .neq('role', 'client') // Optional: filter out clients if any
                    .order('full_name');
                if (data) setStaffList(data);
            };
            fetchStaff();
        }
    }, [role, staffList.length]);

    const handleSaveTime = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ time: newTime })
                .eq('id', appointment.id);

            if (error) throw error;
            success(`Saat ${newTime} olarak güncellendi`);
            setIsEditingTime(false);
            onUpdate();
        } catch (err) {
            console.error('Error updating time:', err);
            toastError('Saat güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDate = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ date: newDate })
                .eq('id', appointment.id);

            if (error) throw error;

            await logActivity('Rescheduled Appointment', {
                appointment_id: appointment.id,
                new_date: newDate,
                old_date: appointment.date
            });

            success(`${newDate} tarihine ertelendi`);
            setIsEditingDate(false);
            onUpdate();
            onClose(); // Close modal after rescheduling to different day
        } catch (err) {
            console.error('Error updating date:', err);
            toastError('Yeniden planlanamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleReassignStaff = async () => {
        if (!targetStaffId || targetStaffId === appointment.staff_id) {
            setIsReassigning(false);
            return;
        }

        setLoading(true);
        try {
            // 1. Conflict Check for the NEW Staff
            const { data: dayAppointments } = await supabase
                .from('appointments')
                .select('time, services(duration_min)')
                .eq('date', appointment.date)
                .eq('staff_id', targetStaffId)
                .neq('status', 'Cancelled');

            if (dayAppointments) {
                const selectedDateTime = new Date(`${appointment.date}T${newTime}`);
                const serviceDuration = appointment.services?.duration_min || 30; // Fallback

                const newStart = selectedDateTime.getTime();
                const newEnd = newStart + (serviceDuration * 60000);

                const hasConflict = dayAppointments.some(apt => {
                    const aptTime = new Date(`${appointment.date}T${apt.time}`);
                    const aptStart = aptTime.getTime();
                    const aptDuration = apt.services?.duration_min || 30;
                    const aptEnd = aptStart + (aptDuration * 60000);

                    return newStart < aptEnd && newEnd > aptStart;
                });

                if (hasConflict) {
                    toastError('Çakışma! Seçilen personel bu saatte meşgul.');
                    setLoading(false);
                    return;
                }
            }

            // 2. Perform Update
            const { error } = await supabase
                .from('appointments')
                .update({ staff_id: targetStaffId })
                .eq('id', appointment.id);

            if (error) throw error;

            const newStaffName = staffList.find(s => s.id === targetStaffId)?.full_name || 'Personel';
            success(`${newStaffName} kişisine atandı`);
            setIsReassigning(false);
            onUpdate(); // Parent refresh
            onClose(); // Close modal
        } catch (err) {
            console.error('Reassignment Error:', err);
            toastError('Randevu atanamadı');
        } finally {
            setLoading(false);
        }
    };


    if (!appointment) return null;

    const {
        id,
        service_name,
        date,
        // time, // Removed unused variable
        status,
        clients,
        staff_id, // ensure this exists in selection
        service_id,
        clinic_id
    } = appointment;

    // const assignedStaffName = staffList.find(s => s.id === staff_id)?.full_name || 'Unknown Staff'; // Removed unused variable

    // Fetch materials for completion confirmation
    const handleShowCompleteConfirm = async () => {
        setLoadingMaterials(true);
        try {
            const { data, error } = await appointmentMaterialsAPI.getAppointmentMaterials(id);
            if (error) {
                console.error('Error fetching materials:', error);
            }

            const activeMaterials = (data || []).filter(m => !m.deducted);
            setAppointmentMaterials(activeMaterials);

            // Check stock availability
            if (activeMaterials.length > 0) {
                const stockCheck = await appointmentsAPI.checkStockForCompletion(id);
                if (stockCheck.error) {
                    toastError(stockCheck.error);
                    return;
                }
            }

            setShowCompleteConfirm(true);
        } catch (err) {
            console.error('Error preparing completion:', err);
            toastError('Tamamlama hazırlanırken bir hata oluştu');
        } finally {
            setLoadingMaterials(false);
        }
    };

    // Handle confirmed completion with inventory deduction
    const handleConfirmComplete = async () => {
        setShowCompleteConfirm(false);
        setLoading(true);

        try {
            // Update appointment status - the database trigger will handle inventory deduction
            const { error } = await supabase
                .from('appointments')
                .update({
                    status: 'Completed',
                    notes: currentNotes
                })
                .eq('id', id);

            if (error) {
                // Check if it's an insufficient stock error from the trigger
                if (error.message?.includes('INSUFFICIENT_STOCK')) {
                    const stockMessage = error.message.split('INSUFFICIENT_STOCK:')[1]?.trim() || 'Yetersiz stok';
                    toastError(`Yetersiz stok: ${stockMessage}`);
                    return;
                }
                throw error;
            }

            await logActivity('Randevu Tamamlandı', {
                appointment_id: id,
                client_id: appointment.client_id,
                materials_deducted: appointmentMaterials.length
            });

            if (appointmentMaterials.length > 0) {
                success('Randevu tamamlandı ve malzemeler envanterden düşüldü');
            } else {
                success('Randevu tamamlandı');
            }

            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error completing appointment:', err);
            toastError('Randevu tamamlanırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    status: newStatus,
                    notes: currentNotes
                })
                .eq('id', id);

            if (error) throw error;

            await logActivity('Updated Appointment Status', {
                status: newStatus,
                appointment_id: id,
                client_id: appointment.client_id
            });

            // Translate status for toast
            const statusMap = {
                'Scheduled': 'Planlandı',
                'Completed': 'Tamamlandı',
                'Cancelled': 'İptal Edildi',
                'Pending': 'Bekliyor'
            };
            success(`Randevu ${statusMap[newStatus] || newStatus} olarak işaretlendi`);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error updating status:', err);
            toastError('Durum güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        setLoading(true);
        try {
            const { error } = await supabase // Removed unused 'data'
                .from('appointments')
                .update({ notes: currentNotes })
                .eq('id', id); // Removed .select() as we don't need data

            if (error) throw error;

            success('Notlar başarıyla kaydedildi');
            onUpdate();
        } catch (err) {
            console.error('Error saving notes:', err);
            toastError('Notlar kaydedilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Format Times
    const formatTimeDisplay = (t) => {
        if (!t) return '00:00';
        const [h, m] = t.split(':');
        return `${h}:${m}`; // Turkish format usually 24h
    };

    const getStatusLabel = (status) => {
        const normalized = status?.toLowerCase();
        switch (normalized) {
            case 'scheduled': return 'Planlandı';
            case 'completed': return 'Tamamlandı';
            case 'cancelled': return 'İptal Edildi';
            case 'pending': return 'Bekliyor';
            case 'noshow': return 'Gelmedi';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider
                            ${status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                        `}>
                            {getStatusLabel(status)}
                        </span>
                        <span className="text-slate-400">•</span>
                        {isEditingDate ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <button onClick={handleSaveDate} disabled={loading} className="text-primary font-bold text-xs hover:underline">Kaydet</button>
                                <button onClick={() => { setIsEditingDate(false); setNewDate(date); }} className="text-slate-400 text-xs hover:text-slate-600">İptal</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 group">
                                <span className="font-semibold text-slate-500">{newDate.split('-').reverse().join('.')}</span>
                                <button
                                    onClick={() => setIsEditingDate(true)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded"
                                    title="Başka güne ertele"
                                >
                                    <span className="material-symbols-outlined text-[14px] text-slate-400">edit_calendar</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Client Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                            {clients?.image_url ?
                                <img src={clients.image_url} alt="client" className="w-full h-full object-cover" /> :
                                <span className="text-2xl font-bold text-slate-300">{clients?.first_name?.[0]}</span>
                            }
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900">{clients?.first_name} {clients?.last_name}</h2>
                                {clients?.phone && (
                                    <button
                                        onClick={() => {
                                            const cleanNumber = clients.phone.replace(/\D/g, '');
                                            window.open(`https://wa.me/${cleanNumber}`, '_blank');
                                        }}
                                        className="text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 p-1.5 rounded-full transition-colors"
                                        title="WhatsApp'ta Sohbet Et"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chat</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium">{service_name}</p>
                        </div>
                    </div>

                    {/* Time Slot - Editable */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-4 relative group">
                        <div className="size-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">schedule</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-blue-500 font-bold uppercase tracking-wide">Randevu Saati</p>
                            {isEditingTime ? (
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="text-lg font-bold text-slate-900 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-600 w-full"
                                />
                            ) : (
                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    {formatTimeDisplay(newTime)}
                                    <button onClick={() => setIsEditingTime(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded">
                                        <span className="material-symbols-outlined text-[16px] text-blue-600">edit</span>
                                    </button>
                                </p>
                            )}
                        </div>
                        {isEditingTime && (
                            <div className="flex gap-2">
                                <button onClick={handleSaveTime} disabled={loading} className="text-blue-600 font-bold text-sm hover:underline">Kaydet</button>
                                <button onClick={() => { setIsEditingTime(false); setNewTime(appointment.time); }} className="text-slate-400 text-sm hover:text-slate-600">İptal</button>
                            </div>
                        )}
                    </div>

                    {/* Staff Reassignment (Admin/Doctor/Owner Only) */}
                    {(role === 'admin' || role === 'doctor' || role === 'owner' || role === 'super_admin') && (
                        <div className="flex items-center gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100 mb-6 relative group">
                            <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">stethoscope</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-purple-700 font-bold uppercase tracking-wide">Atanan Uzman</p>

                                {isReassigning ? (
                                    <select
                                        value={targetStaffId}
                                        onChange={(e) => setTargetStaffId(e.target.value)}
                                        className="w-full mt-1 bg-white border border-purple-200 text-slate-900 font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="" disabled>Personel Seç</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-slate-900">
                                            {/* We try to find name in list, otherwise fallback to prop if available or loading */}
                                            {staffList.find(s => s.id === staff_id)?.full_name || 'Yükleniyor...'}
                                        </p>
                                        <button
                                            onClick={() => { setIsReassigning(true); setTargetStaffId(staff_id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-purple-100 rounded"
                                            title="Personeli Değiştir"
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-purple-600">swap_horiz</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {isReassigning && (
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={handleReassignStaff}
                                        disabled={loading}
                                        className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg font-bold text-xs shadow-sm transition-colors"
                                    >
                                        Onayla
                                    </button>
                                    <button
                                        onClick={() => setIsReassigning(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notlar</label>
                        <div className="relative">
                            <textarea
                                rows="2"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 resize-none bg-slate-50 focus:bg-white transition-all"
                                placeholder="Bu ziyaret hakkında dahili notlar ekleyin..."
                                value={currentNotes}
                                onChange={(e) => setCurrentNotes(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={loading}
                                    className="text-xs font-bold text-primary hover:text-primary-dark hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    Notları Kaydet
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Materials Section */}
                    {status !== 'Completed' && (
                        <div className="mb-4">
                            <AppointmentMaterialsSection
                                appointmentId={id}
                                serviceId={service_id}
                                clinicId={clinic_id}
                                isCompleted={status === 'Completed'}
                                onMaterialsChange={handleMaterialsChange}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        {status !== 'Cancelled' && (
                            <button
                                onClick={() => handleUpdateStatus('Cancelled')}
                                disabled={loading}
                                className="py-3 px-4 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">block</span>
                                İptal Et
                            </button>
                        )}

                        {status !== 'Completed' && (
                            <button
                                onClick={handleShowCompleteConfirm}
                                disabled={loading || loadingMaterials || materialsInfo.hasInsufficientStock}
                                className={`py-3 px-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 col-span-1 ml-auto w-full ${materialsInfo.hasInsufficientStock
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                                    }`}
                                title={materialsInfo.hasInsufficientStock ? 'Yetersiz stok - envanterde yeterli malzeme yok' : ''}
                            >
                                {loadingMaterials ? (
                                    <ButtonSpinner />
                                ) : (
                                    <span className="material-symbols-outlined">check_circle</span>
                                )}
                                Tamamla
                                {materialsInfo.count > 0 && (
                                    <span className="text-xs opacity-75">({materialsInfo.count})</span>
                                )}
                            </button>
                        )}

                        {status === 'Cancelled' && (
                            <button
                                onClick={() => handleUpdateStatus('Scheduled')}
                                disabled={loading}
                                className="col-span-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">restore</span>
                                Tekrar Aktif Et
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Completion Confirmation Dialog */}
            {showCompleteConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                        <h3 className="text-center text-lg font-bold text-slate-900 mb-2">
                            Randevuyu Tamamla
                        </h3>

                        {appointmentMaterials.length > 0 ? (
                            <>
                                <p className="text-center text-slate-500 text-sm mb-4">
                                    Bu hizmeti tamamladığınızda aşağıdaki malzemeler otomatik olarak envanterden düşülecektir:
                                </p>
                                <div className="bg-slate-50 rounded-xl p-3 mb-4 max-h-48 overflow-y-auto">
                                    {appointmentMaterials.map(material => (
                                        <div key={material.id} className="flex items-center justify-between py-1.5 text-sm">
                                            <span className="text-slate-700">{material.item_name_snapshot}</span>
                                            <span className="font-bold text-slate-900">
                                                x{Math.ceil(material.quantity_used)} {material.inventory?.unit || 'adet'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-slate-500 text-sm mb-4">
                                Bu randevuyu tamamlamak istediğinizden emin misiniz?
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCompleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <ButtonSpinner />}
                                Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
