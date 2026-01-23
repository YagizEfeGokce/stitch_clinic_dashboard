import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ResponsiveTable, createColumn } from '../ui/ResponsiveTable';

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

    // Column definitions for ResponsiveTable
    const columns = [
        createColumn({
            key: 'description',
            label: 'İşlem',
            primary: true,
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${row.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {row.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold">{value}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase">{row.payment_method}</p>
                    </div>
                </div>
            ),
        }),
        createColumn({
            key: 'category',
            label: 'Kategori',
            hideOnMobile: true,
            render: (value) => (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                    {value}
                </span>
            ),
        }),
        createColumn({
            key: 'date',
            label: 'Tarih',
            render: (value) => new Date(value).toLocaleDateString('tr-TR'),
        }),
        createColumn({
            key: 'amount',
            label: 'Miktar',
            render: (value, row) => (
                <span className={`font-bold text-[15px] ${row.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                    {row.type === 'income' ? '+' : '-'}₺{parseFloat(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
            ),
        }),
    ];

    // Render action buttons
    const renderActions = (row) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.id);
            }}
            disabled={deletingId === row.id}
            className="size-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
            aria-label="İşlemi Sil"
        >
            <span className="material-symbols-outlined text-[18px]">
                {deletingId === row.id ? 'progress_activity' : 'delete'}
            </span>
        </button>
    );

    return (
        <>
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg">Son İşlemler</h3>
                    <button className="text-primary text-sm font-bold hover:underline">Tümünü Gör</button>
                </div>

                <div className="p-4">
                    <ResponsiveTable
                        columns={columns}
                        data={transactions || []}
                        renderActions={renderActions}
                        emptyMessage="Başlamak için ilk gelir veya giderinizi ekleyin."
                        keyField="id"
                    />
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
