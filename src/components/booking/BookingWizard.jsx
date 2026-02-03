import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../ui/Spinner';
import ClientSelection from './ClientSelection';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import StaffSelector from './StaffSelector';
import BookingSummary from './BookingSummary';

const TOTAL_STEPS = 5;

export default function BookingWizard() {
    const navigate = useNavigate();
    const { clinic } = useAuth();
    const { success, error: toastError } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState({
        client: null,
        service: null,
        date: null,
        time: null,
        staffId: null // null = auto-assign
    });

    const handleNext = (newData) => {
        setData(prev => ({ ...prev, ...newData }));
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step === 1) navigate(-1);
        else setStep(prev => prev - 1);
    };

    const handleStaffSelect = (staffId) => {
        handleNext({ staffId });
    };

    const handleConfirm = async () => {
        if (!data.client || !data.service || !data.time) return;

        setIsSubmitting(true);
        try {
            // Determine staff ID (auto-assign if null)
            let finalStaffId = data.staffId;

            if (!finalStaffId && clinic?.id) {
                // Auto-assign: Get first available staff
                const { data: availableStaff } = await supabase.rpc('get_available_staff', {
                    p_clinic_id: clinic.id,
                    p_date: data.date,
                    p_time: convertTo24Hour(data.time),
                    p_duration_min: data.service.duration_min || 30
                });

                const firstAvailable = availableStaff?.find(s => s.is_available);
                if (firstAvailable) {
                    finalStaffId = firstAvailable.staff_id;
                }
            }

            const { error } = await supabase.from('appointments').insert([
                {
                    client_id: data.client.id,
                    service_id: data.service.id,
                    service_name: data.service.name,
                    staff_id: finalStaffId,
                    date: data.date,
                    time: convertTo24Hour(data.time),
                    status: 'Scheduled'
                }
            ]);

            if (error) throw error;

            success('Randevu başarıyla oluşturuldu!');
            navigate(`/schedule?date=${data.date}`);
        } catch (err) {
            console.error('Booking failed:', err);
            toastError(`Randevu oluşturulamadı: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const convertTo24Hour = (timeStr) => {
        // Check if already in 24h format (no AM/PM)
        if (!timeStr.includes(' ')) {
            return timeStr.includes(':') ? timeStr + ':00' : timeStr;
        }

        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        return `${hours}:${minutes}:00`;
    };

    // Step labels for staff selection
    const stepLabels = {
        1: 'Hasta Seç',
        2: 'Hizmet Seç',
        3: 'Tarih & Saat',
        4: 'Personel Seç',
        5: 'Onay'
    };

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900 leading-none">Yeni Randevu</h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Adım {step} / {TOTAL_STEPS} - {stepLabels[step]}
                    </p>
                </div>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-safe">
                {step === 1 && <ClientSelection onSelect={(client) => handleNext({ client })} />}
                {step === 2 && <ServiceSelection onSelect={(service) => handleNext({ service })} />}
                {step === 3 && <DateTimeSelection onSelect={(dateTime) => handleNext(dateTime)} />}
                {step === 4 && data.date && data.time && (
                    <div className="max-w-xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Personel Seçin</h2>
                        <StaffSelector
                            clinicId={clinic?.id}
                            selectedDate={data.date}
                            selectedTime={convertTo24Hour(data.time).slice(0, 5)}
                            duration={data.service?.duration_min || 30}
                            value={data.staffId}
                            onChange={handleStaffSelect}
                            allowNoPreference={true}
                        />
                    </div>
                )}
                {step === 5 && (
                    isSubmitting ?
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner size="xl" />
                            <p className="font-bold text-slate-500 mt-4">Randevu Onaylanıyor...</p>
                        </div> :
                        <BookingSummary data={data} onConfirm={handleConfirm} />
                )}
            </div>
        </div>
    );
}

