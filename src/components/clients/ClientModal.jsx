import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ClientGallery from './ClientGallery';
import { useToast } from '../../context/ToastContext';

export default function ClientModal({ isOpen, onClose, client, onSuccess }) {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState('Profile');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'Active',
        note: '' // New Note field for creation
    });

    useEffect(() => {
        if (isOpen) {
            if (client) {
                // Edit Mode: Populate Form
                setFormData({
                    first_name: client.first_name || '',
                    last_name: client.last_name || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    status: client.status || 'Active',
                    note: '' // Notes are handled in profile separate tab usually, but we could allow adding one here? 
                    // User asked for "Add New Client" -> Add Note. 
                    // So note field makes sense ONLY for Create Mode or as "Add new note" in Edit?
                    // User specifically said "Add New client ypaınca Müsteriye not ekleyebilelim birde"
                });
                setActiveTab('Profile');
                fetchHistory(client.id);
            } else {
                // Create Mode: Reset Form
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    status: 'Active',
                    note: ''
                });
                setActiveTab('Profile');
                setHistory([]);
            }
        }
    }, [client, isOpen]);

    const fetchHistory = async (clientId) => {
        try {
            setLoadingHistory(true);
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services (name, duration_min)
                `)
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .order('time', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let clientId = client?.id;
            let error;

            // Prepare client data (exclude note)
            const clientData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                status: formData.status
            };

            if (client) {
                // Edit Mode
                const result = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', client.id);
                error = result.error;
            } else {
                // Create Mode
                // Even though fields are optional in UI, we might default first_name if empty to avoid DB constraints if any
                // If user leaves everything empty, we should probably at least require something or name it "Unknown"
                // User asked for "Optional", so we allow empty strings.

                const result = await supabase
                    .from('clients')
                    .insert([clientData])
                    .select()
                    .single();

                error = result.error;
                if (result.data) {
                    clientId = result.data.id;
                }
            }

            if (error) throw error;

            // Handle Note (Only if new note is provided)
            if (formData.note && formData.note.trim()) {
                if (clientId) {
                    const { error: noteError } = await supabase
                        .from('client_notes')
                        .insert([{
                            client_id: clientId,
                            content: formData.note.trim()
                        }]);

                    if (noteError) {
                        console.error('Error adding initial note:', noteError);
                        // We don't fail the whole process if note fails, but we warn
                        showError('Client created but failed to save note.');
                    }
                }
            }

            success(client ? 'Client updated successfully' : 'Client created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            showError('Failed to save client. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isNewClient = !client;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Sidebar / Tabs */}
                <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        {isNewClient ? (
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold">
                                    <span className="material-symbols-outlined">person_add</span>
                                </div>
                                <span className="font-bold text-slate-900">New Client</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-3 border-2 border-white shadow-sm">
                                    {(client.first_name || 'U')[0]}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{client.first_name} {client.last_name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{client.status}</p>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {['Profile', 'History', 'Gallery'].map(tab => (
                            <button
                                key={tab}
                                disabled={isNewClient && tab !== 'Profile'}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100'
                                    } ${isNewClient && tab !== 'Profile' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="material-symbols-outlined">
                                    {tab === 'Profile' ? 'id_card' : tab === 'History' ? 'history' : 'photo_library'}
                                </span>
                                {tab}
                            </button>
                        ))}
                    </nav>

                    {/* Footer - REMOVED CLOSE BUTTON as per request */}
                    {/* <div className="p-4 border-t border-slate-100">
                        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="text-sm font-bold">Close</span>
                        </button>
                    </div> */}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto p-8">

                        {/* PROFILE TAB */}
                        {activeTab === 'Profile' && (
                            <div className="max-w-xl mx-auto space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                                </div>
                                <form id="clientForm" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                                placeholder="Jane"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                            placeholder="jane@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Status</label>
                                        <div className="relative">
                                            <select

                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary/10 outline-none font-bold text-slate-700 appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="Active">Active Patient</option>
                                                <option value="Lead">Lead / Prospect</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined">expand_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Note Field (Only for Creating New Client, OR always? User asked "Add New client ypaınca Müsteriye not ekleyebilelim") */}
                                    {isNewClient && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Initial Note <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                                            <textarea
                                                value={formData.note}
                                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all resize-none h-24"
                                                placeholder="Add a welcome note or initial consultation details..."
                                            />
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'History' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Appointment History</h2>

                                {loadingHistory ? (
                                    <div className="flex justify-center py-12">
                                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                                            <span className="material-symbols-outlined text-2xl">event_busy</span>
                                        </div>
                                        <p className="text-slate-500 font-medium">No appointment history found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map(apt => (
                                            <div key={apt.id} className="flex items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 
                                                    ${apt.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                                        apt.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                            'bg-blue-50 text-blue-600'}`}>
                                                    <span className="material-symbols-outlined">
                                                        {apt.status === 'Completed' ? 'check_circle' :
                                                            apt.status === 'Cancelled' ? 'cancel' : 'event'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900">{apt.services?.name || 'Appointment'}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                            {apt.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                            {apt.time.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold 
                                                    ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                    {apt.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* GALLERY TAB */}
                        {activeTab === 'Gallery' && (
                            <div className="h-full flex flex-col">
                                <ClientGallery clientId={client.id} />
                            </div>
                        )}

                    </div>

                    {/* Footer Actions (Only show Save for Profile tab) */}
                    {activeTab === 'Profile' && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="clientForm"
                                disabled={loading}
                                className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                )}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
