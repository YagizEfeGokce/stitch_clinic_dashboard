import { useState, useEffect, useCallback } from 'react';
import { staffAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import StaffModal from './StaffModal';
import InviteStaffModal from './InviteStaffModal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { Spinner } from '../ui/Spinner';

export default function StaffList({ searchTerm }) {
    const { clinic } = useAuth();
    const { success, error: showError } = useToast();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchStaff = useCallback(async () => {
        if (!clinic?.id) return;

        try {
            setLoading(true);
            const { data, error } = await staffAPI.getStaff(clinic.id);

            if (error) {
                showError(error);
                return;
            }
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            showError('Personel listesi yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [clinic?.id, showError]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

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
            // Note: Deleting profiles requires caution - this might need admin privileges
            const { error } = await staffAPI.updateStaffMember(staffToDelete.id, {
                clinic_id: null // Remove from clinic instead of deleting
            });

            if (error) {
                showError(error);
                return;
            }

            success('Personel kaldırıldı');
            fetchStaff();
            setIsDeleteModalOpen(false);
            setStaffToDelete(null);
        } catch (error) {
            console.error('Error removing staff:', error);
            showError('Personel kaldırılırken bir hata oluştu');
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatRole = (role) => {
        if (!role) return 'Personel';
        const map = {
            'doctor': 'Doktor',
            'admin': 'Yönetici',
            'receptionist': 'Resepsiyonist',
            'staff': 'Personel'
        };
        return map[role.toLowerCase()] || role.replace('_', ' ');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="text-slate-900 text-xl font-bold leading-tight">Klinik Personeli</h3>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">{staff.length} Aktif</span>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Spinner size="lg" />
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
                                            (member.full_name || 'K')[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold text-base">{member.full_name || 'İsimsiz Kullanıcı'}</h4>
                                        <p className="text-slate-500 text-sm capitalize">{formatRole(member.role)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        title="Rolü Düzenle"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleRemoveClick(member)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Personeli Sil"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
                                    Aktif
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
                    <span className="font-bold">Yeni Personel Davet Et</span>
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
                onStaffAdded={fetchStaff}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Personeli Sil"
                message={`${staffToDelete?.full_name} isimli personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Sil"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
