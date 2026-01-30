import { useState, useEffect, useCallback } from 'react';
import { serviceMaterialsAPI, inventoryAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ButtonSpinner } from '../ui/Spinner';

/**
 * ServiceMaterialsManager - Configure default materials for a service
 * Used within ServiceModal to define what inventory items are used per service
 */
export default function ServiceMaterialsManager({ serviceId, isOpen }) {
    const { clinic } = useAuth();
    const { success, error: showError } = useToast();

    const [materials, setMaterials] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    // Form state for adding new material
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Fetch materials for this service
    const fetchMaterials = useCallback(async () => {
        if (!serviceId) return;

        setLoading(true);
        try {
            const { data, error } = await serviceMaterialsAPI.getServiceMaterials(serviceId);
            if (error) {
                showError(error);
                return;
            }
            setMaterials(data || []);
        } catch (err) {
            console.error('Error fetching service materials:', err);
        } finally {
            setLoading(false);
        }
    }, [serviceId, showError]);

    // Fetch available inventory items
    const fetchInventory = useCallback(async () => {
        if (!clinic?.id) return;

        try {
            const { data, error } = await inventoryAPI.getInventory(clinic.id);
            if (error) {
                console.error('Error fetching inventory:', error);
                return;
            }
            setInventoryItems(data || []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    }, [clinic?.id]);

    useEffect(() => {
        if (isOpen && serviceId) {
            fetchMaterials();
            fetchInventory();
        }
    }, [isOpen, serviceId, fetchMaterials, fetchInventory]);

    // Filter out already added items
    const availableItems = inventoryItems.filter(
        item => !materials.some(m => m.inventory_item_id === item.id)
    );

    const handleAddMaterial = async () => {
        if (!selectedItemId || quantity <= 0) {
            showError('Lütfen bir ürün seçin ve miktar girin');
            return;
        }

        setAdding(true);
        try {
            const { data, error } = await serviceMaterialsAPI.addServiceMaterial(
                serviceId,
                selectedItemId,
                quantity
            );

            if (error) {
                showError(error);
                return;
            }

            setMaterials(prev => [...prev, data]);
            setShowAddForm(false);
            setSelectedItemId('');
            setQuantity(1);
            success('Malzeme eklendi');
        } catch (err) {
            console.error('Error adding material:', err);
            showError('Malzeme eklenirken bir hata oluştu');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMaterial = async (id) => {
        try {
            const { error } = await serviceMaterialsAPI.deleteServiceMaterial(id);
            if (error) {
                showError(error);
                return;
            }
            setMaterials(prev => prev.filter(m => m.id !== id));
            success('Malzeme kaldırıldı');
        } catch (err) {
            console.error('Error removing material:', err);
            showError('Malzeme kaldırılırken bir hata oluştu');
        }
    };

    const handleUpdateQuantity = async (id, newQuantity) => {
        if (newQuantity <= 0) return;

        try {
            const { data, error } = await serviceMaterialsAPI.updateServiceMaterial(id, newQuantity);
            if (error) {
                showError(error);
                return;
            }
            setMaterials(prev => prev.map(m => m.id === id ? data : m));
        } catch (err) {
            console.error('Error updating quantity:', err);
        }
    };

    // Don't render if no service selected (new service mode)
    if (!serviceId) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 text-center">
                    Malzeme eklemek için önce hizmeti kaydedin
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                    <h3 className="font-bold text-slate-900">Kullanılan Malzemeler</h3>
                    {materials.length > 0 && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {materials.length}
                        </span>
                    )}
                </div>
                {!showAddForm && availableItems.length > 0 && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Ekle
                    </button>
                )}
            </div>

            {/* Materials List */}
            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <ButtonSpinner />
                    <span className="ml-2 text-sm text-slate-500">Yükleniyor...</span>
                </div>
            ) : materials.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">inventory_2</span>
                    <p className="text-sm text-slate-500">
                        Bu hizmette kullanılan malzeme tanımlanmamış
                    </p>
                    {availableItems.length > 0 && !showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-3 text-sm font-bold text-primary hover:text-primary-dark"
                        >
                            Malzeme Ekle
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {materials.map(material => (
                        <div
                            key={material.id}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400">package_2</span>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {material.inventory?.name || 'Silinmiş Ürün'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Stok: {material.inventory?.stock ?? 0} {material.inventory?.unit || 'adet'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1">
                                    <button
                                        onClick={() => handleUpdateQuantity(material.id, Number(material.quantity_per_service) - 1)}
                                        disabled={material.quantity_per_service <= 1}
                                        className="size-6 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">remove</span>
                                    </button>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={material.quantity_per_service}
                                        onChange={(e) => handleUpdateQuantity(material.id, Number(e.target.value))}
                                        className="w-12 text-center font-bold text-slate-900 bg-transparent border-none focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleUpdateQuantity(material.id, Number(material.quantity_per_service) + 1)}
                                        className="size-6 flex items-center justify-center rounded hover:bg-slate-200"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleRemoveMaterial(material.id)}
                                    className="size-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    title="Kaldır"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Material Form */}
            {showAddForm && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Yeni Malzeme Ekle</span>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedItemId('');
                                setQuantity(1);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <select
                                value={selectedItemId}
                                onChange={(e) => setSelectedItemId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                            >
                                <option value="">Ürün seçin...</option>
                                {availableItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.stock} {item.unit || 'adet'})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                placeholder="Miktar"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium text-center"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddMaterial}
                        disabled={adding || !selectedItemId}
                        className="w-full py-2.5 rounded-xl bg-primary text-white font-bold shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {adding && <ButtonSpinner />}
                        Malzeme Ekle
                    </button>
                </div>
            )}

            {/* Info text */}
            <p className="text-xs text-slate-400">
                Bu hizmet tamamlandığında yukarıdaki malzemeler otomatik olarak envanterden düşülecektir.
            </p>
        </div>
    );
}
