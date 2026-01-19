import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function AddReviewModal({ isOpen, onClose, onSuccess }) {
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        patient_name: '',
        rating: 5,
        source: 'Google',
        date: new Date().toISOString().split('T')[0],
        comment: '',
        status: 'New'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('reviews')
                .insert([formData]);

            if (error) throw error;

            success('Review added successfully');
            onSuccess();
            onClose();
            setFormData({
                patient_name: '',
                rating: 5,
                source: 'Google',
                date: new Date().toISOString().split('T')[0],
                comment: '',
                status: 'New'
            });
        } catch (error) {
            console.error('Error adding review:', error);
            showError('Failed to add review');
        } finally {
            setLoading(false);
        }
    };

    const generateRandomReview = () => {
        const names = ["Alice Smith", "John Doe", "Emma Wilson", "Michael Brown", "Sarah Davis"];
        const comments = [
            "Amazing experience! The staff was very professional.",
            "Great results, highly recommend.",
            "Clean facility and friendly doctors.",
            "Waited a bit long, but the treatment was worth it.",
            "Exceptional service from start to finish."
        ];
        const sources = ["Google", "Facebook", "Website"];

        setFormData({
            patient_name: names[Math.floor(Math.random() * names.length)],
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
            source: sources[Math.floor(Math.random() * sources.length)],
            date: new Date().toISOString().split('T')[0],
            comment: comments[Math.floor(Math.random() * comments.length)],
            status: 'New'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transition-colors duration-300">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-slate-900 dark:text-white">Add Review (Manual/Simulated)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Source Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Source</label>
                        <div className="flex gap-2">
                            {['Google', 'Facebook', 'Internal', 'Website'].map(src => (
                                <button
                                    key={src}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, source: src })}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${formData.source === src
                                        ? 'bg-primary/10 text-primary border-primary'
                                        : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                                        }`}
                                >
                                    {src}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Patient Name</label>
                            <input
                                type="text"
                                required
                                value={formData.patient_name}
                                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:border-primary outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:border-primary outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="focus:outline-none transition-transform active:scale-110"
                                >
                                    <span className={`material-symbols-outlined text-2xl ${formData.rating >= star ? 'text-yellow-400 fill-current' : 'text-slate-300 dark:text-slate-600'}`}>star</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Comment</label>
                        <textarea
                            required
                            rows="3"
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:border-primary outline-none font-medium resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={generateRandomReview}
                            className="px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            title="Fill with random data"
                        >
                            <span className="material-symbols-outlined">casino</span>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
