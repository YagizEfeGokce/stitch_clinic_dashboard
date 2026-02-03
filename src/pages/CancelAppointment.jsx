import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';
import { Calendar, Clock, Stethoscope, Building2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Cancellation reason options (Turkish)
const CANCELLATION_REASONS = [
    { value: '', label: 'Seçiniz...' },
    { value: 'Kişisel sebep', label: 'Kişisel sebep' },
    { value: 'Sağlık sorunu', label: 'Sağlık sorunu' },
    { value: 'Randevu çakışması', label: 'Randevu çakışması' },
    { value: 'Diğer', label: 'Diğer' },
];

export default function CancelAppointment() {
    const { appointmentId, token } = useParams();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [error, setError] = useState(null);
    const [policyError, setPolicyError] = useState(null);

    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        fetchAppointment();
    }, [appointmentId, token]);

    async function fetchAppointment() {
        try {
            setLoading(true);
            setError(null);

            // Validate token and fetch appointment with related data
            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services:service_id (name, duration_min, price),
                    clinics:clinic_id (name, phone, settings_config)
                `)
                .eq('id', appointmentId)
                .eq('cancellation_token', token)
                .single();

            if (fetchError || !data) {
                setError('Geçersiz veya süresi dolmuş iptal linki. Lütfen kliniği arayın.');
                setLoading(false);
                return;
            }

            // Check if already cancelled
            if (data.status === 'Cancelled') {
                setError('Bu randevu zaten iptal edilmiş.');
                setLoading(false);
                return;
            }

            // Check if completed or no-show
            if (data.status === 'Completed' || data.status === 'NoShow') {
                setError('Bu randevu tamamlanmış veya geçmiş bir randevu.');
                setLoading(false);
                return;
            }

            // Check if token expired
            if (data.cancellation_token_expires_at && new Date(data.cancellation_token_expires_at) < new Date()) {
                setError('İptal linkinizin süresi dolmuş. Lütfen kliniği arayın.');
                setLoading(false);
                return;
            }

            // Check cancellation policy
            const policy = data.clinics?.settings_config?.cancellation_policy;
            if (policy?.allow_customer_cancellation === false) {
                setError('Bu klinik müşteri tarafından iptal kabul etmemektedir. Lütfen kliniği arayın.');
                setLoading(false);
                return;
            }

            // Check minimum hours before appointment
            if (policy?.min_hours_before) {
                const appointmentDateTime = new Date(`${data.date}T${data.time}`);
                const hoursUntil = (appointmentDateTime - new Date()) / (1000 * 60 * 60);

                if (hoursUntil < policy.min_hours_before) {
                    setPolicyError(`Randevunuzu en az ${policy.min_hours_before} saat önceden iptal etmelisiniz. Lütfen kliniği arayın.`);
                }
            }

            setAppointment(data);
        } catch (err) {
            console.error('Error fetching appointment:', err);
            setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!reason) {
            alert('Lütfen bir iptal nedeni seçin.');
            return;
        }

        if (!window.confirm('Randevunuzu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            return;
        }

        setCancelling(true);

        try {
            const finalReason = reason === 'Diğer' ? customReason || 'Diğer' : reason;

            // Update appointment status
            const { error: updateError } = await supabase
                .from('appointments')
                .update({
                    status: 'Cancelled',
                    cancellation_reason: finalReason,
                    // Expire the token after use
                    cancellation_token_expires_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .eq('cancellation_token', token);

            if (updateError) {
                throw updateError;
            }

            setCancelled(true);

            // TODO: Send email notification to customer and clinic
            // This would typically be done via an Edge Function or webhook

        } catch (err) {
            console.error('Cancellation error:', err);
            setError('İptal işlemi başarısız oldu. Lütfen kliniği arayın.');
        } finally {
            setCancelling(false);
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="xl" />
                    <p className="mt-4 text-slate-500 font-medium">Randevu bilgileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-3">İptal Edilemedi</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
    if (cancelled) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-3">Randevunuz İptal Edildi</h1>
                    <p className="text-slate-600 mb-2">
                        Randevunuz başarıyla iptal edilmiştir.
                    </p>
                    <p className="text-slate-500 text-sm mb-6">
                        İptal onayı e-posta adresinize gönderilecektir.
                    </p>
                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-slate-600">
                            Yeni bir randevu almak için lütfen kliniği arayın veya online randevu sistemini kullanın.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Main cancellation form
    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Randevu İptali</h1>
                    <p className="text-slate-500 mt-2">Randevunuzu iptal etmek için aşağıdaki formu doldurun.</p>
                </div>

                {/* Appointment Details Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Randevu Detayları
                    </h2>

                    <div className="space-y-4">
                        {/* Clinic */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Klinik</p>
                                <p className="text-slate-900 font-semibold">{appointment.clinics?.name || 'Klinik'}</p>
                            </div>
                        </div>

                        {/* Service */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Hizmet</p>
                                <p className="text-slate-900 font-semibold">{appointment.services?.name || appointment.service_name || 'Hizmet'}</p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Tarih</p>
                                    <p className="text-slate-900 font-semibold">
                                        {new Date(appointment.date).toLocaleDateString('tr-TR', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">Saat</p>
                                    <p className="text-slate-900 font-semibold">{appointment.time?.slice(0, 5)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policy Error Warning */}
                {policyError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-800 text-sm">{policyError}</p>
                    </div>
                )}

                {/* Cancellation Form */}
                {!policyError && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">İptal Nedeni</h2>

                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all mb-4"
                        >
                            {CANCELLATION_REASONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {reason === 'Diğer' && (
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Lütfen iptal nedeninizi açıklayın..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all resize-none"
                                rows={3}
                            />
                        )}
                    </div>
                )}

                {/* Warning Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-amber-800 text-sm font-semibold mb-1">Dikkat</p>
                            <p className="text-amber-700 text-sm">
                                Randevunuzu iptal ettiğinizde, bu işlem geri alınamaz.
                                Yeni bir randevu almak için kliniği aramanız gerekecektir.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cancel Button */}
                {!policyError && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling || !reason}
                        className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        {cancelling ? (
                            <>
                                <Spinner size="md" color="white" />
                                İptal Ediliyor...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-5 h-5" />
                                Randevuyu İptal Et
                            </>
                        )}
                    </button>
                )}

                {/* Contact Info */}
                {appointment.clinics?.phone && (
                    <div className="text-center mt-6">
                        <p className="text-slate-500 text-sm">
                            Sorunuz mu var? Kliniği arayın: {' '}
                            <a href={`tel:${appointment.clinics.phone}`} className="text-primary font-bold hover:underline">
                                {appointment.clinics.phone}
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
