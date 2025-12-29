import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function SupportWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, text: '👋 Hi! How can we help you today?', isBot: true }
    ]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = { id: Date.now(), text: message, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        const currentMsg = message;
        setMessage('');

        // Simulate Bot Response
        setTimeout(async () => {
            // Send to DB in background
            try {
                const { error } = await supabase.from('support_tickets').insert([
                    { user_id: user?.id, message: currentMsg }
                ]);
                if (error) throw error;
            } catch (err) {
                console.error('Support DB Error:', err);
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Thanks for reaching out! Our support team has received your message and will get back to you shortly.',
                isBot: true
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {/* Chat Box */}
            {isOpen && (
                <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200 flex flex-col">
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span>
                            <div>
                                <div className="font-bold text-sm">Velara Assistant</div>
                                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-slate-300">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm break-words
                                    ${msg.isBot
                                        ? 'self-start bg-white border border-slate-200 rounded-tl-none text-slate-700'
                                        : 'self-end bg-primary text-white rounded-tr-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 text-sm px-3 py-2 bg-slate-50 border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20"
                            autoFocus
                        />
                        <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50" disabled={!message.trim()}>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="size-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative"
            >
                <span className="material-symbols-outlined text-[28px]">{isOpen ? 'close' : 'chat_bubble'}</span>
                {!isOpen && messages.length > 1 && (
                    <span className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>
        </div>
    );
}
