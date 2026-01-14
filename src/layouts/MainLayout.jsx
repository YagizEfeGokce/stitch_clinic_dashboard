import { useState } from 'react';
import Header from '../components/layout/Header';
// import BottomNav from '../components/layout/BottomNav'; // Removed as user requested Drawer pattern specifically
import Sidebar from '../components/layout/Sidebar';
import CommandPalette from '../components/core/CommandPalette';
import FeedbackWidget from '../components/widgets/FeedbackWidget';
import { Menu } from 'lucide-react'; // Hamburger icon

import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
    const { clinic } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background-light text-slate-800 font-display flex relative">
            <CommandPalette />

            {/* Sidebar (Responsive) */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 relative">

                {/* Mobile Header / Hamburger Trigger */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white text-slate-900 sticky top-0 z-30 border-b border-slate-100/50 backdrop-blur-md bg-white/80">
                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-base md:text-lg tracking-tight text-slate-900 truncate">
                            {clinic?.name || 'Dermdesk'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Mobile Header Extras if needed (like bell) can go here */}
                    </div>
                </div>

                <div className="hidden md:block">
                    <Header />
                </div>

                <main className="relative flex flex-col w-full max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
            <FeedbackWidget />
        </div>
    );
}
