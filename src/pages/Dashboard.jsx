import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getLocalISOString } from '../utils/dateUtils';
import CalendarStrip from '../components/CalendarStrip';
import DatePickerTrigger from '../components/DatePickerTrigger';
import TimelineItem from '../components/TimelineItem';
import AppointmentModal from '../components/schedule/AppointmentModal';
import QuickAppointmentModal from '../components/schedule/QuickAppointmentModal';
import MonthView from '../components/schedule/MonthView';
import DraggableAppointment from '../components/schedule/DraggableAppointment';
import DroppableTimeSlot from '../components/schedule/DroppableTimeSlot';
import HourBlock from '../components/schedule/HourBlock';

// DnD Imports
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useToast } from '../context/ToastContext';
import ActionCenter from '../components/ActionCenter';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/logger';
import UpcomingSidebar from '../components/schedule/UpcomingSidebar';

export default function Dashboard() {
    const [searchParams] = useSearchParams();
    const [upcoming, setUpcoming] = useState([]);
    const { success, error: showError } = useToast();

    // Welcome Header Logic
    const { user, profile, clinic, role } = useAuth();
    const userName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Doctor';

    const [view, setView] = useState('day'); // 'day', 'month'
    const [selectedDate, setSelectedDate] = useState(() => {
        const dateParam = searchParams.get('date');
        if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            return dateParam;
        }
        return getLocalISOString();
    });

    // Staff Filtering Logic (Admin/Doctor Only)
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(user?.id); // Default to current user

    useEffect(() => {
        if (role === 'admin' || role === 'doctor' || role === 'owner') {
            const fetchStaff = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .order('full_name');

                if (error) {
                    console.error('Error fetching staff for filter:', error);
                }
                if (data) setStaffList(data);
            };
            fetchStaff();
        }
    }, [role]);

    // Update selectedStaffId if user.id changes (initial load)
    useEffect(() => {
        if (user?.id && !staffList.length) {
            // If we haven't loaded staff list yet or are just a normal staff, ensure we settle on user.id
            setSelectedStaffId(user.id);
        }
    }, [user?.id, staffList.length]);


    const [rawAppointments, setRawAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [selectedTimeForQuickAdd, setSelectedTimeForQuickAdd] = useState(null); // Add state

    // Schedule Settings
    const [showBookedOnly, setShowBookedOnly] = useState(false);
    const timeSlotInterval = 15; // Set to 15min as requested

    // DnD Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Reduced from 250ms for faster activation
                tolerance: 5 // Movement during delay cancels activation (prevents scrolling being mistaken for drag)
            }
        })
    );

    const fetchUpcoming = useCallback(async () => {
        const today = getLocalISOString();
        // Simple logic: Get next 5 appointments from today onwards
        let query = supabase
            .from('appointments')
            .select(`
                id, client_id, date, time, status,
                clients (first_name, last_name, image_url),
                services (name)
            `)
            .gte('date', today)
            .neq('status', 'Cancelled')
            .order('date', { ascending: true })
            .order('time', { ascending: true })
            .limit(5);

        // Filter upcoming by staff if selected (and not 'all')
        if (selectedStaffId && selectedStaffId !== 'all') {
            query = query.eq('staff_id', selectedStaffId);
        }

        const { data } = await query;

        if (data) {
            setUpcoming(data.map(apt => ({
                ...apt,
                clients: Array.isArray(apt.clients) ? apt.clients[0] : apt.clients,
                services: Array.isArray(apt.services) ? apt.services[0] : apt.services
            })));
        }
    }, [selectedStaffId]);

    const fetchAppointments = useCallback(async (retryCount = 0) => {
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {

            // Timeout promise - Increase to 15s for slow connections
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            // Execute complex fetch logic
            const performFetch = async () => {
                let query = supabase
                    .from('appointments')
                    .select(`
                        *,
                        services ( * ),
                        clients ( id, first_name, last_name, image_url, phone )
                    `)
                    .order('date', { ascending: true }) // Also order by date for monthly view
                    .order('time', { ascending: true });

                // Date Filter
                if (view === 'day') {
                    query = query.eq('date', selectedDate);
                } else {
                    const [year, month] = selectedDate.split('-');
                    const startDate = `${year}-${month}-01`;
                    const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                    const endDate = `${year}-${month}-${lastDayOfMonth}`;
                    query = query.gte('date', startDate).lte('date', endDate);
                }

                // Staff Filter
                if (selectedStaffId && selectedStaffId !== 'all') {
                    query = query.eq('staff_id', selectedStaffId);
                }

                const { data, error } = await query;
                if (error) throw error;

                return (data || []).map(apt => ({
                    ...apt,
                    clients: Array.isArray(apt.clients) ? apt.clients[0] : apt.clients,
                    services: Array.isArray(apt.services) ? apt.services[0] : apt.services
                }));
            };

            // Race against timeout
            const mergedData = await Promise.race([performFetch(), timeoutPromise]);

            setRawAppointments(mergedData);
            fetchUpcoming();
        } catch (error) {
            console.error('Critical error loading dashboard:', error);

            const isNetworkError = error.message === 'TIMEOUT' || error.message?.includes('fetch');
            if (isNetworkError && retryCount < 2) {
                console.warn(`Retry attempt ${retryCount + 1} for dashboard...`);
                return fetchAppointments(retryCount + 1);
            }
            showError('Failed to load appointments. Network unstable.');
        } finally {
            setLoading(false);
        }
    }, [view, selectedDate, selectedStaffId, fetchUpcoming, showError]);

    // Fetch appointments when dependencies change (the callback itself updates when its deps change)
    useEffect(() => {
        fetchAppointments();
        fetchUpcoming();
    }, [fetchAppointments, fetchUpcoming]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('dashboard_appointments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments'
                },
                () => {
                    // Refresh on any change
                    fetchAppointments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAppointments]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const newTime = over.id;

            if (newTime.startsWith('hour-block-')) {
                return;
            }

            const appointment = active.data.current;

            // Check for overlap
            // Calculate new start/end
            const [newH, newM] = newTime.split(':').map(Number);
            const newStartMin = newH * 60 + newM;
            const newDuration = appointment?.services?.duration_min || 30;
            const newEndMin = newStartMin + newDuration;

            // Check for overlap
            const isOccupied = dayViewAppointments.some(apt => {
                // Ignore self, cancelled, AND completed appointments (as requested)
                if (apt.id === appointment.id || apt.status === 'Cancelled' || apt.status === 'Completed' || !apt.time) return false;

                const [h, m] = apt.time.split(':').map(Number);
                const aptStartMin = h * 60 + m;
                const aptDuration = apt.services?.duration_min || 30;
                const aptEndMin = aptStartMin + aptDuration;

                return newStartMin < aptEndMin && newEndMin > aptStartMin;
            });

            if (isOccupied) {
                showError('Bu saat dilimi zaten dolu');
                return;
            }

            // Optimistic UI Update
            const updatedList = rawAppointments.map(apt =>
                apt.id === appointment.id ? { ...apt, time: newTime } : apt
            );
            setRawAppointments(updatedList);

            try {
                const { error } = await supabase
                    .from('appointments')
                    .update({ time: newTime })
                    .eq('id', appointment.id);

                if (error) throw error;
                success(`${newTime} saatine ertelendi`);

                // Log Activity
                await logActivity('Randevu Ertelendi', {
                    appointment_id: appointment.id,
                    old_time: appointment.time,
                    new_time: newTime,
                    date: appointment.date
                });

                fetchAppointments(); // Sync upcoming automatically
            } catch (error) {
                console.error('Reschedule error:', error);
                showError('Erteleme başarısız');
                fetchAppointments(); // Revert on error
            }
        }
    };

    // Derived State based on View and Date
    const displayAppointments = rawAppointments.filter(apt => {
        if (view === 'month') {
            const aptDate = new Date(apt.date);
            const selDate = new Date(selectedDate);
            return aptDate.getMonth() === selDate.getMonth() && aptDate.getFullYear() === selDate.getFullYear();
        }
        return String(apt.date).trim() === String(selectedDate).trim();
    });

    const dayViewAppointments = displayAppointments.filter(apt => String(apt.date).trim() === String(selectedDate).trim());

    // Generate Hours 09:00 to 19:00 (Dynamic based on Clinic Settings)
    const hours = useMemo(() => {
        let startMinutes = 9 * 60; // Default 09:00
        const config = clinic?.settings_config || {};

        if (config.working_start_hour) {
            const [h, m] = config.working_start_hour.split(':').map(Number);
            startMinutes = h * 60 + (m || 0);
        }

        let closingMinutes = 19 * 60; // Default 19:00
        if (config.working_end_hour) {
            const [h, m] = config.working_end_hour.split(':').map(Number);
            closingMinutes = h * 60 + (m || 0);
        }

        const generated = [];
        for (let m = startMinutes; m <= closingMinutes; m += timeSlotInterval) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            const timeStr = `${h < 10 ? '0' : ''}${h}:${min === 0 ? '00' : (min < 10 ? '0' + min : min)}`;
            generated.push(timeStr);
        }
        return generated;
    }, [clinic, timeSlotInterval]);

    // Filter "Booked Only"
    const displayedHours = useMemo(() => {
        if (!showBookedOnly) return hours;

        return hours.filter(hour => {
            const hourMinutes = parseInt(hour.split(':')[0]) * 60 + parseInt(hour.split(':')[1]);
            const nextHourMinutes = hourMinutes + timeSlotInterval;

            return dayViewAppointments.some(a => {
                if (!a.time || a.status === 'Cancelled') return false;
                const [h, m] = a.time.split(':').map(Number);
                const aptTotal = h * 60 + m;
                // Loose check: Does appointment start within this slot?
                // Or simply simplistic match for now: does appointment time fall in range
                return aptTotal >= hourMinutes && aptTotal < nextHourMinutes;
            });
        });
    }, [hours, showBookedOnly, dayViewAppointments, timeSlotInterval]);

    const formatTime = (timeStr) => {
        if (!timeStr) return { time: '00:00', ampm: 'AM' };
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return { time: `${hour12}:${m}`, ampm };
    };

    return (
        <div className="pb-24">
            {/* Welcome Header */}
            <div className="px-5 pt-8 pb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Günaydın, {userName}</h1>
                <p className="text-slate-500 font-medium">Bugünkü programınız burada.</p>
            </div>

            {/* Action Center - Smart Assistant */}
            <div className="px-5 pt-4">
                <ActionCenter />
            </div>

            <div className="lg:flex lg:gap-6 lg:items-start relative">
                {/* LEFT: Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Header / Controls */}
                    <div className="flex flex-col gap-4 px-5 pt-4 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                {/* View Switcher */}
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setView('day')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Gün
                                    </button>
                                    <button
                                        onClick={() => setView('month')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Ay
                                    </button>
                                </div>

                                {/* Staff Filter (Admin/Doctor Only) */}
                                {staffList.length > 0 && (
                                    <div className="relative">
                                        <select
                                            value={selectedStaffId}
                                            onChange={(e) => setSelectedStaffId(e.target.value)}
                                            className="px-4 py-1.5 pl-3 pr-8 text-sm font-bold rounded-xl bg-slate-100 text-slate-700 border-none outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                                        >
                                            <option value="all">Tüm Doktorlar</option>
                                            {staffList.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.full_name || 'İsimsiz Personel'}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 pointer-events-none text-[18px]">expand_more</span>
                                    </div>
                                )}

                                {/* Booked Only Toggle */}
                                {view === 'day' && (
                                    <button
                                        onClick={() => setShowBookedOnly(!showBookedOnly)}
                                        className={`hidden sm:flex px-3 py-1.5 text-xs font-bold rounded-lg transition-all items-center gap-1 ${showBookedOnly ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                                        title="Sadece Dolu Slotları Göster"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{showBookedOnly ? 'filter_alt' : 'filter_alt_off'}</span>
                                        {showBookedOnly ? 'Sadece Dolu' : 'Tüm Saatler'}
                                    </button>
                                )}
                            </div>

                            <div className="pt-1 flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedDate(getLocalISOString())}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">today</span>
                                    <span className="hidden sm:inline">Bugün</span>
                                </button>
                                <DatePickerTrigger selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                            </div>
                        </div>

                        {view === 'day' && (
                            <div className="w-full overflow-hidden">
                                <div className="px-6 pb-2 text-lg font-bold text-slate-800 capitalize">
                                    {new Date(selectedDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                </div>
                                <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                            </div>
                        )}
                    </div>

                    {loading && rawAppointments.length === 0 ? (
                        <div className="px-5 py-4 space-y-6 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-4 w-8 bg-slate-200 rounded"></div>
                                    <div className="h-32 w-full bg-slate-100 rounded-[20px]"></div>
                                </div>
                            ))}
                        </div>
                    ) : view === 'month' ? (
                        <div className="px-5 mt-2 animate-in fade-in slide-in-from-bottom-4">
                            <MonthView
                                currentDate={selectedDate}
                                appointments={displayAppointments}
                                onSelectDate={(date) => {
                                    setSelectedDate(date);
                                    setView('day');
                                }}
                            />
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={() => setIsQuickAddOpen(true)}
                                    className="bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Randevu Ekle
                                </button>
                            </div>
                        </div>
                    ) : (
                        // DAY VIEW (Grid + DnD)
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="px-5 mt-4 flex flex-col gap-4 pb-20">
                                {displayedHours.length === 0 && showBookedOnly && (
                                    <div className="py-12 text-center text-slate-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                                        <p>Bugün için randevu yok.</p>
                                        <button onClick={() => setShowBookedOnly(false)} className="text-primary font-bold mt-2 hover:underline">Tüm Saatleri Göster</button>
                                    </div>
                                )}

                                {(() => {
                                    // 1. Group slots by hour
                                    const hoursMap = new Map();
                                    displayedHours.forEach(time => {
                                        const h = time.split(':')[0];
                                        if (!hoursMap.has(h)) hoursMap.set(h, []);
                                        hoursMap.get(h).push(time);
                                    });

                                    // 2. Pre-calculate appointment map for O(1) lookup
                                    // Map Key: "HH:MM" -> Array of appointments starting in this slot
                                    const appointmentLookup = new Map();
                                    dayViewAppointments.forEach(apt => {
                                        if (!apt.time || apt.status === 'Cancelled') return;

                                        // We need to find which "interval" this appointment falls into
                                        // Assuming appointments snap to grid, but even if not:
                                        const [h, m] = apt.time.split(':').map(Number);
                                        const totalMin = h * 60 + m;

                                        // Find generic slot floor
                                        const slotMin = Math.floor(totalMin / timeSlotInterval) * timeSlotInterval;
                                        const slotH = Math.floor(slotMin / 60);
                                        const slotM = slotMin % 60;
                                        const slotKey = `${slotH < 10 ? '0' : ''}${slotH}:${slotM === 0 ? '00' : (slotM < 10 ? '0' + slotM : slotM)}`;

                                        if (!appointmentLookup.has(slotKey)) appointmentLookup.set(slotKey, []);
                                        appointmentLookup.get(slotKey).push(apt);
                                    });

                                    return Array.from(hoursMap.entries()).map(([hourStr, slots]) => {
                                        // Check if this block has appointments (O(1) lookup per slot)
                                        const hasAppointments = slots.some(slotTime => appointmentLookup.has(slotTime));

                                        return (
                                            <HourBlock key={hourStr} hourStr={hourStr} hasAppointments={hasAppointments}>
                                                {slots.map(slotTime => {
                                                    const slotAppointments = appointmentLookup.get(slotTime) || [];

                                                    return (
                                                        <DroppableTimeSlot key={slotTime} time={slotTime}>
                                                            {slotAppointments.length > 0 ? (
                                                                <div className="flex flex-col gap-2 h-full">
                                                                    {slotAppointments.map(apt => (
                                                                        <DraggableAppointment key={apt.id} appointment={apt}>
                                                                            <div onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}>
                                                                                <TimelineItem
                                                                                    time={formatTime(apt.time).time}
                                                                                    ampm={formatTime(apt.time).ampm}
                                                                                    patientName={apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : 'Unknown Client'}
                                                                                    treatment={apt.service_name}
                                                                                    status={apt.status?.toLowerCase() || 'scheduled'}
                                                                                    image={apt.clients?.image_url}
                                                                                    duration={apt.services?.duration_min} // Pass duration
                                                                                    notes={apt.notes} // Pass notes
                                                                                />
                                                                            </div>
                                                                        </DraggableAppointment>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    onClick={() => {
                                                                        setSelectedTimeForQuickAdd(slotTime); // Set time
                                                                        setIsQuickAddOpen(true);
                                                                    }}
                                                                    className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                                                >
                                                                    <span className="material-symbols-outlined text-slate-300 text-sm">add</span>
                                                                </div>
                                                            )}
                                                        </DroppableTimeSlot>
                                                    );
                                                })}
                                            </HourBlock>
                                        );
                                    });
                                })()}
                            </div>
                        </DndContext>
                    )}

                </div>

                {/* RIGHT: Upcoming Sidebar (Desktop Only) */}
                <div className="hidden lg:block w-80 shrink-0 pr-5 pt-4">
                    <UpcomingSidebar appointments={upcoming} />
                </div>
            </div>

            {/* Modals */}
            <AppointmentModal
                appointment={selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                onUpdate={fetchAppointments}
            />

            <QuickAppointmentModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onSuccess={fetchAppointments}
                preselectedDate={selectedDate}
                preselectedTime={selectedTimeForQuickAdd} // Pass prop
                preselectedStaffId={selectedStaffId === 'all' ? user?.id : selectedStaffId}
                canAssignStaff={role === 'admin' || role === 'doctor' || role === 'owner'}
                staffList={staffList}
            />
        </div>
    );
}
