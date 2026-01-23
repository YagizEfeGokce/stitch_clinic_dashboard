import { useState, useEffect } from 'react';
import { ResponsiveTable, createColumn } from '../components/ui/ResponsiveTable';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    Shield, MessageSquare, Building2, LogOut, Loader2,
    CheckCircle, XCircle, Clock, Bug, Lightbulb, MoreHorizontal,
    Users, Calendar, TrendingUp, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { superAdminAPI } from '../lib/api';
import Finance from '../pages/Finance';
import Performance from '../pages/Performance';

// Only these emails can access Super Admin
const SUPER_ADMIN_EMAILS = [
    'relre434@gmail.com',
    'yagiz.gokce19@gmail.com'
];

export default function SuperAdminLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('feedback');

    // Check if current user is a super admin
    const isSuperAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());

    // If not super admin, redirect to home
    if (!isSuperAdmin) {
        return <Navigate to="/schedule" replace />;
    }

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { id: 'feedback', label: 'Geri Bildirimler', icon: MessageSquare },
        { id: 'betawaitlist', label: 'Beta Bekleme Listesi', icon: Users },
        { id: 'clinics', label: 'Klinikler', icon: Building2 },
        { id: 'finance', label: 'Finans', icon: DollarSign },
        { id: 'performance', label: 'Performans', icon: TrendingUp },
    ];

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Dark Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Super Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activePage === item.id
                                ? 'bg-red-600/10 text-red-400 border border-red-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="px-4 py-2 mb-2 text-xs text-slate-500 font-medium truncate">
                        {user?.email}
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {activePage === 'feedback' && <FeedbackPanel />}
                    {activePage === 'betawaitlist' && <BetaWaitlistPanel />}
                    {activePage === 'clinics' && <ClinicsPanel />}
                    {activePage === 'finance' && <Finance />}
                    {activePage === 'performance' && <Performance />}
                </div>
            </main>
        </div>
    );
}

// ==================== FEEDBACK PANEL ====================
function FeedbackPanel() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const { data, error } = await superAdminAPI.getFeedbacks();

            if (error) throw error;
            setFeedbacks(data || []);
        } catch (err) {
            console.error('Feedback fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await superAdminAPI.updateFeedbackStatus(id, status);
            fetchFeedbacks();
        } catch (err) {
            console.error('Status update error:', err);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'bug': return <Bug className="w-4 h-4 text-red-500" />;
            case 'feature': return <Lightbulb className="w-4 h-4 text-amber-500" />;
            default: return <MoreHorizontal className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'new':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1"><Clock className="w-3 h-3" /> Yeni</span>;
            case 'resolved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Çözüldü</span>;
            case 'dismissed':
                return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3" /> Reddedildi</span>;
            default:
                return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">{status}</span>;
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => filter === 'all' || f.status === filter);
    const stats = {
        total: feedbacks.length,
        new: feedbacks.filter(f => f.status === 'new').length,
        resolved: feedbacks.filter(f => f.status === 'resolved').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <MessageSquare className="w-7 h-7 text-primary" />
                        Geri Bildirimler
                    </h1>
                    <p className="text-slate-500 mt-1">Kullanıcılardan gelen tüm geri bildirimler</p>
                </div>
                <button onClick={fetchFeedbacks} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Yenile
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard value={stats.total} label="Toplam" color="slate" />
                <StatCard value={stats.new} label="Bekleyen" color="blue" />
                <StatCard value={stats.resolved} label="Çözülen" color="green" />
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ id: 'all', label: 'Tümü' }, { id: 'new', label: 'Bekleyen' }, { id: 'resolved', label: 'Çözülen' }].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredFeedbacks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Henüz geri bildirim yok</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredFeedbacks.map(fb => (
                        <div key={fb.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTypeIcon(fb.type)}
                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                            {fb.type === 'bug' ? 'Hata' : fb.type === 'feature' ? 'Öneri' : 'Diğer'}
                                        </span>
                                        {getStatusBadge(fb.status)}
                                    </div>
                                    <p className="text-slate-900 font-medium leading-relaxed">{fb.message}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                                        <span>{fb.profiles?.full_name || fb.profiles?.email || 'Bilinmeyen'}</span>
                                        <span>•</span>
                                        <span>{fb.clinics?.name || 'Bilinmeyen Klinik'}</span>
                                        <span>•</span>
                                        <span>{new Date(fb.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                                {fb.status === 'new' && (
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => updateStatus(fb.id, 'resolved')} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100">Çözüldü</button>
                                        <button onClick={() => updateStatus(fb.id, 'dismissed')} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100">Reddet</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== CLINICS PANEL ====================
function ClinicsPanel() {
    const [clinics, setClinics] = useState([]);
    const [stats, setStats] = useState({ totalClinics: 0, totalRevenue: 0, totalClients: 0, totalAppointments: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClinicsData();
    }, []);

    const fetchClinicsData = async () => {
        setLoading(true);
        try {
            // Fetch all clinics with their data
            const { data: clinicsData, error: clinicsError } = await superAdminAPI.getClinicsOverview();

            if (clinicsError) throw clinicsError;

            // Calculate stats for each clinic
            const enrichedClinics = (clinicsData || []).map(clinic => {
                const clientCount = clinic.clients?.length || 0;
                const appointmentCount = clinic.appointments?.length || 0;
                const completedCount = clinic.appointments?.filter(a => a.status === 'Completed').length || 0;
                const revenue = clinic.transactions
                    ?.filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

                return {
                    ...clinic,
                    clientCount,
                    appointmentCount,
                    completedCount,
                    revenue
                };
            });

            setClinics(enrichedClinics);

            // Calculate global stats
            setStats({
                totalClinics: enrichedClinics.length,
                totalRevenue: enrichedClinics.reduce((sum, c) => sum + c.revenue, 0),
                totalClients: enrichedClinics.reduce((sum, c) => sum + c.clientCount, 0),
                totalAppointments: enrichedClinics.reduce((sum, c) => sum + c.appointmentCount, 0)
            });

        } catch (err) {
            console.error('Clinics fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Building2 className="w-7 h-7 text-primary" />
                        Klinikler
                    </h1>
                    <p className="text-slate-500 mt-1">Tüm kliniklerin genel görünümü</p>
                </div>
                <button onClick={fetchClinicsData} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Yenile
                </button>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl text-white">
                    <Building2 className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-3xl font-bold">{stats.totalClinics}</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Toplam Klinik</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white">
                    <DollarSign className="w-8 h-8 mb-3 text-emerald-200" />
                    <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-emerald-200 font-medium mt-1">Toplam Ciro</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
                    <Users className="w-8 h-8 mb-3 text-blue-200" />
                    <p className="text-3xl font-bold">{stats.totalClients}</p>
                    <p className="text-sm text-blue-200 font-medium mt-1">Toplam Müşteri</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white">
                    <Calendar className="w-8 h-8 mb-3 text-purple-200" />
                    <p className="text-3xl font-bold">{stats.totalAppointments}</p>
                    <p className="text-sm text-purple-200 font-medium mt-1">Toplam Randevu</p>
                </div>
            </div>

            {/* Clinics List */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : clinics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Henüz klinik yok</p>
                </div>
            ) : (
                <ResponsiveTable
                    columns={[
                        createColumn({
                            key: 'name',
                            label: 'Klinik',
                            primary: true,
                            render: (value) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-bold text-slate-900">{value}</span>
                                </div>
                            ),
                        }),
                        createColumn({
                            key: 'clientCount',
                            label: 'Müşteriler',
                            render: (value) => <span className="font-bold text-slate-900">{value}</span>,
                        }),
                        createColumn({
                            key: 'appointmentCount',
                            label: 'Randevular',
                            hideOnMobile: true,
                            render: (value) => <span className="font-bold text-slate-900">{value}</span>,
                        }),
                        createColumn({
                            key: 'completedCount',
                            label: 'Tamamlanan',
                            render: (value) => <span className="font-bold text-green-600">{value}</span>,
                        }),
                        createColumn({
                            key: 'revenue',
                            label: 'Ciro',
                            render: (value) => <span className="font-bold text-emerald-600">{formatCurrency(value)}</span>,
                        }),
                        createColumn({
                            key: 'created_at',
                            label: 'Kayıt Tarihi',
                            hideOnMobile: true,
                            render: (value) => new Date(value).toLocaleDateString('tr-TR'),
                        }),
                    ]}
                    data={clinics}
                    keyField="id"
                    emptyMessage="Henüz klinik yok"
                />
            )}
        </div>
    );
}

// ==================== SHARED COMPONENTS ====================
function StatCard({ value, label, color }) {
    const colors = {
        slate: 'text-slate-900',
        blue: 'text-blue-600',
        green: 'text-green-600',
    };
    return (
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
            <p className="text-sm text-slate-500 font-medium mt-1">{label}</p>
        </div>
    );
}

// ==================== BETA WAITLIST PANEL ====================
import BetaWaitlist from '../pages/admin/BetaWaitlist';

function BetaWaitlistPanel() {
    return <BetaWaitlist />;
}
