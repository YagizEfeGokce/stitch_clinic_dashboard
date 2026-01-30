import { useState, useEffect, useCallback } from 'react';
import { appointmentMaterialsAPI, inventoryAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ButtonSpinner } from '../ui/Spinner';

/**
 * AppointmentMaterialsSection - Show/edit materials for a specific appointment
 * Displays materials that will be deducted when the appointment is completed
 */
export default function AppointmentMaterialsSection({
    appointmentId,
    serviceId,
    clinicId,
    isCompleted = false,
    onMaterialsChange
}) {
    const { clinic } = useAuth();
    const { success, error: showError } = useToast();

    const [materials, setMaterials] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Form state for adding custom material
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Fetch materials for this appointment
    const fetchMaterials = useCallback(async () => {
        if (!appointmentId) return;

        setLoading(true);
        try {
            const { data, error } = await appointmentMaterialsAPI.getAppointmentMaterials(appointmentId);
            if (error) {
                console.error('Error fetching appointment materials:', error);
                return;
            }
            setMaterials(data || []);

            // Notify parent about materials status
            if (onMaterialsChange) {
                const hasInsufficientStock = (data || []).some(
                    m => !m.deducted && m.inventory && m.inventory.stock < m.quantity_used
                );
                onMaterialsChange({
                    count: (data || []).filter(m => !m.deducted).length,
                    hasInsufficientStock
                });
            }
        } catch (err) {
            console.error('Error fetching appointment materials:', err);
        } finally {
            setLoading(false);
        }
    }, [appointmentId, onMaterialsChange]);

    // Fetch available inventory items for adding custom materials
    const fetchInventory = useCallback(async () => {
        const activeClinicId = clinicId || clinic?.id;
        if (!activeClinicId) return;

        try {
            const { data, error } = await inventoryAPI.getInventory(activeClinicId);
            if (error) {
                console.error('Error fetching inventory:', error);
                return;
            }
            setInventoryItems(data || []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    }, [clinicId, clinic?.id]);

    // Populate materials from service template if none exist
    const populateFromTemplate = useCallback(async () => {
        const activeClinicId = clinicId || clinic?.id;
        if (!appointmentId || !serviceId || !activeClinicId) return;

        try {
            const { error } = await appointmentMaterialsAPI.populateFromService(
                appointmentId,
                serviceId,
                activeClinicId
            );
            if (error) {
                console.error('Error populating materials:', error);
                return;
            }
            // Refetch after populating
            await fetchMaterials();
        } catch (err) {
            console.error('Error populating materials:', err);
        }
    }, [appointmentId, serviceId, clinicId, clinic?.id, fetchMaterials]);

    useEffect(() => {
        if (appointmentId) {
            fetchMaterials();
            fetchInventory();
        }
    }, [appointmentId, fetchMaterials, fetchInventory]);

    // Calculate stock warnings
    const insufficientStockItems = materials.filter(
        m => !m.deducted && m.inventory && m.inventory.stock < m.quantity_used
    );
    const hasInsufficientStock = insufficientStockItems.length > 0;

    // Filter out already added items for custom add
    const availableItems = inventoryItems.filter(
        item => !materials.some(m => m.inventory_item_id === item.id)
    );

    const handleUpdateQuantity = async (id, newQuantity) => {
        if (newQuantity <= 0 || isCompleted) return;

        try {
            const { data, error } = await appointmentMaterialsAPI.updateQuantity(id, newQuantity);
            if (error) {
                showError(error);
                return;
            }
            setMaterials(prev => prev.map(m => m.id === id ? data : m));
        } catch (err) {
            console.error('Error updating quantity:', err);
        }
    };

    const handleRemoveMaterial = async (id) => {
        if (isCompleted) return;

        try {
            const { error } = await appointmentMaterialsAPI.removeMaterial(id);
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

    const handleAddCustomMaterial = async () => {
        if (!selectedItemId || quantity <= 0) {
            showError('Lütfen bir ürün seçin ve miktar girin');
            return;
        }

        setAdding(true);
        try {
            const { data, error } = await appointmentMaterialsAPI.addCustomMaterial(
                appointmentId,
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
            console.error('Error adding custom material:', err);
            showError('Malzeme eklenirken bir hata oluştu');
        } finally {
            setAdding(false);
        }
    };

    // Non-deducted materials only
    const activeMaterials = materials.filter(m => !m.deducted);
    const deductedMaterials = materials.filter(m => m.deducted);

    if (loading) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-center gap-2">
                <ButtonSpinner />
                <span className="text-sm text-slate-500">Malzemeler yükleniyor...</span>
            </div>
        );
    }

    // If no materials and service has template, offer to populate
    if (materials.length === 0 && serviceId && !isCompleted) {
        return (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500">inventory_2</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900">
                            Bu randevuya henüz malzeme eklenmemiş
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                            Hizmet şablonundan malzemeleri yükleyebilir veya manuel ekleyebilirsiniz.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={populateFromTemplate}
                                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                            >
                                Şablondan Yükle
                            </button>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
                            >
                                Manuel Ekle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Custom Material Form */}
                {showAddForm && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">Malzeme Ekle</span>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Ürün seçin...</option>
                                    {inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.stock} {item.unit || 'adet'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm text-center"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddCustomMaterial}
                            disabled={adding || !selectedItemId}
                            className="w-full py-2 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {adding && <ButtonSpinner />}
                            Ekle
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border ${hasInsufficientStock ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/50 border-slate-100'}`}>
            {/* Header - Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors rounded-xl"
            >
                <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${hasInsufficientStock ? 'text-red-500' : 'text-slate-500'}`}>
                        inventory_2
                    </span>
                    <span className="font-medium text-slate-900">Kullanılacak Malzemeler</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${hasInsufficientStock ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                        {activeMaterials.length}
                    </span>
                    {hasInsufficientStock && (
                        <span className="text-xs text-red-600 font-medium">
                            — Yetersiz stok!
                        </span>
                    )}
                </div>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {/* Active Materials */}
                    {activeMaterials.map(material => {
                        const isLowStock = material.inventory && material.inventory.stock < material.quantity_used;

                        return (
                            <div
                                key={material.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${isLowStock ? 'bg-red-100 border border-red-200' : 'bg-white border border-slate-100'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-8 rounded-lg flex items-center justify-center ${isLowStock ? 'bg-red-200' : 'bg-slate-100'}`}>
                                        <span className={`material-symbols-outlined text-[18px] ${isLowStock ? 'text-red-600' : 'text-slate-400'}`}>
                                            {material.inventory_item_id ? 'package_2' : 'warning'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">
                                            {material.item_name_snapshot}
                                        </p>
                                        {material.inventory ? (
                                            <p className={`text-xs ${isLowStock ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                                Stok: {material.inventory.stock} {material.inventory.unit || 'adet'}
                                                {isLowStock && ' — Yetersiz!'}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-amber-600">Ürün silinmiş</p>
                                        )}
                                    </div>
                                </div>

                                {!isCompleted && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1">
                                            <button
                                                onClick={() => handleUpdateQuantity(material.id, Number(material.quantity_used) - 1)}
                                                disabled={material.quantity_used <= 1}
                                                className="size-6 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">remove</span>
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={Math.ceil(material.quantity_used)}
                                                onChange={(e) => handleUpdateQuantity(material.id, Number(e.target.value))}
                                                className="w-10 text-center font-bold text-slate-900 bg-transparent border-none focus:outline-none text-sm"
                                            />
                                            <button
                                                onClick={() => handleUpdateQuantity(material.id, Number(material.quantity_used) + 1)}
                                                className="size-6 flex items-center justify-center rounded hover:bg-slate-200"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMaterial(material.id)}
                                            className="size-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                )}

                                {isCompleted && (
                                    <span className="text-sm font-bold text-slate-600">
                                        x{Math.ceil(material.quantity_used)}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Deducted Materials (history) */}
                    {deductedMaterials.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                            <p className="text-xs text-slate-400 mb-2">Düşülen Malzemeler</p>
                            {deductedMaterials.map(material => (
                                <div key={material.id} className="flex items-center justify-between py-1 text-sm text-slate-500">
                                    <span>✓ {material.item_name_snapshot}</span>
                                    <span>x{Math.ceil(material.quantity_used)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Custom Material */}
                    {!isCompleted && availableItems.length > 0 && (
                        <>
                            {!showAddForm ? (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                                >
                                    + Malzeme Ekle
                                </button>
                            ) : (
                                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <select
                                                value={selectedItemId}
                                                onChange={(e) => setSelectedItemId(e.target.value)}
                                                className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm"
                                            >
                                                <option value="">Ürün seçin...</option>
                                                {availableItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name} ({item.stock})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="px-2 py-2 rounded-lg border border-slate-200 text-sm text-center"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAddForm(false)}
                                            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={handleAddCustomMaterial}
                                            disabled={adding || !selectedItemId}
                                            className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1"
                                        >
                                            {adding && <ButtonSpinner />}
                                            Ekle
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
