import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function StaffModal({ isOpen, onClose, staffMember, onSuccess }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        role: 'staff'
    });

    useEffect(() => {
        if (staffMember) {
            setFormData({
                full_name: staffMember.full_name || '',
                role: staffMember.role || 'staff'
            });
        }
    }, [staffMember]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    role: formData.role
                })
                .eq('id', staffMember.id);

            if (error) throw error;

            toast.success('Staff member updated successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating staff:', error);
            toast.error('Failed to update staff member');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Edit Staff Member</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 bg-white"
                        >
                            <option value="admin">Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="staff">Staff</option>
                        </select>
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
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
