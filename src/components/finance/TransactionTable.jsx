import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TransactionTable({ transactions, onRefresh }) {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!confirmDeleteId) return;

        try {
            setDeletingId(confirmDeleteId);
            setConfirmDeleteId(null);

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', confirmDeleteId);

            if (error) throw error;
            onRefresh();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Failed to delete transaction');
        } finally {
            setDeletingId(null);
        }
    };

    if (!transactions || transactions.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <span className="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">İşlem Bulunamadı</h3>
                <p className="text-slate-500 text-sm mt-1">Başlamak için ilk gelir veya giderinizi ekleyin.</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg">Son İşlemler</h3>
                    <button className="text-primary text-sm font-bold hover:underline">Tümünü Gör</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="px-5 py-3 first:pl-6">İşlem</th>
                                <th className="px-5 py-3">Kategori</th>
                                <th className="px-5 py-3">Tarih</th>
                                <th className="px-5 py-3">Miktar</th>
                                <th className="px-5 py-3 text-right first:pr-6">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                            {transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4 first:pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold">{t.description}</p>
                                                <p className="text-[11px] text-slate-400 font-bold uppercase">{t.payment_method}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500">
                                        {new Date(t.date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className={`px-5 py-4 font-bold text-[15px] ${t.type === 'income' ? 'text-green-600' : 'text-slate-900'
                                        }`}>
                                        {t.type === 'income' ? '+' : '-'}₺{parseFloat(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-5 py-4 text-right first:pr-6">
                                        <button
                                            onClick={() => handleDeleteClick(t.id)}
                                            disabled={deletingId === t.id}
                                            className="size-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                            aria-label="İşlemi Sil"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {deletingId === t.id ? 'progress_activity' : 'delete'}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-2xl">delete</span>
                        </div>
                        <h3 className="text-center text-lg font-bold text-slate-900 mb-2">İşlemi Sil?</h3>
                        <p className="text-center text-slate-500 text-sm mb-6">
                            Bu işlem geri alınamaz. Bu işlemi silmek istediğinizden emin misiniz?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
