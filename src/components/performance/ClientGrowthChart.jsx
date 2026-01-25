import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClientGrowthChart({ clients }) {
    // Group clients by month created
    const data = clients.reduce((acc, client) => {
        const date = new Date(client.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const existing = acc.find(i => i.date === key);
        if (existing) {
            existing.newClients += 1;
        } else {
            acc.push({
                date: key,
                displayDate: date.toLocaleDateString('tr-TR', { month: 'short' }),
                newClients: 1
            });
        }
        return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date)).slice(-6); // Last 6 months

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Müşteri Büyümesi</h3>
                    <p className="text-xs text-slate-500">Yeni müşteri kazanım trendi</p>
                </div>
                {data.length > 0 && (
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-900">{data[data.length - 1].newClients}</span>
                        <p className="text-xs text-green-500 font-bold flex items-center justify-end gap-1">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            Geçen Ay
                        </p>
                    </div>
                )}
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                            formatter={(value) => [value, 'Yeni Müşteri']}
                        />
                        <Area
                            type="monotone"
                            dataKey="newClients"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorClients)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
