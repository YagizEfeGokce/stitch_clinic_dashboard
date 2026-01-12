import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, Building2, TrendingUp, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { data: statsData, error: statsError } = await supabase.rpc('get_platform_stats');
            if (statsError) throw statsError;
            setStats(statsData);

            // 2. Fetch Clinics
            const { data: clinicsData, error: clinicsError } = await supabase.rpc('get_all_clinics');
            if (clinicsError) throw clinicsError;
            setClinics(clinicsData || []);

        } catch (error) {
            console.error('Admin Fetch Error:', error);
            // alert('Admin verisi çekilemedi. Yetkiniz olmayabilir.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Platform Yönetimi</h1>
                <p className="text-slate-500">Tüm sistem metrikleri ve klinikler.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatsCard
                    label="Toplam Klinik"
                    value={stats?.total_clinics || 0}
                    icon={Building2}
                    color="blue"
                />
                <StatsCard
                    label="Aktif Pro Üyeler"
                    value={stats?.active_pro_users || 0}
                    icon={Users}
                    color="emerald"
                />
                <StatsCard
                    label="SaaS Geliri (MRR)"
                    value={`₺${stats?.mrr || 0}`}
                    subtext="Aylık Tahmini"
                    icon={CreditCard}
                    color="violet"
                />
                <StatsCard
                    label="Toplam Randevu"
                    value={stats?.total_appointments || 0}
                    icon={TrendingUp}
                    color="amber"
                />
            </div>

            {/* Recent Clinics Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Kayıtlı Klinikler</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500">
                        {clinics.length} Klinik Bulundu
                    </span>
                </div>

                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Klinik Adı</th>
                            <th className="px-6 py-3">Üyelik</th>
                            <th className="px-6 py-3">Durum</th>
                            <th className="px-6 py-3">Kayıt Tarihi</th>
                            <th className="px-6 py-3 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clinics.map((clinic) => (
                            <tr key={clinic.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900">
                                    {clinic.name}
                                    <div className="text-xs text-slate-400 font-normal">{clinic.owner_email || 'Email yok'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${clinic.subscription_tier === 'pro' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                        {clinic.subscription_tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                                        ${clinic.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            clinic.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
                                    `}>
                                        {clinic.subscription_status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                    {new Date(clinic.created_at).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-primary font-medium text-xs">
                                        Detay
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatsCard({ label, value, icon: Icon, color, subtext }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-black text-slate-900">{value}</h3>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}
