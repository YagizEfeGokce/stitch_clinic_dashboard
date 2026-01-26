import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { clientsAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui/Spinner';
import ClientList from '../components/clients/ClientList';
import ClientModal from '../components/clients/ClientModal';

export default function Clients() {
    const { profile } = useAuth();
    const { error: showError } = useToast();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

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
                <button
                    onClick={handleCreateClient}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Yeni Hasta Ekle
                </button>
            </div>

            {/* Client List */}
            <ClientList
                clients={clients}
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
