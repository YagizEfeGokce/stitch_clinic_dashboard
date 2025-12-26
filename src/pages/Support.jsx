import HelpCategories from '../components/support/HelpCategories';
import VideoTutorials from '../components/support/VideoTutorials';
import FAQSection from '../components/support/FAQSection';
import { useAuth } from '../context/AuthContext';

export default function Support() {
    const { user } = useAuth();
    const userName = user?.user_metadata?.full_name || 'Dr.';

    return (
        <div className="pb-24 bg-background-light min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-background-light/90 backdrop-blur-md">
                <button className="flex items-center justify-center p-2.5 rounded-xl hover:bg-slate-200/50 transition-colors">
                    <span className="material-symbols-outlined text-slate-800 text-[24px]">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Help Center</h1>
                <button className="relative flex items-center justify-center p-2.5 rounded-xl hover:bg-slate-200/50 transition-colors">
                    <span className="material-symbols-outlined text-slate-800 text-[24px]">notifications</span>
                    <span className="absolute top-2.5 right-3 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-white"></span>
                </button>
            </header>

            <div className="px-6 pt-4 pb-12">
                {/* Hero */}
                <div className="space-y-1 mb-6">
                    <h2 className="text-[28px] font-extrabold text-slate-900 leading-tight">Hello, {userName}.</h2>
                    <p className="text-[22px] font-medium text-slate-500">How can we help today?</p>
                </div>

                {/* Search */}
                <div className="relative w-full mb-8">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[24px]">search</span>
                    </div>
                    <input className="block w-full py-4 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search articles, guides, or videos..." type="text" />
                </div>

                <HelpCategories />
                <VideoTutorials />
                <FAQSection />

                {/* Direct Support */}
                <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-5">Still need help?</h3>
                    <button className="relative overflow-hidden flex items-center gap-4 p-5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all w-full text-left group">
                        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent"></div>
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
                        </div>
                        <div className="flex flex-col items-start z-10">
                            <span className="font-bold text-base tracking-wide">Start Live Chat</span>
                            <span className="text-xs text-white/90 font-medium mt-0.5">Wait time &lt; 2 min • Online</span>
                        </div>
                        <span className="material-symbols-outlined ml-auto group-hover:translate-x-1 transition-transform z-10">arrow_forward</span>
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">Phone support available Mon-Fri, 9am - 6pm EST</p>
                </section>
            </div>
        </div>
    );
}
