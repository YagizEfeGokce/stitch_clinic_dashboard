export default function TransactionList() {
    const transactions = [
        {
            id: 1,
            name: "Sarah Jensen",
            service: "Full Face Rejuvenation",
            amount: "+$3,200",
            date: "Today",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa0HehYK2mQv1orwfb7_2eAqA5kUH7hiQ_ybJ1TM5QjSKy7DypMAGhjGLuWrKoUvZlAHvlbrVg-zioPUDIPqFQPGQt4mczpVmLmvtHzbxf2g_M1KvG-AvnpVXwfmRP1ONl3S0RYzuJtnYqwPAJibcq41J1jhOm2pLBXvMQOPkVAM1m_c6y-9NlH5Zi7guNnElXhhgv-iZFgDUu2a_68shOuCKuEfGqLoN0vn-tWIXqi--lNFF173P6Z4z3j5Da-Z8Bk4lwyymHBSUy"
        },
        {
            id: 2,
            name: "Michael Chen",
            service: "CoolSculpting Session",
            amount: "+$1,850",
            date: "Yesterday",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNqD4ZqLlLPPc6oOJAM1ox8B6zz191zwvRZiiKKCCufTm2hxCqu2vbt61kfqXI5-jcSvfxtCBVBGQ1ha6Zab5fK6fKe3PGClYRJHWIPBNp4bZTuPnEgC6D2DyMvjwyGTul1kskMRlONjhJLMc9DIrsc7Y30wDgd58GYRlRBKmSSmYgMVnE0W53dKUYEbasLtoh9B2kGcBT5CowQc99eSR3CzAW155C2HVyFBPcLKAemLPKyPU4OnZ-GbhyOZqK8il5VxBIOG2qjyCR"
        },
        {
            id: 3,
            name: "Emily Davis",
            service: "Botox & Fillers",
            amount: "+$950",
            date: "Nov 28",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOVxplS6mWW2xs4oo78tCX4qvTG5weSICJLw_K-DC-1pEllkJQVeA8vcFCUcjmwY312AzBx90-C9J2JOCMoAdvTq4DY7H9ZQAuEkh8W7R1etzsujSj6BVC6GJkw0XrEojYFDEFWH-6kqYMPCGpOKp7xR-X1wI_LPbq8UF_ltQcoO4KaDZQZg9w_EnsVVv786ZSAa0umV--ubYgml4LXzqbotyuOOryP3Cecdhg4NtAb4WQ56f1PLf4-d-D4zlm5_F6-b4zacM1aoVG"
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-900">Recent High-Value</h3>
                <button className="text-sm font-bold text-primary hover:text-primary-dark">View All</button>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <div className="size-10 rounded-full bg-slate-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${tx.image}')` }}></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{tx.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{tx.service}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-primary">{tx.amount}</p>
                            <p className="text-xs text-slate-500 font-medium">{tx.date}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
