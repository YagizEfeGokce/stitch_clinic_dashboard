import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AppointmentVolumeChart() {
    const data = [
        { name: 'Mon', value: 30 },
        { name: 'Tue', value: 45 },
        { name: 'Wed', value: 40 },
        { name: 'Thu', value: 65 },
        { name: 'Fri', value: 55 },
        { name: 'Sat', value: 85 },
        { name: 'Sun', value: 20 },
    ];

    return (
        <section className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-slate-900 text-lg font-bold">Appointment Volume</h2>
                    <p className="text-slate-500 text-xs mt-1">Weekly performance</p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-2xl font-bold text-primary">324</p>
                    <p className="text-xs text-green-600 font-medium">+8% this week</p>
                </div>
            </div>

            <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ stroke: '#0D9488', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#0D9488"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVolume)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
