import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ClientList({ clients, onEdit, onDelete }) {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredClients = clients.filter(client => {
        const matchesSearch = (
            (client.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone || '').includes(searchTerm)
        );
        const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm border-dashed">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                    <span className="material-symbols-outlined text-3xl">group_off</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Clients Found</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your search or add a new client to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search clients by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-slate-700 placeholder:font-normal"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary outline-none font-bold text-sm text-slate-700 cursor-pointer min-w-[150px]"
                >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Lead">Lead</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No clients found matching your filters.
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="group flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all cursor-pointer relative"
                        >
                            {/* Avatar */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    {client.image_url ? (
                                        <img src={client.image_url} alt={client.first_name || 'Client'} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                            {(client.first_name?.[0] || '')}{(client.last_name?.[0] || '')}
                                        </div>
                                    )}
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${params(client.status)}`}></span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                                        {client.first_name || 'Unknown'} {client.last_name || 'Client'}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">{client.email || client.phone}</p>
                                </div>
                            </div>

                            {/* Meta Info (Desktop) */}
                            <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Visit</span>
                                    <span className="font-semibold text-slate-700">{client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}</span>
                                </div>
                                <div className="flex flex-col items-end w-24">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spend</span>
                                    <span className="font-bold text-slate-900">${client.total_spend || '0.00'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            {['owner', 'admin', 'doctor'].includes(role) && (
                                <div className="flex items-center gap-2 pl-4 border-l border-slate-100 ml-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(client);
                                        }}
                                        className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Edit Client"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(client.id);
                                        }}
                                        className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Client"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            )}

                            <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform ml-2">chevron_right</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function params(status) {
    switch (status) {
        case 'Active': return 'bg-green-500';
        case 'Lead': return 'bg-amber-400';
        case 'Inactive': return 'bg-slate-300';
        default: return 'bg-slate-300';
    }
}
