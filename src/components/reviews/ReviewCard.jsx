import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ReviewCard({ review, onUpdate }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);

    const isNew = review.status === 'New';
    const isReplied = review.status === 'Replied';
    const isFeatured = review.status === 'Featured';

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('reviews').update({
                reply: replyText,
                status: 'Replied',
                reply_date: new Date().toISOString()
            }).eq('id', review.id);

            if (error) throw error;
            setIsReplying(false);
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error('Reply failed', e);
            alert('Failed to send reply');
        } finally {
            setLoading(false);
        }
    };

    return (
        <article className={`flex flex-col gap-4 p-5 rounded-2xl bg-white border relative overflow-hidden transition-all ${isFeatured ? 'border-rose-300 shadow-md ring-1 ring-rose-100' : 'border-slate-100 shadow-sm'} ${isReplied ? 'opacity-90' : ''}`}>

            {isFeatured && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-100/50 to-transparent rounded-bl-full pointer-events-none"></div>
            )}

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full h-12 w-12 border-2 border-white shadow-sm" style={{ backgroundImage: `url('${review.image}')` }}></div>
                    <div>
                        <p className="text-slate-900 text-base font-bold leading-tight">{review.name}</p>
                        <p className="text-slate-400 text-xs font-medium">{review.date} • {review.service}</p>
                    </div>
                </div>
                {isNew && (
                    <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">New</p>
                    </div>
                )}
                {isReplied && (
                    <div className="px-3 py-1 rounded-full bg-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Replied</p>
                    </div>
                )}
                {isFeatured && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-100">
                        <span className="material-symbols-outlined text-rose-400 text-[14px]">hotel_class</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Featured</p>
                    </div>
                )}
            </div>

            {/* Rating */}
            <div className="flex gap-1 text-primary relative z-10">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-lg ${i < review.rating ? 'fill-current' : 'opacity-30'}`}>star</span>
                ))}
            </div>

            <p className="text-slate-700 text-sm leading-relaxed relative z-10">
                {review.text}
            </p>

            {isReplied && review.reply && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative z-10">
                    <p className="text-xs font-bold text-slate-900 mb-1">Your Reply</p>
                    <p className="text-xs text-slate-500 italic">"{review.reply}"</p>
                </div>
            )}

            <div className="h-px bg-slate-100 w-full my-1 relative z-10"></div>

            {isReplying ? (
                <div className="w-full relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none outline-none"
                        rows="3"
                        placeholder="Type your response to the patient..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50">
                        <button
                            onClick={() => setIsReplying(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading || !replyText.trim()}
                            onClick={handleSubmitReply}
                            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-[14px]">send</span>}
                            Send Reply
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between relative z-10">
                    {isReplied ? (
                        <button className="text-slate-400 text-sm font-bold flex items-center gap-1 hover:text-primary transition-colors cursor-default">
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Replied
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsReplying(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 transition-transform active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">reply</span>
                            Reply
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${isFeatured ? 'bg-rose-400 text-white shadow-md' : 'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}>
                            <span className="material-symbols-outlined text-xl">hotel_class</span>
                        </button>
                        <button className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:text-green-600 hover:bg-green-50">
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
