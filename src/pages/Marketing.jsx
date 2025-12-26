import MarketingStats from '../components/marketing/MarketingStats';
import CampaignCard from '../components/marketing/CampaignCard';

export default function Marketing() {
    const campaigns = [
        {
            id: 1,
            name: "Summer Botox Special",
            status: "Running",
            dateInfo: "Ends in 12 days",
            budget: "$2,000",
            leads: 45,
            spentPercent: 65
        },
        {
            id: 2,
            name: "New Client Facial Promo",
            status: "Running",
            dateInfo: "Ends in 5 days",
            budget: "$500",
            leads: 12,
            spentPercent: 22
        },
        {
            id: 3,
            name: "Holiday Gift Cards",
            status: "Ended",
            dateInfo: "Completed: Jan 05",
            budget: "$1,500",
            leads: 85,
            spentPercent: 100
        },
        {
            id: 4,
            name: "Spring Refresh Early Bird",
            status: "Paused",
            dateInfo: "Paused by admin",
            budget: "$1,200",
            leads: 8,
            spentPercent: 15
        }
    ];

    return (
        <div className="p-5 pb-32">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
                    <p className="text-sm text-slate-500">Manage campaigns and track ROI.</p>
                </div>
                <button className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span className="hidden sm:inline">New Campaign</span>
                </button>
            </div>

            <MarketingStats />

            {/* Sticky Search & Filter Header (simplified) */}
            <div className="sticky top-0 z-20 bg-background-light py-2 -mx-5 px-5 mb-4 backdrop-blur-sm bg-white/80">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-primary text-[20px]">search</span>
                    </span>
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        className="block w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                    <button className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md">All</button>
                    <button className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold border border-slate-200">Active</button>
                    <button className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold border border-slate-200">Paused</button>
                    <button className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold border border-slate-200">Ended</button>
                </div>
            </div>

            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-lg font-bold text-slate-900">Campaigns</h2>
                <button className="text-primary text-sm font-bold flex items-center gap-1">
                    Sort by <span className="material-symbols-outlined text-[16px]">sort</span>
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {campaigns.map(campaign => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>


        </div>
    );
}
