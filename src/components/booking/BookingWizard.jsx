import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import ClientSelection from './ClientSelection';
import ServiceSelection from './ServiceSelection';
import DateTimeSelection from './DateTimeSelection';
import BookingSummary from './BookingSummary';

export default function BookingWizard() {
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState({
        client: null,
        service: null,
        date: null,
        time: null
    });

    const handleNext = (newData) => {
        // If coming from step 3 (DateTime), allow destructuring
        setData(prev => ({ ...prev, ...newData }));
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (step === 1) navigate(-1);
        else setStep(prev => prev - 1);
    };

    const handleConfirm = async () => {
        if (!data.client || !data.service || !data.time) return;

        setIsSubmitting(true);
        try {
            // Convert time (e.g., "09:00 AM") to 24h format for DB TIME column

            const { error } = await supabase.from('appointments').insert([
                {
                    client_id: data.client.id,
                    service_id: data.service.id,
                    service_name: data.service.name,
                    date: data.date, // Use selected date
                    time: convertTo24Hour(data.time),
                    status: 'Scheduled'
                }
            ]);

            if (error) throw error;

            success('Appointment booked successfully!');
            // Redirect to the SPECIFIC DATE of the booking
            navigate(`/schedule?date=${data.date}`);
        } catch (err) {
            console.error('Booking failed:', err);
            toastError(`Failed to book appointment: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const convertTo24Hour = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        return `${hours}:${minutes}:00`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-background-light flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900 leading-none">New Appointment</h1>
                    <p className="text-xs text-slate-500 font-medium">Step {step} of 4</p>
                </div>
                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 pb-safe">
                {step === 1 && <ClientSelection onSelect={(client) => handleNext({ client })} />}
                {step === 2 && <ServiceSelection onSelect={(service) => handleNext({ service })} />}
                {step === 3 && <DateTimeSelection onSelect={(dateTime) => handleNext(dateTime)} />}
                {step === 4 && (
                    isSubmitting ?
                        <div className="flex flex-col items-center justify-center h-full">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
                            <p className="font-bold text-slate-500">Confirming Appointment...</p>
                        </div> :
                        <BookingSummary data={data} onConfirm={handleConfirm} />
                )}
            </div>
        </div>
    );
}
