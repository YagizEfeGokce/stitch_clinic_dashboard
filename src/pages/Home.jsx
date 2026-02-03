import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ActionCenter from '../components/dashboard/ActionCenter';
import { HomeSkeleton } from '../components/ui/skeletons';
import { PageErrorBoundary } from '../components/errors';
import { useDashboardData } from '../hooks/useDashboardData';

export default function Home() {
    const { user, profile } = useAuth();
    const { stats, upcomingAppointments, loading } = useDashboardData();

    // Compute display name safely
    const displayName = profile?.first_name || profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Doctor';

    const getRelativeDateLabel = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (dateStr === today) return 'Bugün';
        if (dateStr === tomorrow) return 'Yarın';
        return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return <HomeSkeleton />;
    }

    return (
        <PageErrorBoundary pageName="Ana Sayfa">
            <div className="pb-24 pt-6 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col gap-1 mb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Hoş Geldiniz, {displayName} 👋
                            </h1>
                            <p className="text-slate-500 font-medium">Bugün Dermdesk Klinik'te neler oluyor...</p>
                        </div>
                    </div>
                </header>

                {/* Action Center - Now visible on Home too */}
                <ActionCenter />

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">calendar_today</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">{stats.appointmentsToday}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Bugünkü Randevular</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">{stats.activeClients}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Aktif Hastalar</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform col-span-2 md:col-span-1">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <span className="text-3xl font-bold text-slate-900">{stats.occupancyRate}%</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Doluluk Oranı</span>
                    </div>
                </div>

                {/* Quick Access Actions */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Link to="/schedule" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                        <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Takvimi Gör</span>
                            <span className="block text-[10px] text-slate-500">Randevuları yönet</span>
                        </div>
                    </Link>
                    <Link to="/clients" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">person_add</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Yeni Hasta</span>
                            <span className="block text-[10px] text-slate-500">Profil kaydı oluştur</span>
                        </div>
                    </Link>
                    <Link to="/finance" className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-xl shadow-sm min-w-max hover:bg-slate-50 transition-colors">
                        <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-slate-900">Ödeme Kaydet</span>
                            <span className="block text-[10px] text-slate-500">İşlem ekle</span>
                        </div>
                    </Link>
                </div>

                {/* Upcoming Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Sırada</h2>
                        <Link to="/schedule" className="text-sm font-bold text-primary hover:text-primary-dark">Takvimi Gör</Link>
                    </div>

                    {upcomingAppointments.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-500">Yaklaşan randevu yok.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map(apt => (
                                <Link
                                    key={apt.id}
                                    to={`/clients/${apt.client_id}`}
                                    className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex flex-col items-center justify-center min-w-[4rem] bg-indigo-50 text-indigo-700 rounded-lg py-2 px-1 text-center group-hover:bg-indigo-100 transition-colors">
                                        <span className="text-[10px] font-extrabold uppercase leading-none mb-1">{getRelativeDateLabel(apt.date)}</span>
                                        <span className="text-sm font-bold leading-none">{apt.time.substring(0, 5)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                            {apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name}` : 'Bilinmeyen Müşteri'}
                                        </h4>
                                        <p className="text-sm text-slate-500 truncate">{apt.services?.name || 'Konsültasyon'}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${apt.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-700' :
                                        apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {apt.status === 'Confirmed' ? 'Onaylandı' :
                                            apt.status === 'Completed' ? 'Tamamlandı' :
                                                apt.status === 'Cancelled' ? 'İptal' :
                                                    apt.status === 'Scheduled' ? 'Planlandı' :
                                                        apt.status === 'Pending' ? 'Bekliyor' :
                                                            apt.status}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageErrorBoundary>
    );
}
