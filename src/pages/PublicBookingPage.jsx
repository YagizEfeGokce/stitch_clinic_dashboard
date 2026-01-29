import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClinicBySlug } from '../hooks/useClinicBySlug';
import { supabasePublic } from '../lib/supabasePublic';
import CalendarPicker from '../components/public/CalendarPicker';
import TimeSlotPicker from '../components/public/TimeSlotPicker';
import PhoneInput, { isValidTurkishPhone } from '../components/public/PhoneInput';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Calendar, Clock, User, Phone, FileText, Sparkles } from 'lucide-react';

/**
 * PublicBookingPage - Public-facing appointment booking page
 * 
 * Accessed via: /book/:clinicSlug or subdomain {clinicSlug}.dermdesk.com
 */
export default function PublicBookingPage() {
    const { clinicSlug } = useParams();
    const { clinic, services, loading, error } = useClinicBySlug(clinicSlug);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        serviceId: '',
        date: '',
        time: '',
        notes: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null); // { success: true/false, message, appointmentId }

    // Get selected service details
    const selectedService = services.find(s => s.id === formData.serviceId);

    // Validate form
    function validateForm() {
        const errors = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Ad Soyad gerekli';
        } else if (formData.fullName.trim().length < 3) {
            errors.fullName = 'Geçerli bir isim girin';
        }

        if (!formData.phone) {
            errors.phone = 'Telefon numarası gerekli';
        } else if (!isValidTurkishPhone(formData.phone)) {
            errors.phone = 'Geçerli bir telefon numarası girin';
        }

        if (!formData.serviceId) {
            errors.serviceId = 'Hizmet seçimi gerekli';
        }

        if (!formData.date) {
            errors.date = 'Tarih seçimi gerekli';
        }

        if (!formData.time) {
            errors.time = 'Saat seçimi gerekli';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;
        if (!clinic?.id) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            // 1. Upsert client by phone
            const { data: existingClients } = await supabasePublic
                .from('clients')
                .select('id')
                .eq('clinic_id', clinic.id)
                .eq('phone', formData.phone)
                .limit(1);

            let clientId;

            if (existingClients && existingClients.length > 0) {
                clientId = existingClients[0].id;
            } else {
                // Create new client
                const nameParts = formData.fullName.trim().split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                const { data: newClient, error: clientError } = await supabasePublic
                    .from('clients')
                    .insert({
                        clinic_id: clinic.id,
                        first_name: firstName,
                        last_name: lastName,
                        phone: formData.phone,
                        source: 'online_booking',
                        status: 'Lead'
                    })
                    .select('id')
                    .single();

                if (clientError) {
                    console.error('[PublicBookingPage] Client creation error:', clientError);
                    throw new Error('Müşteri kaydı oluşturulamadı');
                }

                clientId = newClient.id;
            }

            // 2. Create appointment
            const { data: appointment, error: appointmentError } = await supabasePublic
                .from('appointments')
                .insert({
                    clinic_id: clinic.id,
                    client_id: clientId,
                    service_id: formData.serviceId,
                    date: formData.date,
                    time: formData.time + ':00', // Add seconds for TIME type
                    status: 'Scheduled',
                    booking_source: 'online',
                    notes: formData.notes || null
                })
                .select('id')
                .single();

            if (appointmentError) {
                console.error('[PublicBookingPage] Appointment creation error:', appointmentError);
                throw new Error('Randevu oluşturulamadı. Lütfen tekrar deneyin.');
            }

            // Success!
            setSubmitResult({
                success: true,
                message: 'Randevunuz başarıyla oluşturuldu!',
                appointmentId: appointment.id,
                details: {
                    service: selectedService?.name,
                    date: format(parseISO(formData.date), 'd MMMM yyyy, EEEE', { locale: tr }),
                    time: formData.time
                }
            });

        } catch (err) {
            console.error('[PublicBookingPage] Submission error:', err);
            setSubmitResult({
                success: false,
                message: err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Reset form for new booking
    function handleNewBooking() {
        setFormData({
            fullName: '',
            phone: '',
            serviceId: '',
            date: '',
            time: '',
            notes: ''
        });
        setFormErrors({});
        setSubmitResult(null);
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-slate-500 mt-4 font-medium">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error state - clinic not found
    if (error || !clinic) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Klinik Bulunamadı</h1>
                    <p className="text-slate-500 mb-6">
                        {error || 'Bu adresteki klinik mevcut değil veya randevu almıyor.'}
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (submitResult?.success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Randevunuz Onaylandı!</h1>
                    <p className="text-slate-500 mb-6">
                        {clinic.name} için randevunuz başarıyla oluşturuldu.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-3">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-slate-800">{submitResult.details.service}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="text-slate-600">{submitResult.details.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="text-slate-600">{submitResult.details.time}</span>
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-6">
                        Randevunuza zamanında gelmenizi rica ederiz.
                    </p>

                    <button
                        onClick={handleNewBooking}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Yeni Randevu Oluştur
                    </button>
                </div>
            </div>
        );
    }

    // Main booking form
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        {clinic.logo_url ? (
                            <img
                                src={clinic.logo_url}
                                alt={clinic.name}
                                className="w-10 h-10 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div>
                            <h1 className="font-bold text-slate-900">{clinic.name}</h1>
                            <p className="text-xs text-slate-500">Online Randevu</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Error message */}
                    {submitResult && !submitResult.success && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <p className="text-sm font-medium">{submitResult.message}</p>
                        </div>
                    )}

                    {/* Personal Info Section */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Kişisel Bilgiler
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Ad Soyad *
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    placeholder="Adınız ve soyadınız"
                                    className={`w-full px-4 py-3 rounded-xl border text-base font-medium transition-all
                                        ${formErrors.fullName
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-slate-200 bg-white focus:border-primary focus:ring-primary/20'
                                        }
                                        focus:outline-none focus:ring-2
                                    `}
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Telefon *
                                </label>
                                <PhoneInput
                                    value={formData.phone}
                                    onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                                    error={formErrors.phone}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Service Selection */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Hizmet Seçimi *
                        </h2>

                        {services.length === 0 ? (
                            <p className="text-slate-400 text-sm">Henüz hizmet tanımlanmamış.</p>
                        ) : (
                            <div className="grid gap-2">
                                {services.map((service) => (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${formData.serviceId === service.id
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-800">{service.name}</p>
                                                {service.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                {service.price > 0 && (
                                                    <p className="font-bold text-primary">₺{service.price}</p>
                                                )}
                                                {service.duration_min && (
                                                    <p className="text-xs text-slate-400">{service.duration_min} dk</p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {formErrors.serviceId && (
                            <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.serviceId}</p>
                        )}
                    </section>

                    {/* Date Selection */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Tarih Seçimi *
                        </h2>

                        <CalendarPicker
                            selectedDate={formData.date}
                            onSelectDate={(date) => setFormData(prev => ({ ...prev, date, time: '' }))}
                            clinicSettings={clinic.settings_config}
                        />
                        {formErrors.date && (
                            <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.date}</p>
                        )}
                    </section>

                    {/* Time Selection */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Saat Seçimi *
                        </h2>

                        <TimeSlotPicker
                            clinicId={clinic.id}
                            serviceId={formData.serviceId}
                            selectedDate={formData.date}
                            selectedTime={formData.time}
                            onSelectTime={(time) => setFormData(prev => ({ ...prev, time }))}
                            clinicSettings={clinic.settings_config}
                        />
                        {formErrors.time && (
                            <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.time}</p>
                        )}
                    </section>

                    {/* Notes (Optional) */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Notlar (İsteğe Bağlı)
                        </h2>

                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Randevunuz hakkında eklemek istediğiniz notlar..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none text-base"
                        />
                    </section>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${isSubmitting
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-primary/30 active:scale-[0.98]'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                Randevu Oluşturuluyor...
                            </span>
                        ) : (
                            'Randevu Oluştur'
                        )}
                    </button>
                </form>
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-xs text-slate-400">
                <p>Powered by <span className="font-semibold text-primary">Dermdesk</span></p>
            </footer>
        </div>
    );
}
