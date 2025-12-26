import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';
import { useMemo } from 'react';

export default function RevenueChart({ transactions = [] }) {
    // Process data to get daily revenue for the current month
    const chartData = useMemo(() => {
        const incomeTxns = transactions.filter(t => t.type === 'Income');

        // Group by date
        const grouped = incomeTxns.reduce((acc, t) => {
            const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            acc[date] = (acc[date] || 0) + parseFloat(t.amount);
            return acc;
        }, {});

        // Convert to array and sort by date (simplified logic for demo)
        // ideally we would fill in missing dates with 0
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    const totalRevenue = transactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return (
        <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-card border border-slate-100 h-full">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Revenue Trends</h3>
                    <p className="text-xs text-slate-500">Income over time</p>
                </div>
            </div>

            <div className="flex items-end gap-2">
                <h2 className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</h2>
            </div>

            <div className="w-full h-[200px] mt-2">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11 }}
                                tickFormatter={(value) => {
                                    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                                    return `$${value}`;
                                }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#0D9488', strokeWidth: 1, strokeDasharray: '4 4' }}
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#0D9488"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        No income data specific to graph
                    </div>
                )}
            </div>
        </div>
    );
}
