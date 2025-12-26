import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import StaffModal from './StaffModal';
import InviteStaffModal from './InviteStaffModal';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function StaffList({ searchTerm }) {
    const { toast } = useToast();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            toast.error('Could not load staff list');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (member) => {
        setSelectedStaff(member);
        setIsEditModalOpen(true);
    };

    const handleRemoveClick = (member) => {
        setStaffToDelete(member);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!staffToDelete) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', staffToDelete.id);

            if (error) throw error;

            toast.success('Staff member removed');
            fetchStaff();
            setIsDeleteModalOpen(false);
            setStaffToDelete(null);
        } catch (error) {
            console.error('Error removing staff:', error);
            toast.error('Failed to remove staff. You may not have permission.');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="text-slate-900 text-xl font-bold leading-tight">Clinic Staff</h3>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{staff.length} Active</span>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {staff.filter(member => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (member.full_name?.toLowerCase() || '').includes(term) ||
                            (member.email?.toLowerCase() || '').includes(term);
                    }).map(member => (
                        <div key={member.id} className="group flex flex-col gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="flex items-start justify-between z-10">
                                <div className="flex gap-3">
                                    <div className="bg-slate-100 rounded-xl h-12 w-12 flex items-center justify-center text-slate-400 font-bold text-xl overflow-hidden shrink-0">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            (member.full_name || 'U')[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold text-base">{member.full_name || 'Unnamed User'}</h4>
                                        <p className="text-slate-500 text-sm capitalize">{member.role?.replace('_', ' ') || 'Staff'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        title="Edit Role"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleRemoveClick(member)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove Staff"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
                                    Active
                                </span>
                                <span className="text-xs text-slate-400">{member.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Staff Button */}
            <div className="max-w-md w-full px-4 flex justify-end pointer-events-auto mx-auto mt-6">
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-transform active:scale-95 mx-auto w-full justify-center"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    <span className="font-bold">Invite New Staff</span>
                </button>
            </div>

            {/* Modals */}
            <StaffModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                staffMember={selectedStaff}
                onSuccess={fetchStaff}
            />

            <InviteStaffModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Remove Staff Member"
                message={`Are you sure you want to remove ${staffToDelete?.full_name}? This action cannot be undone.`}
                confirmText="Remove"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
