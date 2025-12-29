import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
// import { useAuth } from '../../context/AuthContext';

import { checkWorkingHours } from '../../lib/availability';
import { logActivity } from '../../lib/logger';

export default function QuickAppointmentModal({
    isOpen,
    onClose,
    onSuccess,
    preselectedDate,
    preselectedTime, // Add this
    preselectedStaffId,
    canAssignStaff = false,
    staffList = []
}) {
    const { success, error: showError } = useToast();
    // const { profile } = useAuth(); // Unused
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);

    const [formData, setFormData] = useState({
        client_id: '',
        service_id: '',
        staff_id: '',
        date: preselectedDate || new Date().toISOString().split('T')[0],
        time: '09:00',
        notes: ''
    });

    const [ignoreConflict, setIgnoreConflict] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            setFormData(prev => ({
                ...prev,
                date: preselectedDate || prev.date,
                time: preselectedTime || '09:00', // Use prop
                staff_id: preselectedStaffId || ''
            }));
            setIgnoreConflict(false);
        }
    }, [isOpen, preselectedDate, preselectedTime, preselectedStaffId]);

    // Reset ignoreConflict if user changes booking details
    useEffect(() => {
        setIgnoreConflict(false);
    }, [formData.date, formData.time, formData.staff_id, formData.service_id]);

    const fetchOptions = async () => {
        const { data: clientsData } = await supabase.from('clients').select('id, first_name, last_name, phone').order('first_name');
        const { data: servicesData } = await supabase.from('services').select('id, name, duration_min, price').order('name');

        if (clientsData) setClients(clientsData);
        if (servicesData) setServices(servicesData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation 1: Past Date Check
            const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
            const now = new Date();
            if (selectedDateTime < now) {
                showError('Cannot schedule appointments in the past.');
                setLoading(false);
                return;
            }

            // Get current user (staff) - fallback if no staff_id selected
            const { data: { user } } = await supabase.auth.getUser();
            const targetStaffId = formData.staff_id || user?.id;

            if (!targetStaffId) throw new Error('No staff member assigned.');

            // Validation 2: Clinic & Staff Working Hours
            // Skip this if ignoring conflicts (maybe? or keep it strict? Strict for now, usually shifts are strict)
            const availabilityCheck = await checkWorkingHours(formData.date, formData.time, targetStaffId);
            if (!availabilityCheck.valid) {
                showError(availabilityCheck.message);
                setLoading(false);
                return;
            }

            // Find selected service
            const selectedService = services.find(s => s.id === formData.service_id);
            if (!selectedService) throw new Error('Service not found');

            // Validation 3: Conflict Check (Overlapping Appointments)
            if (!ignoreConflict) {
                // Fetch appointments for the same day (and same staff member)
                const { data: dayAppointments } = await supabase
                    .from('appointments')
                    .select('time, services(duration_min)')
                    .eq('date', formData.date)
                    .eq('staff_id', targetStaffId) // Check conflict for specific staff
                    .neq('status', 'Cancelled');

                if (dayAppointments) {
                    const newStart = selectedDateTime.getTime();
                    const newEnd = newStart + (selectedService.duration_min * 60000);

                    const hasConflict = dayAppointments.some(apt => {
                        const aptTime = new Date(`${formData.date}T${apt.time}`); // Local time assumption
                        const aptStart = aptTime.getTime();
                        // Fallback to 30 min if duration missing
                        const aptDuration = apt.services?.duration_min || 30;
                        const aptEnd = aptStart + (aptDuration * 60000);

                        // Check overlap: (StartA < EndB) and (EndA > StartB)
                        return newStart < aptEnd && newEnd > aptStart;
                    });

                    if (hasConflict) {
                        showError('Time slot occupied! Click "Force Schedule" to proceed anyway.');
                        setIgnoreConflict(true);
                        setLoading(false);
                        return;
                    }
                }
            }

            const payload = {
                client_id: formData.client_id,
                service_id: formData.service_id,
                staff_id: targetStaffId,
                // service_name: selectedService?.name, // Removed as per schema check
                date: formData.date,
                time: formData.time,
                status: 'Scheduled',
                notes: formData.notes
            };

            const { error: insertError } = await supabase
                .from('appointments')
                .insert([payload]);

            if (insertError) throw insertError;

            success('Appointment scheduled successfully');

            // Log Activity
            await logActivity('Created Appointment', {
                client_id: formData.client_id,
                service_id: formData.service_id,
                staff_id: targetStaffId,
                date: formData.date,
                time: formData.time
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating appointment:', err);
            showError('Failed to create appointment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">New Appointment</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Staff Selection (Admin/Doctor Only) */}
                    {canAssignStaff && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Assign to Staff</label>
                            <select
                                required
                                value={formData.staff_id}
                                onChange={e => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                            >
                                <option value="" disabled>Select Staff Member</option>
                                {staffList.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.full_name || 'Unnamed Staff'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Client</label>
                        <select
                            required
                            value={formData.client_id}
                            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                        >
                            <option value="" disabled>Select Client</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.first_name} {client.last_name} {client.phone ? `(${client.phone})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Service</label>
                        <select
                            required
                            value={formData.service_id}
                            onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                        >
                            <option value="" disabled>Select Service</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} ({service.duration_min} min) - ${service.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <textarea
                            rows="2"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                            placeholder="Special requests, allergies, etc."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${ignoreConflict
                                ? 'bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600'
                                : 'bg-primary text-white shadow-primary/25 hover:bg-primary-dark'
                                }`}
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {ignoreConflict ? 'Force Schedule' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
