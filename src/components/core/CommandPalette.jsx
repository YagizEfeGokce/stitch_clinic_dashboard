import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Toggle with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setSearchTerm('');
            setResults([]);
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setResults([]);
                return;
            }

            // Parallel Search
            const [clientsRes, inventoryRes] = await Promise.all([
                supabase.from('clients').select('id, first_name, last_name, image_url').ilike('first_name', `%${searchTerm}%`).limit(3),
                supabase.from('inventory').select('id, name').ilike('name', `%${searchTerm}%`).limit(3)
            ]);

            const staticPages = [
                { id: 'p1', type: 'page', title: 'Panel', path: '/' },
                { id: 'p2', type: 'page', title: 'Takvim', path: '/schedule' },
                { id: 'p3', type: 'page', title: 'Müşteriler', path: '/clients' },
                { id: 'p4', type: 'page', title: 'Envanter', path: '/inventory' },
                { id: 'p5', type: 'page', title: 'Hizmetler', path: '/services' },
                { id: 'p6', type: 'page', title: 'Finans', path: '/finance' },
            ].filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

            const combined = [
                ...staticPages,
                ...(clientsRes.data || []).map(c => ({ ...c, type: 'client', title: `${c.first_name} ${c.last_name}`, path: `/clients/${c.id}` })),
                ...(inventoryRes.data || []).map(i => ({ ...i, type: 'product', title: i.name, path: '/inventory' }))
            ];

            setResults(combined);
            setActiveIndex(0);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // Navigation Logic
    const handleSelect = (item) => {
        if (item.path) {
            navigate(item.path);
        }
        setIsOpen(false);
    };

    const handleKeyDownInfo = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[activeIndex]) {
                handleSelect(results[activeIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                {/* Search Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Müşteri, envanter veya sayfa ara..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 h-10 text-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDownInfo}
                    />
                    <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500 border border-slate-200">
                        ESC
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && searchTerm.length > 1 ? (
                        <div className="p-8 text-center text-slate-400">
                            Sonuç bulunamadı.
                        </div>
                    ) : searchTerm.length < 2 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            Aramak için en az 2 karakter yazın...
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {results.map((item, index) => (
                                <button
                                    key={item.id + item.type}
                                    onClick={() => handleSelect(item)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${index === activeIndex ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${index === activeIndex ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {item.type === 'client' ? 'person' : item.type === 'product' ? 'inventory_2' : 'web'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">{item.title}</div>
                                        <div className="text-xs opacity-70 capitalize">{item.type}</div>
                                    </div>
                                    {index === activeIndex && (
                                        <span className="material-symbols-outlined text-indigo-400 text-sm">subdirectory_arrow_left</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                    <span>İpucu: Yön tuşlarını kullanabilirsiniz</span>
                    <span>Dermdesk Spotlight</span>
                </div>
            </div>
        </div >
    );
};

export default CommandPalette;
