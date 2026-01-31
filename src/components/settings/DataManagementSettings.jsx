import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { exportAllData } from '../../lib/exportData';

export default function DataManagementSettings() {
    const { success, error: showError } = useToast();
    const [loadingAll, setLoadingAll] = useState(false);

    const handleExportAll = async () => {
        setLoadingAll(true);
        try {
            const result = await exportAllData();
            if (result.hasErrors) {
                success('Verileriniz indirildi, ancak bazı tablolar hata içeriyor. Detaylar için hata.txt dosyasına bakın.');
            } else {
                success('Verileriniz başarıyla indirildi ✅');
            }
        } catch (err) {
            console.error('Export All Error:', err);
            showError('Dışa aktarma sırasında hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoadingAll(false);
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
                        <p className="text-sm text-slate-500 mb-4">Yedekleme veya analiz için klinik verilerinizi CSV formatında indirin. Finans ve performans verileri aylık olarak gruplandırılmıştır.</p>

                        <button
                            onClick={handleExportAll}
                            disabled={loadingAll}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingAll ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">folder_zip</span>
                            )}
                            Tüm Verileri İndir (ZIP)
                        </button>

                        <p className="text-xs text-slate-400 mt-3">
                            İçerik: Müşteriler, Hizmetler, Envanter, Randevular, Finans, Performans
                        </p>
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
