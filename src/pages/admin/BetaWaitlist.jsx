import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import {
    Users, Mail, Phone, MapPin, Check, X, Clock,
    RefreshCw, Search, Send
} from 'lucide-react';

export default function BetaWaitlist() {
    const { addToast } = useToast();
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingInvite, setSendingInvite] = useState(null); // ID of item being invited
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        invited: 0,
        converted: 0
    });

    // Fetch waitlist data
    const fetchWaitlist = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('beta_waitlist')
                .select('*')
                .order('created_at', { ascending: true }); // Oldest first (FIFO)

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setWaitlist(data || []);

            // Calculate stats
            if (data) {
                setStats({
                    total: data.length,
                    pending: data.filter(d => d.status === 'pending').length,
                    approved: data.filter(d => d.status === 'approved').length,
                    invited: data.filter(d => d.status === 'approved').length, // Approved = invited
                    converted: data.filter(d => d.status === 'converted').length,
                });
            }
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            addToast('Bekleme listesi yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter, addToast]);

    useEffect(() => {
        fetchWaitlist();
    }, [fetchWaitlist]);

    // Send invitation to a waitlist entry
    const sendInvitation = async (waitlistItem) => {
        setSendingInvite(waitlistItem.id);
        try {
            // Use new Supabase native invitation service
            const { sendBetaInvitation } = await import('../../services/betaUserService');

            const result = await sendBetaInvitation(
                waitlistItem.id,
                waitlistItem.email,
                {
                    clinic_name: waitlistItem.clinic_name,
                    owner_name: waitlistItem.owner_name
                }
            );

            if (!result.success) {
                throw new Error(result.error || 'Davet gönderilirken hata oluştu');
            }

            addToast(`✅ Davet emaili gönderildi: ${waitlistItem.email}`, 'success');
            fetchWaitlist();
        } catch (error) {
            console.error('Error sending invitation:', error);
            addToast(`Davet gönderilirken hata: ${error.message || 'Bilinmeyen hata'}`, 'error');
        } finally {
            setSendingInvite(null);
        }
    };

    // Send batch invitations
    const sendBatchInvitations = async () => {
        if (selectedItems.length === 0) {
            addToast('Lütfen en az bir kişi seçin', 'warning');
            return;
        }

        const itemsToInvite = waitlist.filter(
            w => selectedItems.includes(w.id) && w.status === 'pending'
        );

        for (const item of itemsToInvite) {
            await sendInvitation(item);
            // Small delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 300));
        }

        setSelectedItems([]);
        addToast(`${itemsToInvite.length} davet gönderildi`, 'success');
    };

    // Toggle selection
    const toggleSelection = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // Select all pending
    const selectAllPending = () => {
        const pendingIds = filteredWaitlist
            .filter(w => w.status === 'pending')
            .map(w => w.id);
        setSelectedItems(pendingIds);
    };

    // Update status
    const updateStatus = async (id, newStatus) => {
        try {
            await supabase
                .from('beta_waitlist')
                .update({
                    status: newStatus,
                    ...(newStatus === 'approved' && { approved_at: new Date().toISOString() }),
                    ...(newStatus === 'converted' && { converted_at: new Date().toISOString() }),
                })
                .eq('id', id);

            addToast('Durum güncellendi', 'success');
            fetchWaitlist();
        } catch (error) {
            console.error('Error updating status:', error);
            addToast('Durum güncellenirken hata oluştu', 'error');
        }
    };

    const filteredWaitlist = waitlist.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            item.clinic_name?.toLowerCase().includes(term) ||
            item.owner_name?.toLowerCase().includes(term) ||
            item.email?.toLowerCase().includes(term) ||
            item.city?.toLowerCase().includes(term)
        );
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'converted': return 'bg-blue-100 text-blue-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Davet Edildi';
            case 'rejected': return 'Reddedildi';
            case 'converted': return 'Kayıt Oldu';
            default: return 'Beklemede';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Beta Yönetimi</h1>
                    <p className="text-slate-600">Bekleme listesini yönetin ve davet gönderin</p>
                </div>
                <button
                    onClick={fetchWaitlist}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Toplam" value={stats.total} color="bg-slate-100 text-slate-700" />
                <StatCard label="Beklemede" value={stats.pending} color="bg-amber-100 text-amber-700" />
                <StatCard label="Davet Edildi" value={stats.approved} color="bg-green-100 text-green-700" />
                <StatCard label="Aktif Davet" value={stats.invited} color="bg-teal-100 text-teal-700" />
                <StatCard label="Kayıt Oldu" value={stats.converted} color="bg-blue-100 text-blue-700" />
            </div>

            {/* Batch Actions */}
            {selectedItems.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-teal-900">{selectedItems.length} kişi seçildi</p>
                            <p className="text-sm text-teal-600">Toplu işlem yapabilirsiniz</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedItems([])}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={sendBatchInvitations}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            Toplu Davet Gönder
                        </button>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Klinik, isim, e-posta veya şehir ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'approved', 'converted'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' :
                                f === 'pending' ? 'Beklemede' :
                                    f === 'approved' ? 'Davet Edildi' : 'Kayıt Oldu'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredWaitlist.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Henüz başvuru yok</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => e.target.checked ? selectAllPending() : setSelectedItems([])}
                                            checked={selectedItems.length > 0 && selectedItems.length === filteredWaitlist.filter(w => w.status === 'pending').length}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Klinik</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">İletişim</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Şehir</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Durum</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">Kayıt</th>
                                    <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredWaitlist.map((item) => {
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                {item.status === 'pending' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleSelection(item.id)}
                                                        className="rounded border-slate-300"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{item.clinic_name}</div>
                                                <div className="text-sm text-slate-500">{item.owner_name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <a href={`mailto:${item.email}`} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {item.email}
                                                    </a>
                                                    <a href={`tel:${item.phone}`} className="text-sm text-slate-600 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {item.phone}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 text-slate-600">
                                                    <MapPin className="w-4 h-4" />
                                                    {item.city}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                    {item.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {item.status === 'approved' && <Check className="w-3 h-3" />}
                                                    {item.status === 'converted' && <Check className="w-3 h-3" />}
                                                    {getStatusText(item.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => sendInvitation(item)}
                                                                disabled={sendingInvite === item.id}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium disabled:opacity-50"
                                                                title="Davet Gönder"
                                                            >
                                                                {sendingInvite === item.id ? (
                                                                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Send className="w-4 h-4" />
                                                                )}
                                                                Davet
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(item.id, 'rejected')}
                                                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                                title="Reddet"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className={`${color} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm opacity-80">{label}</div>
        </div>
    );
}

