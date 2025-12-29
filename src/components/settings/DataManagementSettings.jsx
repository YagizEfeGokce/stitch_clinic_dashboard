import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function DataManagementSettings() {
    const { toast } = useToast();
    const [loadingApt, setLoadingApt] = useState(false);
    const [loadingClient, setLoadingClient] = useState(false);

    const downloadCSV = (content, fileName) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportAppointments = async () => {
        setLoadingApt(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id, date, time, status, notes,
                    service_name,
                    clients (first_name, last_name, phone, email),
                    profiles (full_name)
                `)
                .order('date', { ascending: false });

            if (error) throw error;

            // Convert to CSV
            const header = ['ID', 'Tarih', 'Saat', 'Durum', 'Hizmet', 'Müşteri Adı', 'Müşteri Tel', 'Personel', 'Notlar'];
            const rows = data.map(row => [
                row.id,
                row.date,
                row.time,
                row.status,
                row.service_name,
                row.clients ? `${row.clients.first_name} ${row.clients.last_name}` : 'Bilinmeyen',
                row.clients?.phone || '',
                row.profiles?.full_name || 'Atanmamış',
                (row.notes || '').replace(/,/g, ' ') // Simple CSV escape
            ]);

            const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
            downloadCSV(csvContent, `randevu_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Randevular başarıyla dışa aktarıldı');
        } catch (err) {
            console.error('Export Error:', err);
            toast.error('Randevular dışa aktarılamadı');
        } finally {
            setLoadingApt(false);
        }
    };

    const exportClients = async () => {
        setLoadingClient(true);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('last_name', { ascending: true });

            if (error) throw error;

            const header = ['ID', 'Ad', 'Soyad', 'Telefon', 'E-posta', 'Oluşturulma Tarihi'];
            const rows = data.map(row => [
                row.id,
                row.first_name,
                row.last_name,
                row.phone || '',
                row.email || '',
                row.created_at
            ]);

            const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
            downloadCSV(csvContent, `musteri_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Müşteriler başarıyla dışa aktarıldı');
        } catch (err) {
            console.error('Export Error:', err);
            toast.error('Müşteriler dışa aktarılamadı');
        } finally {
            setLoadingClient(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-slate-900 text-xl font-bold leading-tight mb-4">Veri Yönetimi</h3>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">

                <div className="flex items-start gap-4">
                    <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">download</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-slate-900 font-bold mb-1">Verileri Dışa Aktar</h4>
                        <p className="text-sm text-slate-500 mb-4">Yedekleme veya analiz için klinik verilerinizi CSV formatında indirin.</p>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={exportAppointments}
                                disabled={loadingApt}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                {loadingApt ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">calendar_month</span>}
                                Randevuları İndir
                            </button>
                            <button
                                onClick={exportClients}
                                disabled={loadingClient}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                {loadingClient ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">group</span>}
                                Müşterileri İndir
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                <div className="flex items-start gap-4 opacity-50 cursor-not-allowed">
                    <div className="size-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">delete_forever</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-slate-900 font-bold mb-1">Tehlikeli Bölge</h4>
                        <p className="text-sm text-slate-500 mb-4">Geri alınamaz işlemler.</p>
                        <button disabled className="px-4 py-2 rounded-lg bg-red-50 text-red-400 font-bold text-sm cursor-not-allowed">
                            Hesap Verilerini Sıfırla
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
