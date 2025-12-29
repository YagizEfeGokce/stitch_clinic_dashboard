import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/logger';

export default function ServiceModal({ isOpen, onClose, onSuccess, service }) {
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        duration_min: 30,
        price: '',
        description: ''
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                duration_min: service.duration_min || 30,
                price: service.price || '',
                description: service.description || ''
            });
        } else {
            setFormData({
                name: '',
                duration_min: 30,
                price: '',
                description: ''
            });
        }
    }, [service, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (service) {
                // Edit Mode
                const { error } = await supabase
                    .from('services')
                    .update({
                        name: formData.name,
                        duration_min: parseInt(formData.duration_min),
                        price: parseFloat(formData.price),
                        description: formData.description
                    })
                    .eq('id', service.id);
                if (error) throw error;

                await logActivity('Updated Service', {
                    service_name: formData.name,
                    service_id: service.id,
                    changes: Object.keys(formData).filter(k => formData[k] !== service[k])
                });

                success('Service updated successfully');
            } else {
                // Create Mode
                const { data, error } = await supabase
                    .from('services')
                    .insert([{
                        name: formData.name,
                        duration_min: parseInt(formData.duration_min),
                        price: parseFloat(formData.price),
                        description: formData.description
                    }])
                    .select(); // Get id
                if (error) throw error;

                await logActivity('Created Service', {
                    service_name: formData.name,
                    service_id: data?.[0]?.id
                });

                success('Service created successfully');
            }


            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving service:', error);
            showError('Failed to save service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">{service ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Hizmet Adı</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            placeholder="örn. Kimyasal Peeling"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Süre (dk)</label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={formData.duration_min}
                                onChange={e => setFormData({ ...formData, duration_min: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                        <textarea
                            rows="2"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            placeholder="Tedavi hakkında kısa bilgi..."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {service ? 'Değişiklikleri Kaydet' : 'Hizmeti Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
