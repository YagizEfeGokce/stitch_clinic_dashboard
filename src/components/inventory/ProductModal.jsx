import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/logger';
import { useAuth } from '../../context/AuthContext';

export default function ProductModal({ isOpen, onClose, onSuccess, productToEdit = null }) {
    const { success, error: showError } = useToast();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        sku: '',
        stock: 10,
        min_stock_alert: 5,
        price: '',
        image_url: ''
    });

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                category: productToEdit.category || '',
                sku: productToEdit.sku || '',
                stock: productToEdit.stock,
                min_stock_alert: productToEdit.min_stock_alert || 5,
                price: productToEdit.price || '',
                image_url: productToEdit.image_url || ''
            });
        } else {
            // Reset for new product
            setFormData({
                name: '',
                category: '',
                sku: '',
                stock: 10,
                min_stock_alert: 5,
                price: '',
                image_url: ''
            });
        }
    }, [productToEdit, isOpen]);

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Supabase Storage ('inventory' bucket)
            const { error: uploadError } = await supabase.storage
                .from('inventory')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get Public URL
            const { data } = supabase.storage
                .from('inventory')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: data.publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            showError('Failed to upload image. Inventory bucket might be missing.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            category: formData.category,
            sku: formData.sku,
            stock: parseInt(formData.stock),
            min_stock_alert: parseInt(formData.min_stock_alert),
            price: parseFloat(formData.price) || 0,
            image_url: formData.image_url
        };

        try {
            if (productToEdit) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('inventory')
                    .update(payload)
                    .eq('id', productToEdit.id);

                if (updateError) throw updateError;

                // Log activity for update
                const changes = Object.keys(payload).filter(key => payload[key] !== productToEdit[key]);
                await logActivity('Updated Inventory Item', {
                    item_name: formData.name,
                    item_id: productToEdit.id,
                    changes: changes.length > 0 ? changes : ['No significant changes']
                });

                success('Product updated successfully');
            } else {
                // CREATE
                if (!profile?.clinic_id) throw new Error('You are not associated with a clinic.');

                const { data, error: insertError } = await supabase
                    .from('inventory')
                    .insert([payload])
                    .select(); // Select the inserted data to get the ID

                if (insertError) throw insertError;

                // Log activity for creation
                await logActivity('Created Inventory Item', {
                    item_name: formData.name,
                    item_id: data?.[0]?.id
                });

                success('Product created successfully');
            }


            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            showError(`Failed to save product: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900">
                        {productToEdit ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            placeholder="e.g. Hydrating Cleanser"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="Retail">Retail Product</option>
                                <option value="Professional">Professional Supply</option>
                                <option value="Consumable">Consumable</option>
                                <option value="Equipment">Equipment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                SKU <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="e.g. CL-001"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Initial Stock</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Price ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                value={formData.min_stock_alert}
                                onChange={e => setFormData({ ...formData, min_stock_alert: e.target.value })}
                                className="w-24 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                            />
                            <p className="text-xs text-slate-500">You will be alerted when stock falls below this number.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Product Image <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
                        </label>
                        <div className="flex gap-4 items-start">
                            {formData.image_url && (
                                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="block w-full">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2.5 file:px-4
                                            file:rounded-xl file:border-0
                                            file:text-sm file:font-bold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            transition-all
                                            cursor-pointer"
                                    />
                                </label>
                                {uploading && <p className="text-xs text-primary mt-1 font-medium animate-pulse">Uploading...</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {productToEdit ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
