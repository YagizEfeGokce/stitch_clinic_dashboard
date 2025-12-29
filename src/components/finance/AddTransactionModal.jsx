import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CATEGORIES = {
    Income: ['Treatment', 'Product Sales', 'Consultation', 'Other Income'],
    Expense: ['Rent', 'Salaries', 'Supplies', 'Marketing', 'Utilities', 'Software', 'Other Expense']
};

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'Insurance'];

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Expense',
        amount: '',
        description: '',
        category: 'Supplies',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Credit Card'
    });

    // Reset body scroll when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            // Reset category if type changes to ensure valid category
            if (name === 'type' && value !== prev.type) {
                return {
                    ...prev,
                    [name]: value,
                    category: CATEGORIES[value][0]
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('transactions')
                .insert([
                    {
                        type: formData.type.toLowerCase(),
                        amount: parseFloat(formData.amount),
                        description: formData.description,
                        category: formData.category,
                        date: formData.date,
                        payment_method: formData.payment_method
                    }
                ]);

            if (error) throw error;

            // Reset form
            setFormData({
                type: 'Expense',
                amount: '',
                description: '',
                category: 'Supplies',
                date: new Date().toISOString().split('T')[0],
                payment_method: 'Credit Card'
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to add transaction');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Panel */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">New Transaction</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleChange({ target: { name: 'type', value: 'Income' } })}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'Income'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                    Income
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange({ target: { name: 'type', value: 'Expense' } })}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'Expense'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">trending_down</span>
                                    Expense
                                </span>
                            </button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Amount ($)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-lg font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Office Rent, Botox Supply"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-900"
                            />
                        </div>

                        {/* Category & Date Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-900 appearance-none"
                                >
                                    {CATEGORIES[formData.type].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                            <div className="flex flex-wrap gap-2">
                                {PAYMENT_METHODS.map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => handleChange({ target: { name: 'payment_method', value: method } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formData.payment_method === method
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                            {formData.type === 'Income' ? 'Add Income' : 'Add Expense'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
