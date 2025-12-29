import { useMemo } from 'react';

export default function InventoryStats({ products = [] }) {
    const stats = useMemo(() => {
        const totalProducts = products.length;
        const lowStockCount = products.filter(p => p.stock <= (p.min_stock_alert || 5) && p.stock > 0).length;
        const outOfStockCount = products.filter(p => p.stock === 0).length;
        // Calculate total value (stock * price)
        const totalValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);

        return { totalProducts, lowStockCount, outOfStockCount, totalValue };
    }, [products]);

    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x px-5 -mx-5">
            {/* Stat Card 1: Total Products */}
            <div className="snap-center min-w-[160px] flex-1 bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
                    <p className="text-xs font-medium text-slate-500">Toplam Ürün</p>
                </div>
            </div>

            {/* Stat Card 2: Low Stock Alert */}
            <div className={`snap-center min-w-[160px] flex-1 bg-white p-4 rounded-2xl shadow-card border flex flex-col gap-3 relative overflow-hidden ${stats.lowStockCount > 0 ? 'border-amber-300' : 'border-slate-100'}`}>
                {stats.lowStockCount > 0 && <div className="absolute right-0 top-0 w-12 h-12 bg-amber-50 rounded-bl-3xl"></div>}

                <div className="flex items-center justify-between relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                    </div>
                    {stats.lowStockCount > 0 && <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Uyarı</span>}
                </div>
                <div className="relative z-10">
                    <p className="text-2xl font-bold text-slate-900">{stats.lowStockCount}</p>
                    <p className="text-xs font-medium text-slate-500">Düşük Stok</p>
                </div>
            </div>

            {/* Stat Card 3: Out of Stock */}
            <div className={`snap-center min-w-[160px] flex-1 bg-white p-4 rounded-2xl shadow-card border flex flex-col gap-3 relative overflow-hidden ${stats.outOfStockCount > 0 ? 'border-rose-300' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.outOfStockCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[18px]">unpublished</span>
                    </div>
                </div>
                <div className="relative z-10">
                    <p className="text-2xl font-bold text-slate-900">{stats.outOfStockCount}</p>
                    <p className="text-xs font-medium text-slate-500">Stok Yok</p>
                </div>
            </div>

            {/* Stat Card 4: Value */}
            <div className="snap-center min-w-[160px] flex-1 bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined text-[18px]">attach_money</span>
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900">₺{stats.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs font-medium text-slate-500">Stok Değeri</p>
                </div>
            </div>
        </div>
    );
}
