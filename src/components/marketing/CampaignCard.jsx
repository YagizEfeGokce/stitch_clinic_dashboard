export default function CampaignCard({ campaign }) {
    const isRunning = campaign.status === 'Running';
    const isPaused = campaign.status === 'Paused';
    const isEnded = campaign.status === 'Ended';

    // Status visual config
    let statusColor = "text-green-600 bg-green-500";
    let statusText = "Running";
    let statusBg = "bg-white";

    if (isPaused) {
        statusColor = "text-yellow-600 bg-yellow-400";
        statusText = "Paused";
        statusBg = "bg-white opacity-90";
    } else if (isEnded) {
        statusColor = "text-slate-500 bg-slate-400";
        statusText = "Ended";
        statusBg = "bg-slate-50";
    }

    return (
        <div className={`${statusBg} rounded-2xl p-5 shadow-card border border-slate-100 relative overflow-hidden group transition-all hover:shadow-md`}>
            <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-primary">
                    <span className="material-symbols-outlined text-[24px]">more_horiz</span>
                </button>
            </div>

            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`flex h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-400' : isEnded ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isPaused ? 'text-yellow-600' : isEnded ? 'text-slate-500' : 'text-green-600'}`}>
                            {statusText}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{campaign.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{campaign.dateInfo}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Budget</p>
                    <p className="text-base font-bold text-slate-900">{campaign.budget}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Leads</p>
                    <p className="text-base font-bold text-slate-900">{campaign.leads}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Budget Spent</span>
                    <span className="text-primary font-bold">{campaign.spentPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isEnded ? 'bg-slate-400' : 'bg-primary'}`}
                        style={{ width: `${campaign.spentPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
