// No changes needed
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ClientModal from '../components/clients/ClientModal';
import ClientGallery from '../components/clients/ClientGallery';
import ClientHistoryTimeline from '../components/clients/ClientHistoryTimeline';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useToast } from '../context/ToastContext';

export default function ClientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    // Data State
    const [client, setClient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [notes, setNotes] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');

    // Note Input State
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    // Note Edit State
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Delete Note State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteToDeleteId, setNoteToDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchNotes();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Client Details
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', id)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // 2. Fetch Appointments
            const { data: appointmentData, error: appError } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    date, 
                    time, 
                    status, 
                    services (name, duration, price)
                `)
                .eq('client_id', id)
                .order('date', { ascending: false });

            if (appError) throw appError;
            setAppointments(appointmentData || []);

            // 3. Fetch Transactions
            // Real Data: Fetches from public.transactions table linked by client_id
            const { data: transactionData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('client_id', id)
                .order('date', { ascending: false });

            if (txError && txError.code !== 'PGRST116') {
                console.warn('Could not fetch transactions', txError);
            }
            setTransactions(transactionData || []);

        } catch (error) {
            console.error('Error fetching client profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', id)
            .order('created_at', { ascending: false });

        if (!error) {
            setNotes(data || []);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setAddingNote(true);
        try {
            const { error } = await supabase
                .from('client_notes')
                .insert([{ client_id: id, content: newNote.trim() }]);

            if (error) throw error;

            setNewNote('');
            fetchNotes(); // Refresh list
            success('Note added');
        } catch (error) {
            console.error('Error adding note:', error);
            showError('Failed to add note');
        } finally {
            setAddingNote(false);
        }
    };

    const startEditingNote = (note) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    const saveEditedNote = async () => {
        if (!editContent.trim()) return;
        try {
            const { error } = await supabase
                .from('client_notes')
                .update({ content: editContent.trim() })
                .eq('id', editingNoteId);

            if (error) throw error;

            fetchNotes(); // Refresh to get updated content and order if changed
            setEditingNoteId(null);
            setEditContent('');
            success('Note updated');
        } catch (error) {
            console.error('Error updating note:', error);
            showError('Failed to update note');
        }
    };

    const handleDeleteNoteClick = (noteId) => {
        setNoteToDeleteId(noteId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteNote = async () => {
        if (!noteToDeleteId) return;
        setDeleteLoading(true);
        try {
            const { error } = await supabase
                .from('client_notes')
                .delete()
                .eq('id', noteToDeleteId);

            if (error) throw error;
            fetchNotes();
            success('Note deleted');
            setIsDeleteModalOpen(false);
            setNoteToDeleteId(null);
        } catch (error) {
            console.error('Error deleting note:', error);
            showError('Failed to delete note');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading && !client) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        );
    }

    if (!client) return null;

    // Derived Stats
    // 1. Visits: Count of 'Completed' appointments
    const totalVisits = appointments.filter(a => a.status === 'Completed').length;

    // 2. Value (Life Time Value): Sum of Transactions OR Fallback to Appointment Prices
    // If transactions exist, we use them as the source of truth for money collected.
    // If not, we estimate based on service prices of completed appointments.
    const totalSpent = (transactions.length > 0)
        ? transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        : appointments
            .filter(a => a.status === 'Completed') // Only count completed for value
            .reduce((sum, appt) => sum + (appt.services?.price || 0), 0);

    return (
        <div className="flex flex-col min-h-screen bg-background-light pb-24">
            {/* Header with Back Button */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-slate-900">Client Profile</h1>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="ml-auto p-2 rounded-full hover:bg-slate-100 text-primary"
                >
                    <span className="material-symbols-outlined">edit</span>
                </button>
            </div>

            <div className="p-5 space-y-6 max-w-2xl mx-auto w-full">
                {/* Profile Card */}
                <div className="flex flex-col items-center p-6 bg-white rounded-[24px] shadow-card border border-slate-100">
                    <div className="size-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 ring-4 ring-slate-50 overflow-hidden">
                        {client.image_url ? (
                            <img src={client.image_url} alt={client.first_name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-slate-300">
                                {client.first_name?.[0]}{client.last_name?.[0]}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{client.first_name} {client.last_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${client.status === 'Active' ? 'bg-green-100 text-green-700' :
                            client.status === 'Lead' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {client.status}
                        </span>
                        <span className="text-slate-500 text-sm">Joined {new Date(client.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        {client.phone && (
                            <a href={`tel:${client.phone}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">call</span>
                                Call
                            </a>
                        )}
                        {client.email && (
                            <a href={`mailto:${client.email}`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                Email
                            </a>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('Overview')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'Overview'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('History')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'History'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab('Gallery')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'Gallery'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Gallery
                    </button>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-slate-900">{totalVisits}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Visits</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-slate-900">{appointments.length}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Booked</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-primary">${totalSpent.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Value</span>
                                </div>
                            </div>

                            {/* Recent Appointments (Simplified view for Overview) */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                                        Recent Appointments
                                    </h3>
                                    {appointments.length > 0 && (
                                        <button onClick={() => setActiveTab('History')} className="text-sm font-bold text-primary">View All</button>
                                    )}
                                </div>

                                {appointments.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-900 font-bold mb-1">No visits yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {appointments.slice(0, 3).map(appt => (
                                            <div key={appt.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{appt.services?.name || 'Appointment'}</h4>
                                                    <p className="text-xs text-slate-500 font-bold mt-1">
                                                        {new Date(appt.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${appt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    appt.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {appt.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clinical Notes */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400">description</span>
                                        Clinical Notes
                                    </h3>
                                </div>

                                {/* Add Note Form */}
                                <form onSubmit={handleAddNote} className="mb-4">
                                    <div className="relative">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Write a note..."
                                            className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium resize-none min-h-[80px]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newNote.trim() || addingNote}
                                            className="absolute right-2 bottom-2 p-2 rounded-lg bg-slate-100 text-primary hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-primary transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                        </button>
                                    </div>
                                </form>

                                {/* Notes List */}
                                <div className="space-y-3">
                                    {notes.length === 0 ? (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                            <p className="text-slate-400 text-sm font-medium">No notes added yet.</p>
                                        </div>
                                    ) : (
                                        notes.map(note => (
                                            <div key={note.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-slate-200 transition-colors">
                                                {editingNoteId === note.id ? (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm resize-none"
                                                            rows="3"
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNoteId(null);
                                                                    setEditContent('');
                                                                }}
                                                                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={saveEditedNote}
                                                                className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-start gap-4">
                                                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => startEditingNote(note)}
                                                                    className="p-1 text-slate-300 hover:text-primary transition-colors"
                                                                    title="Edit Note"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteNoteClick(note.id)}
                                                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                                    title="Delete Note"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase">
                                                            {new Date(note.created_at).toLocaleDateString()} • {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'History' && (
                        <ClientHistoryTimeline appointments={appointments} transactions={transactions} />
                    )}

                    {activeTab === 'Gallery' && (
                        <ClientGallery clientId={id} />
                    )}
                </div>
            </div>

            <ClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                client={client}
                onSuccess={() => {
                    fetchData();
                }}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteNote}
                title="Delete Note"
                message="Are you sure you want to delete this specific note? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
}
