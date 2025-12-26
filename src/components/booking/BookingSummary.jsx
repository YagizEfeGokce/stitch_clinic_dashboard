export default function BookingSummary({ data, onConfirm }) {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-6">Confirm Appointment</h2>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</span>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="size-10 rounded-full bg-cover bg-center bg-slate-200" style={{ backgroundImage: data.client.image ? `url('${data.client.image}')` : undefined }}></div>
                        <p className="font-bold text-slate-900 text-lg">{data.client.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service</span>
                        <p className="font-bold text-slate-900 mt-1">{data.service.name}</p>
                        <p className="text-sm text-slate-500">{data.service.duration}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</span>
                        <p className="font-bold text-slate-900 mt-1">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-sm text-slate-500">{data.time}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Total Price</span>
                    <span className="font-extrabold text-2xl text-primary">{data.service.price}</span>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <button
                    onClick={onConfirm}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                >
                    Confirm Booking
                </button>
            </div>
        </div>
    );
}
