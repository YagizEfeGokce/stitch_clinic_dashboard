import { useState, useEffect } from 'react';
import { supabasePublic } from '../lib/supabasePublic';

/**
 * Hook to fetch clinic data by slug for public booking pages
 * 
 * @param {string} clinicSlug - The unique slug of the clinic
 * @returns {{ clinic: object|null, services: array, loading: boolean, error: string|null }}
 */
export function useClinicBySlug(clinicSlug) {
    const [clinic, setClinic] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clinicSlug) {
            setError('Klinik bulunamadı');
            setLoading(false);
            return;
        }

        async function fetchClinicData() {
            try {
                setLoading(true);
                setError(null);

                if (!supabasePublic) {
                    throw new Error('Veritabanı bağlantısı kurulamadı');
                }

                // Fetch clinic by slug
                const { data: clinicData, error: clinicError } = await supabasePublic
                    .from('clinics')
                    .select('id, name, slug, logo_url, settings_config')
                    .eq('slug', clinicSlug.toLowerCase())
                    .single();

                if (clinicError) {
                    if (clinicError.code === 'PGRST116') {
                        throw new Error('Bu klinik bulunamadı');
                    }
                    throw new Error('Klinik bilgileri yüklenemedi');
                }

                setClinic(clinicData);

                // Fetch active services for this clinic
                const { data: servicesData, error: servicesError } = await supabasePublic
                    .from('services')
                    .select('id, name, description, duration_min, price, color')
                    .eq('clinic_id', clinicData.id)
                    .eq('active', true)
                    .order('display_order', { ascending: true });

                if (servicesError) {
                    console.error('[useClinicBySlug] Services error:', servicesError);
                    // Don't fail completely, just show empty services
                    setServices([]);
                } else {
                    setServices(servicesData || []);
                }

            } catch (err) {
                console.error('[useClinicBySlug] Error:', err);
                setError(err.message);
                setClinic(null);
                setServices([]);
            } finally {
                setLoading(false);
            }
        }

        fetchClinicData();
    }, [clinicSlug]);

    return { clinic, services, loading, error };
}
