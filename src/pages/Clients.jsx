import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { clientsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import ClientList from '../components/clients/ClientList';
import ClientModal from '../components/clients/ClientModal';
import { ArrowUpDown } from 'lucide-react';

// Sort options with Turkish labels
const SORT_OPTIONS = [
    { value: 'name-asc', label: 'İsme Göre (A-Z)' },
    { value: 'name-desc', label: 'İsme Göre (Z-A)' },
    { value: 'spend-desc', label: 'Harcamaya Göre (Yüksek-Düşük)' },
    { value: 'spend-asc', label: 'Harcamaya Göre (Düşük-Yüksek)' },
];

export default function Clients() {
    const { profile } = useAuth();
    const { error: showError } = useToast();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [sortBy, setSortBy] = useState('name-asc');

    const fetchClients = async () => {
        try {
            setLoading(true);
            if (!profile?.clinic_id) return;

            const { data, error } = await clientsAPI.getClientsWithStats(profile.clinic_id);

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            showError('Müşteri listesi yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [profile?.clinic_id]);

    // Sorted clients based on selected sort option
    const sortedClients = useMemo(() => {
        if (!clients || clients.length === 0) return [];

        const sorted = [...clients];

        switch (sortBy) {
            case 'name-asc':
                sorted.sort((a, b) => {
                    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                    return nameA.localeCompare(nameB, 'tr');
                });
                break;
            case 'name-desc':
                sorted.sort((a, b) => {
                    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                    return nameB.localeCompare(nameA, 'tr');
                });
                break;
            case 'spend-desc':
                sorted.sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0));
                break;
            case 'spend-asc':
                sorted.sort((a, b) => (a.total_spend || 0) - (b.total_spend || 0));
                break;
            default:
                break;
        }

        return sorted;
    }, [clients, sortBy]);

    const handleCreateClient = () => {
        setSelectedClient(null);
        setIsModalOpen(true);
    };

    const handleEditClient = (client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (error) throw error;

            setClients(clients.filter(c => c.id !== clientId));
        } catch (error) {
            console.error('Error deleting client:', error);
            showError('Müşteri silinirken bir hata oluştu.');
        }
    };

    const handleSuccess = () => {
        fetchClients();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Müşteriler</h1>
                    <p className="text-slate-500 mt-1 font-medium">Hasta listesi ve detaylı profiller.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-semibold text-sm text-slate-700 cursor-pointer appearance-none min-w-[220px]"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleCreateClient}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Yeni Hasta Ekle
                    </button>
                </div>
            </div>

            {/* Client List */}
            <ClientList
                clients={sortedClients}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
            />

            {/* Modal */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                client={selectedClient}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

