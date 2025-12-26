import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#0D9488', '#A855F7', '#FBBF24', '#F43F5E', '#3B82F6'];

export default function RevenueBreakdown({ transactions = [] }) {
    const { totalIncome, data } = useMemo(() => {
        const incomeTxns = transactions.filter(t => t.type === 'Income');
        const total = incomeTxns.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const grouped = incomeTxns.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

        const chartData = Object.entries(grouped)
            .map(([name, value], index) => ({
                name,
                value: Math.round((value / total) * 100), // percentage
                amount: value,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);

        return { totalIncome: total, data: chartData };
    }, [transactions]);

    return (
        <div className="p-5 bg-white rounded-2xl shadow-card border border-slate-100 h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-4">Income by Category</h3>

            {data.length > 0 ? (
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-32 h-32 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xs text-slate-500">Total</span>
                            <span className="text-sm font-bold text-slate-900">${(totalIncome / 1000).toFixed(1)}k</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 min-w-0 overflow-y-auto max-h-[160px] pr-2">
                        {data.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-sm text-slate-700 font-medium truncate">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    No income data to breakdown
                </div>
            )}
        </div>
    );
}
