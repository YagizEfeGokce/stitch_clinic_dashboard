import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ClientModal from '../clients/ClientModal';

export default function ClientSelection({ onSelect }) {
    const [search, setSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false }); // Changed to match Clients.jsx
            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filtered = clients.filter(c => {
        const first = c.first_name?.toLowerCase() || '';
        const last = c.last_name?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || ''; // Added email search
        const term = search.toLowerCase();
        return first.includes(term) || last.includes(term) || email.includes(term);
    });

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Select Client</h2>

            {/* Search Bar */}
            <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                    type="text"
                    placeholder="Search client name..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {/* New Client Option */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer transition-all"
                >
                    <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </div>
                    <span className="font-semibold">Add New Client</span>
                </button>

                {loading ? (
                    <div className="text-center py-4 text-slate-400">Loading clients...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                        <span className="material-symbols-outlined text-3xl mb-2">person_off</span>
                        <p>No clients found.</p>
                    </div>
                ) : (
                    filtered.map(client => (
                        <div
                            key={client.id}
                            onClick={() => onSelect(client)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-md cursor-pointer transition-all"
                        >
                            <div className="size-12 rounded-full bg-cover bg-center shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                                {client.image_url ? (
                                    <img src={client.image_url} alt="client" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-slate-400">{(client.first_name?.[0] || 'U')}</span>
                                )}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">{client.first_name || 'Unknown'} {client.last_name || ''}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                    } font-bold`}>{client.status || 'Client'}</span>
                            </div>
                            <span className="ml-auto material-symbols-outlined text-slate-300">chevron_right</span>
                        </div>
                    )))}
            </div>

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchClients();
                }}
            />
        </div>
    );
}
