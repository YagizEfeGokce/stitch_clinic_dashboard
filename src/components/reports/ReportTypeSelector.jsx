export default function ReportTypeSelector({ selected, onSelect }) {

    const types = [
        {
            id: 'financial',
            title: 'Financial Summary',
            subtitle: 'Revenue & Taxes',
            icon: 'payments',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkINgalJCUXOutAoYcCrou7jzMvAIUayChrlitoNu2oRcCXWoNZPjyglCjRAWcnN7zsNOTcB1K3ophMC1F3ZbAbWH1mEBoq4lUZ6Py0v2D3q_nmB9lP_qQgGt1POcOMYYdelaGCjh000jVbrW0nYu8uouSjiRsjz9Zn71B6JU6r0BmOqBjQYd9zorp_SWmVjUoZYsd9DZxObzBpVuUG4xZddMLMaZ1jDpunqdzX_g7VhJzrOgRQXnmz1mICUEAxijTCg0r_-kFs_cL'
        },
        {
            id: 'appointments',
            title: 'Appointment Log',
            subtitle: 'Daily Schedule',
            icon: 'calendar_today',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx3DUH0K0_TBNup0h5Tu5KVDxNPrHcEvBYh8fhH0AlUIbTogNLkzQqd3ltONMv_J8j5p8hpFc_SbFHxGuoFsSyFAvQMRtHPeYI6cA3h1rWRKzUeSE32xg8uXA8v9JwUb7VZJ9S2dbWFp8DuZjrqd_Jf1ceA75w3vOlgJQEEpe7GR3Md24u49yRu-fzUHasQtrIHsbLIeyKyamztX1F2s26j0XqJZT2NFO-E7wWFBnLQzdVEa3ic2P672TzHXgjYAAUQl4pOFNwwOEm'
        },
        {
            id: 'clients',
            title: 'Client List',
            subtitle: 'Demographics',
            icon: 'groups',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlAgK6ZPjvrhNDJqkTXGCVyeyGPXfCTc963BlLw-gvGI8Dg572qrVQ-f06mswkoX_OTko-S6jgyf3AriVuCkZqEJlvklKFOPE1BBHtv6uja6vjJRrIvI3m43Mb9x9_SRS33B8410F4JoRUfxZA0uj9Fw4GjN3yf5CkfdGh9m51-SnH5GyrqqwRYbyuWx0NDDrUZ0tgPpR0WhcgvNXeNKYTqh8WJD4wtHDh5_KAmZvt0nmzNzY7xEieU-zycT7OIrvzH6meSo9u4m3I'
        },
        {
            id: 'performance',
            title: 'Performance',
            subtitle: 'Efficiency KPIs',
            icon: 'trending_up',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpbvXhY32ItASt1y4RpFXTm3lYVt-aFXfZLaeU2DsBx1Unn_5qO1oGkBoZGNU7uB4yagpljCtbYUiJm_TWjKhMcIP1oaKEAaWrNE6IFL36d_C-ztlHzh1rgbwQ76LkyK7dKAvKigxLG0F79Vu5qRj0ZqaOCD2nySisrKKCLrK1-r1sWVAiZmT2n-oAR5xkXgol558yN4i0SCiS8zziD-dQ59NFA9m_qpJ09IqzYuJBv09rVkGTOwiHoBzKwrDubGSzbkreEoW1Lqpi'
        }
    ];

    return (
        <section className="px-6 py-4">
            <div className="mb-4">
                <h2 className="text-[22px] font-bold text-slate-900 dark:text-white leading-tight">Report Type</h2>
                <p className="text-sm text-slate-500">Select the data category you wish to export.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {types.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onSelect(type.id)}
                        className={`group relative flex flex-col gap-3 p-3 rounded-2xl bg-white shadow-sm transition-all text-left border-2 ${selected === type.id ? 'border-primary' : 'border-transparent hover:border-primary/30'
                            }`}
                    >
                        {selected === type.id && (
                            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center z-10 shadow-sm">
                                <span className="material-symbols-outlined text-white text-sm">check</span>
                            </div>
                        )}
                        <div
                            className="w-full aspect-[4/3] bg-cover bg-center rounded-xl transition-opacity group-hover:opacity-100"
                            style={{ backgroundImage: `url('${type.image}')`, opacity: selected === type.id ? 1 : 0.9 }}
                        ></div>
                        <div>
                            <p className="text-slate-900 text-sm font-bold leading-normal">{type.title}</p>
                            <p className={`${selected === type.id ? 'text-primary' : 'text-slate-500'} text-xs font-medium`}>{type.subtitle}</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
