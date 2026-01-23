import { useState, useEffect } from 'react';
import { servicesAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ServiceModal from '../services/ServiceModal';

export default function ServiceSelection({ onSelect }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Hooks
    const { user } = useAuth();
    const { error: showError } = useToast();

    const fetchServices = async () => {
        if (!user?.clinic_id) return;

        try {
            setLoading(true);
            const { data, error } = await servicesAPI.getServices(user.clinic_id);

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error:', error);
            showError('Hizmetler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [user?.clinic_id]);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Hizmet Seçimi</h2>

            <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
                {/* Add New Service Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer transition-all"
                >
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </div>
                    <span className="font-semibold">Yeni Hizmet Ekle</span>
                </button>

                {loading ? (
                    <p className="text-center text-slate-400 py-4">Hizmetler yükleniyor...</p>
                ) : services.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                        <span className="material-symbols-outlined text-3xl mb-2">spa</span>
                        <p>Hizmet bulunamadı.</p>
                    </div>
                ) : (
                    services.map(service => (
                        <div
                            key={service.id}
                            onClick={() => onSelect(service)}
                            className="flex items-center p-4 rounded-xl border border-slate-100 bg-white hover:border-primary hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all group"
                        >
                            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">spa</span>
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{service.name}</h3>
                                <p className="text-sm text-slate-500">{service.duration_min} dk • ₺{service.price}</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">add_circle</span>
                        </div>
                    )))}
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchServices}
            />
        </div>
    );
}
