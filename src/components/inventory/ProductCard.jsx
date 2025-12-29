import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ProductCard({ product, onEdit, onDelete }) {
    const { role } = useAuth();
    const [stock, setStock] = useState(product.stock);
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Sync state if prop updates
    useEffect(() => {
        setStock(product.stock);
    }, [product.stock]);

    const isLowStock = stock <= (product.min_stock_alert || 5);
    const isOutOfStock = stock === 0;

    const saveStock = async (newVal) => {
        const val = parseInt(newVal, 10);
        if (isNaN(val) || val < 0) {
            setStock(product.stock); // Revert to original
            return;
        }

        // Optimistic update
        setStock(val);
        setLoading(true);

        try {
            const { error } = await supabase
                .from('inventory')
                .update({ stock: val })
                .eq('id', product.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating stock:', error);
            setStock(product.stock); // Revert
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className={`bg-white rounded-2xl p-4 shadow-card border ${isLowStock ? 'border-l-4 border-l-rose-400 border-y-slate-100 border-r-slate-100' : 'border-slate-100'} flex flex-col gap-4 relative overflow-visible transition-all`}>
            {isLowStock && <div className="absolute inset-0 bg-rose-50/30 pointer-events-none rounded-2xl"></div>}

            <div className="flex gap-4 relative z-10">
                <div className={`h-16 w-16 shrink-0 rounded-xl bg-slate-50 overflow-hidden ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-1 flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{product.name}</h3>

                        {/* Menu */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-50"
                            >
                                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                            </button>

                            {/* Backdrop to close menu */}
                            {showMenu && (
                                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)}></div>
                            )}

                            {showMenu && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(product);
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span> Düzenle
                                    </button>
                                    {(role === 'admin' || role === 'owner' || role === 'doctor') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(product.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span> Sil
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">{product.category} • SKU: {product.sku || 'Belirtilmedi'}</p>
                    <div className="mt-2 flex items-center gap-2">
                        {isOutOfStock ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-500/20">Stok Yok</span>
                        ) : isLowStock ? (
                            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-500 ring-1 ring-inset ring-rose-200">Düşük Stok</span>
                        ) : (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Stokta</span>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex items-center justify-between border-t ${isLowStock ? 'border-rose-100' : 'border-slate-100'} pt-3 relative z-10`}>
                <div className={`text-sm font-medium ${isLowStock ? 'text-rose-500' : 'text-slate-500'}`}>
                    {isOutOfStock ? `Sipariş Limiti: ${product.min_stock_alert || 5}` : 'Mevcut Stok'}
                </div>

                {isOutOfStock ? (
                    <button onClick={() => saveStock(10)} className="text-sm font-semibold text-primary hover:underline">Stok Ekle</button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => saveStock(Math.max(0, stock - 1))}
                            disabled={loading}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>

                        <input
                            type="number"
                            value={String(stock)}
                            onChange={(e) => setStock(e.target.value)}
                            onBlur={(e) => saveStock(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="text-base font-bold text-slate-900 w-12 text-center bg-transparent border-none p-0 focus:ring-0 appearance-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button
                            onClick={() => saveStock(stock + 1)}
                            disabled={loading}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
