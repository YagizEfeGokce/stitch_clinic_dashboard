import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Spinner } from '../ui/Spinner';
import { User, Check, Clock, AlertCircle } from 'lucide-react';

/**
 * StaffSelector - Reusable component for selecting staff with availability checking
 * 
 * @param {string} clinicId - Clinic ID
 * @param {string} selectedDate - Selected date (YYYY-MM-DD)
 * @param {string} selectedTime - Selected time (HH:MM)
 * @param {number} duration - Service duration in minutes
 * @param {string|null} value - Selected staff ID (null = no preference)
 * @param {function} onChange - Callback when selection changes
 * @param {boolean} allowNoPreference - Show "Fark Etmez" option
 * @param {boolean} showUnavailable - Show unavailable staff (grayed out)
 */
export default function StaffSelector({
    clinicId,
    selectedDate,
    selectedTime,
    duration = 30,
    value,
    onChange,
    allowNoPreference = true,
    showUnavailable = true
}) {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clinicId && selectedDate && selectedTime) {
            fetchAvailableStaff();
        }
    }, [clinicId, selectedDate, selectedTime, duration]);

    async function fetchAvailableStaff() {
        setLoading(true);
        setError(null);

        try {
            // Try RPC function first (more accurate)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_staff', {
                p_clinic_id: clinicId,
                p_date: selectedDate,
                p_time: selectedTime + ':00',
                p_duration_min: duration
            });

            if (!rpcError && rpcData) {
                setStaff(rpcData);
                return;
            }

            // Fallback: Simple query if RPC not available
            console.warn('[StaffSelector] RPC failed, using fallback:', rpcError);

            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, role, avatar_url')
                .eq('clinic_id', clinicId)
                .in('role', ['doctor', 'staff', 'owner', 'admin']);

            if (profileError) throw profileError;

            // Mark all as available in fallback mode (no complex checking)
            const fallbackStaff = (profiles || []).map(p => ({
                staff_id: p.id,
                full_name: p.full_name,
                role: p.role,
                avatar_url: p.avatar_url,
                is_available: true,
                unavailable_reason: 'Müsait'
            }));

            setStaff(fallbackStaff);

        } catch (err) {
            console.error('[StaffSelector] Error:', err);
            setError('Personel listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    }

    // Filter staff based on showUnavailable
    const displayStaff = showUnavailable
        ? staff
        : staff.filter(s => s.is_available);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
                <span className="ml-3 text-slate-500 font-medium">Personel yükleniyor...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle size={20} className="mr-2" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* No Preference Option */}
            {allowNoPreference && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${value === null
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">Fark Etmez</div>
                                <div className="text-sm text-slate-500">Müsait personel otomatik atanır</div>
                            </div>
                        </div>
                        {value === null && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                </button>
            )}

            {/* Staff List */}
            {displayStaff.length === 0 && !allowNoPreference && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Bu saat için müsait personel yok</p>
                    <p className="text-slate-400 text-sm mt-1">Farklı saat seçmeyi deneyin</p>
                </div>
            )}

            {displayStaff.map((member) => (
                <button
                    key={member.staff_id}
                    type="button"
                    onClick={() => member.is_available && onChange(member.staff_id)}
                    disabled={!member.is_available}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${value === member.staff_id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : member.is_available
                                ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            {member.avatar_url ? (
                                <img
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${member.is_available ? 'bg-primary/10' : 'bg-slate-100'
                                    }`}>
                                    <User className={`w-6 h-6 ${member.is_available ? 'text-primary' : 'text-slate-400'
                                        }`} />
                                </div>
                            )}

                            {/* Info */}
                            <div>
                                <div className="font-bold text-slate-900">{member.full_name || 'İsimsiz Personel'}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-sm text-slate-500">
                                        {member.role === 'doctor' ? 'Hekim' :
                                            member.role === 'owner' ? 'Klinik Sahibi' :
                                                member.role === 'admin' ? 'Yönetici' : 'Personel'}
                                    </span>

                                    {/* Availability Badge */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${member.is_available
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {member.is_available ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Müsait
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={10} />
                                                {member.unavailable_reason}
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Selected Indicator */}
                        {value === member.staff_id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}
