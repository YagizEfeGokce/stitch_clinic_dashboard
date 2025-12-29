import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export default function ServiceAnalytics({ appointments }) {
    // 1. Group by Service
    const data = appointments.reduce((acc, curr) => {
        const name = curr.services?.name || 'Unknown';
        const existing = acc.find(i => i.name === name);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name, value: 1 });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

    // Metric: Top Service Percentage
    const total = data.reduce((sum, i) => sum + i.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl">
                    <p className="font-bold text-slate-900">{payload[0].name}</p>
                    <p className="text-sm text-primary font-semibold">
                        {payload[0].value} appointments
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Popular Treatments</h3>
                <p className="text-xs text-slate-500">Distribution of services performed</p>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-xs text-slate-500 font-medium ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-900">{total}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
