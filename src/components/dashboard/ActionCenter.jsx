import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI, inventoryAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const ActionCenter = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.clinic_id) {
            fetchActions();
        }
    }, [user?.clinic_id]);

    const fetchActions = async () => {
        try {
            // Parallel Fetching for "Actionable Items"
            const [pendingRes, statsRes] = await Promise.all([
                appointmentsAPI.getPendingCount(user.clinic_id),
                inventoryAPI.getInventoryStats(user.clinic_id)
            ]);

            const newActions = [];

            // 1. Pending Appointments
            if (pendingRes.count > 0) {
                newActions.push({
                    id: 'pending-apts',
                    icon: 'calendar_clock',
                    title: `${pendingRes.count} Bekleyen Randevu`,
                    subtitle: 'Onay gerekiyor',
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    path: '/schedule'
                });
            }

            // 2. Low Stock Items
            const lowStockCount = statsRes.data?.lowStockCount || 0;
            if (lowStockCount > 0) {
                newActions.push({
                    id: 'low-stock',
                    icon: 'inventory_2',
                    title: `${lowStockCount} Düşük Stoklu Ürün`,
                    subtitle: 'Sipariş gerekli',
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    path: '/inventory?filter=Low%20Stock'
                });
            }

            setActions(newActions);
        } catch (error) {
            console.error('Error fetching actions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Don't show anything while loading to avoid layout shift, or show skeleton
    if (actions.length === 0) return null; // Hide if nothing to do

    return (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Eylem Gerekiyor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map(action => (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.path)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left group"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">{action.title}</div>
                            <div className="text-xs font-medium text-slate-500">{action.subtitle}</div>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all">
                            arrow_forward_ios
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ActionCenter;
