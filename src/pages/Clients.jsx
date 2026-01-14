import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ClientList from '../components/clients/ClientList';
import ClientModal from '../components/clients/ClientModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { logActivity } from '../lib/logger';

export default function Clients() {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // New Filter State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async (retryCount = 0) => {
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch clients with appointments to calculate dynamic status
            const fetchPromise = supabase
                .from('clients')
                .select(`
                    id, first_name, last_name, email, phone, status, image_url, created_at,
                    appointments ( date, status )
                `)
                .order('created_at', { ascending: false });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('------- CLIENT FETCH ERROR DETAILS -------');
            console.error('Message:', error.message);
            console.error('Code:', error.code || 'N/A');
            console.error('Details:', error.details || 'N/A');
            console.error('Hint:', error.hint || 'N/A');
            console.error('Full Error Object:', error);
            console.error('------------------------------------------');

            const isNetworkError = error.message === 'TIMEOUT' || error.message?.includes('fetch');
            if (isNetworkError && retryCount < 2) {
                console.warn(`Retry attempt ${retryCount + 1} for clients...`);
                return fetchClients(retryCount + 1);
            }
            showError(`Müşteriler yüklenemedi. Hata: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        const client = clients.find(c => c.id === id);
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientToDelete.id);

            if (error) throw error;

            await logActivity('Müşteri Silindi', {
                client_name: `${clientToDelete.first_name} ${clientToDelete.last_name}`,
                client_id: clientToDelete.id
            });

            success('Müşteri başarıyla silindi');
            fetchClients();
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        } catch (error) {
            console.error('Error deleting client:', error);
            showError('Müşteri silinemedi');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setSelectedClient(null);
        setIsModalOpen(true);
    };

    // Process clients to inject computed status and last_visit, then filter
    const filteredClients = useMemo(() => {
        const processed = clients.map(client => {
            // 1. Calculate Last Visit
            let lastVisit = null;
            let lastVisitTs = 0;

            const validAppointments = (client.appointments || []).filter(a => a.status !== 'Cancelled');

            if (validAppointments.length > 0) {
                const dates = validAppointments.map(a => new Date(a.date).getTime());
                lastVisitTs = Math.max(...dates);
                // Format as ISO string for consistency
                lastVisit = new Date(lastVisitTs).toISOString();
            }

            // 2. Calculate Status
            let status = 'Inactive';
            // Logic:
            // - If DB says 'Lead', keep it 'Lead' (User Request)
            // - If has valid appointments in last 3 months -> 'Active'
            // - Otherwise -> 'Inactive'

            if (client.status === 'Lead') {
                status = 'Lead';
            } else if (validAppointments.length > 0) {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                if (lastVisitTs >= threeMonthsAgo.getTime()) {
                    status = 'Active';
                } else {
                    status = 'Inactive';
                }
            } else {
                status = 'Inactive';
            }

            return {
                ...client,
                status, // Override with computed status
                last_visit: lastVisit // Add calculated last visit
            };
        });

        return processed.filter(client => {
            // Status Filter (uses the newly computed status)
            if (statusFilter !== 'All' && client.status !== statusFilter) return false;

            // Search Filter
            const first = client.first_name?.toLowerCase() || '';
            const last = client.last_name?.toLowerCase() || '';
            const email = client.email?.toLowerCase() || '';
            const phone = client.phone?.toLowerCase() || '';
            const term = searchTerm.toLowerCase();

            return first.includes(term) || last.includes(term) || email.includes(term) || phone.includes(term);
        });
    }, [clients, statusFilter, searchTerm]);

    return (
        <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Müşteriler</h1>
                    <p className="text-slate-500 mt-1">Hasta veritabanınızı yönetin</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform active:scale-95"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    <span>Yeni Hasta Ekle</span>
                </button>
            </header>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        type="text"
                        placeholder="İsim, e-posta veya telefon ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder:text-slate-400 transition-all font-medium"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm ring-1 ring-slate-100 overflow-x-auto">
                    {['Tümü', 'Aktif', 'Potansiyel', 'Pasif'].map((statusLabel, index) => {
                        const statusKey = ['All', 'Active', 'Lead', 'Inactive'][index];
                        return (
                            <button
                                key={statusKey}
                                onClick={() => setStatusFilter(statusKey)}
                                className={`px-4 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${statusFilter === statusKey
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {statusLabel}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading && clients.length === 0 ? (
                <div className="flex justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </div>
            ) : (
                <>
                    {loading && <div className="text-center text-xs text-slate-400 py-1 animate-pulse">Güncellemeler kontrol ediliyor...</div>}
                    <ClientList
                        clients={filteredClients}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                    />
                </>
            )}

            <ClientModal
                isOpen={isModalOpen}
                client={selectedClient}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedClient(null);
                }}
                onSuccess={() => {
                    fetchClients();
                }}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Müşteriyi Sil"
                message={`${clientToDelete?.first_name} ${clientToDelete?.last_name} adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem, müşteriye ait tüm randevuları ve verileri silecektir.`}
                confirmText="Sil"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
