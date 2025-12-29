import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { user, profile } = useAuth();
    const { toasts, removeToast } = useToast();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const [lowStockItems, setLowStockItems] = useState([]);

    // Fetch Low Stock Items
    useEffect(() => {
        const fetchLowStock = async () => {
            // Supabase filter for column comparison is tricky, better fetch all or use RPC. 
            // Simple approach: fetch all items where stock is low.

            const { data: inventory } = await supabase
                .from('inventory')
                .select('id, name, stock, min_stock_alert');

            if (inventory) {
                const low = inventory.filter(item => item.stock <= item.min_stock_alert);
                setLowStockItems(low);
            }
            try {
                const { data: inventory } = await supabase
                    .from('inventory')
                    .select('id, name, stock, min_stock_alert');

                if (inventory) {
                    const low = inventory.filter(item => item.stock <= (item.min_stock_alert || 5));
                    setLowStockItems(low);
                }
            } catch (e) {
                console.error("Error fetching stock:", e);
            }
        };

        fetchLowStock();
    }, []);

    // Combine toasts and stock alerts
    const allNotifications = [
        ...toasts,
        ...lowStockItems.map(item => ({
            id: `stock-${item.id}`,
            type: 'warning',
            message: `Low Stock: ${item.name} (${item.stock} left)`,
            action: () => navigate('/inventory')
        }))
    ];

    // Default name if no profile loaded yet
    const name = profile?.full_name || user?.user_metadata?.full_name || 'Dr. Ray';

    return (
        <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 relative z-30">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                    {/* Removed Profile/Date Header as per user request */}
                </div>
            </div>

            <div className="flex items-center gap-2 relative">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="size-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors relative"
                >
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                    {allNotifications.length > 0 && (
                        <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Bildirimler</h3>
                            <span className="text-xs font-medium text-slate-400">{allNotifications.length} Yeni</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {allNotifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Yeni bildirim yok
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {allNotifications.map((note, index) => (
                                        <div
                                            key={note.id || index}
                                            onClick={() => {
                                                if (note.action) {
                                                    note.action();
                                                    setShowNotifications(false);
                                                }
                                            }}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 relative group ${note.action ? 'cursor-pointer' : ''}`}
                                        >
                                            <div className={`mt-1 size-2 rounded-full shrink-0 ${note.type === 'error' ? 'bg-red-500' :
                                                note.type === 'warning' ? 'bg-amber-500' :
                                                    note.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 break-words">
                                                    {note.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {note.type === 'warning' ? 'Stok Uyarısı' : 'Az önce'}
                                                </p>
                                            </div>
                                            {!note.action && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeToast(note.id); }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
