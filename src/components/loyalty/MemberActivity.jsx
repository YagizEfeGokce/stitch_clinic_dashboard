export default function MemberActivity() {
    const activities = [
        {
            id: 1,
            name: "Sarah Jenkins",
            points: "+250",
            type: "earn",
            tier: "Gold Member",
            tierColor: "bg-yellow-400",
            time: "2m ago",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBtLOtUjPs3BjDRsHp6bn62MPHUFeXkvivGDFhOTmYe_y9_2s8ve_PmRsjESlUHxG-wDeLmMhYW69AFSH1mnwHu5Od0Yod6FRgI1DUR4NUI3kWl8VCw-GRg8PzGzUmLcFbtoQAlYXvovqxTDWSAwSIKhCoOiwBRABnW0IAXSR9gEjt1Tf8XAA0eaMo7yn5arxICvhCbkGQgaz92hGDsDtFL65DRGE90WICDkfJnV37RG1SWtN8Ab_bPy_yQbM2IZr-KmrYPNZBG7iR"
        },
        {
            id: 2,
            name: "Michael Chen",
            points: "-1000",
            type: "redeem",
            tier: "Silver Member",
            tierColor: "bg-slate-300",
            time: "1h ago",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyb1X4rnzBbKBk21om30sJz0AccEjFiSa2JdGlDsvvSn4H7ckSP5OBoNkUy-npmxFgaHQMV64d9disD6Fva750RE8KPf3z3XzqfI8mNg95pjfxJJOPeuEDcfTCzccSj-14imSEi1fB83SAZj4vZvBnX4gmDJ_2lhG4VsVTfzC4nTFF5xG2pQkaVGoBNHwt-U33OVekFlvevIZp3OVrLgM9DfqXIQNaf4MLN7LpJKQoxMO9NSc-N1l4PikaWzEbBoTI7yTogvxCrp7v"
        },
        {
            id: 3,
            name: "Emma Wilson",
            points: "+85",
            type: "earn",
            tier: "Rose Gold",
            tierColor: "bg-rose-300",
            time: "3h ago",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs0ks1kscuatXCKqrc--W4ABKk6m-X7E3VvsNZZwgVfG_8-bZvY4y7yf4G25IQHZCRUp-fTTyizkrt3L0eRYqiPTB0jXwQgFEonNs2r6f83ybnYmqL3EjcmX17fziWcCoqGzHu-zKLZKl9ksOAyEKVeJjFHmFpiWOzQGNz_uISzkEUOcwsnW2bYrG-hxfIwAp_wQEc29cAsV6x0-VHvIQlD9SDauhNUdDoPfsn8IHis8ukzBWOEj74UNrByPdMwmKeGrRPYUOxzB-A"
        }
    ];

    return (
        <section>
            <h2 className="text-slate-900 text-lg font-bold mb-3">Recent Activity</h2>
            <div className="flex flex-col gap-3">
                {activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="h-12 w-12 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${activity.image}')` }}></div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{activity.name}</h4>
                                <span className={`font-bold text-sm ${activity.type === 'earn' ? 'text-primary' : 'text-rose-400'}`}>
                                    {activity.points} pts
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${activity.tierColor}`}></span> {activity.tier}
                                </span>
                                <span className="text-xs text-slate-400">{activity.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-3 text-sm text-primary font-bold bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                View All Activity
            </button>
        </section>
    );
}
