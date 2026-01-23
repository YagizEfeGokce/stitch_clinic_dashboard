import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getLocalISOString } from '../utils/dateUtils';
import CalendarStrip from '../components/calendar/CalendarStrip';
import DatePickerTrigger from '../components/calendar/DatePickerTrigger';
import AppointmentModal from '../components/schedule/AppointmentModal';
import QuickAppointmentModal from '../components/schedule/QuickAppointmentModal';
import MonthView from '../components/schedule/MonthView';
import CompactTimeline from '../components/schedule/CompactTimeline';
import { useAppointments } from '../hooks/useAppointments';

import TimelineSkeleton from '../components/schedule/TimelineSkeleton';
import { PageErrorBoundary } from '../components/errors';

import { useToast } from '../context/ToastContext';
import ActionCenter from '../components/dashboard/ActionCenter';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/logger';
import UpcomingSidebar from '../components/schedule/UpcomingSidebar';

export default function Dashboard() {
    const [searchParams] = useSearchParams();
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
        if (role === 'admin' || role === 'doctor' || role === 'owner' || role === 'super_admin') {
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

    // --- REFACTORED: Hook Usage ---
    const {
        appointments: rawAppointments,
        upcoming,
        loading,
        refreshAppointments: fetchAppointments,
        setAppointments: setRawAppointments
    } = useAppointments(selectedDate, view, selectedStaffId);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);



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



    return (
        <PageErrorBoundary pageName="Takvim">
            {/* Welcome Header */}
            <div className="px-5 pt-8 pb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Hoş Geldiniz, {userName}
                </h1>
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
                        <div className="px-5 pt-4 space-y-2">
                            {[1, 2, 3].map(i => (
                                <TimelineSkeleton key={i} />
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
                        // DAY VIEW - Compact Timeline
                        <CompactTimeline
                            appointments={dayViewAppointments}
                            workingHours={{
                                start: clinic?.settings_config?.working_start_hour
                                    ? parseInt(clinic.settings_config.working_start_hour.split(':')[0])
                                    : 9,
                                end: clinic?.settings_config?.working_end_hour
                                    ? parseInt(clinic.settings_config.working_end_hour.split(':')[0])
                                    : 19
                            }}
                            onAppointmentClick={(apt) => setSelectedAppointment(apt)}
                            onAddClick={() => setIsQuickAddOpen(true)}
                            onStatusChange={fetchAppointments}
                            staffList={staffList}
                        />
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
                preselectedStaffId={selectedStaffId === 'all' ? user?.id : selectedStaffId}
                canAssignStaff={role === 'admin' || role === 'doctor' || role === 'owner' || role === 'super_admin'}
                staffList={staffList}
            />
        </PageErrorBoundary>
    );
}
