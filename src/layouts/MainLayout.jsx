import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import Sidebar from '../components/layout/Sidebar';
import CommandPalette from '../components/CommandPalette';
import FeedbackWidget from '../components/FeedbackWidget';

import { useNavigate } from 'react-router-dom';

export default function MainLayout({ children }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light text-slate-800 font-display flex">
            <CommandPalette />
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 relative pb-24 md:pb-0">
                <Header />
                <main className="relative flex flex-col w-full max-w-5xl mx-auto">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <div className="md:hidden">
                    <BottomNav />
                </div>


            </div>
            <FeedbackWidget />
        </div>
    );
}
