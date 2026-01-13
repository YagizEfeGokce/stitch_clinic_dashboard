import { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function FeedbackWidget() {
    const { user, clinic } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('bug'); // 'bug' | 'feature' | 'other'
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user?.id,
                    clinic_id: clinic?.id,
                    type,
                    message,
                    status: 'new'
                });

            if (error) throw error;

            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setMessage('');
                setStatus('idle');
            }, 2000);
        } catch (error) {
            console.error('Feedback error:', error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Modal */}
            {isOpen && (
                <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="bg-slate-900 p-4 flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <MessageSquarePlus className="w-4 h-4 text-primary" />
                            Geri Bildirim
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5">
                        {status === 'success' ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-800">Teşekkürler!</h4>
                                <p className="text-sm text-slate-500 mt-1">Geri bildiriminiz bize ulaştı.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">KONU</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {[
                                            { id: 'bug', label: 'Hata Bildir' },
                                            { id: 'feature', label: 'Öneri' },
                                            { id: 'other', label: 'Diğer' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setType(t.id)}
                                                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === t.id
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">MESAJINIZ</label>
                                    <textarea
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full h-32 p-3 text-sm bg-slate-50 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-medium placeholder:text-slate-400"
                                        placeholder="Fikirleriniz bizim için çok değerli..."
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-lg">
                                        <AlertCircle className="w-4 h-4" />
                                        Bir hata oluştu, lütfen tekrar deneyin.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !message.trim()}
                                    className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Gönder
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                        ? 'bg-slate-800 text-white rotate-90'
                        : 'bg-white text-slate-900 border border-slate-100 hover:border-primary/50'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageSquarePlus className="w-6 h-6 text-primary" />
                )}
            </button>
        </div>
    );
}
