import { useState, useEffect } from 'react';
import FeedbackStats from '../components/reviews/FeedbackStats';
import ReviewCard from '../components/reviews/ReviewCard';
import AddReviewModal from '../components/reviews/AddReviewModal';
import { supabase } from '../lib/supabase';

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = activeFilter === 'All'
        ? reviews
        : reviews.filter(r => r.source === activeFilter || r.status === activeFilter);

    // Helper to map DB review to ReviewCard props
    const mapReview = (r) => ({
        id: r.id,
        name: r.patient_name,
        date: r.date,
        service: r.source + ' Review',
        rating: r.rating,
        text: r.comment,
        status: r.status,
        reply: r.reply,
        replyDate: r.reply_date,
        image: `https://ui-avatars.com/api/?name=${r.patient_name}&background=random`
    });

    return (
        <div className="pb-24 bg-background-light dark:bg-background-light min-h-screen transition-colors duration-300">
            <header className="flex items-center justify-between p-6 pb-2 sticky top-0 z-20 bg-background-light/95 dark:bg-background-light/95 backdrop-blur-sm transition-colors duration-300">
                <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Client Feedback</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 h-10 rounded-full bg-slate-900 dark:bg-primary shadow-sm text-white hover:bg-slate-800 dark:hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span className="text-sm font-bold hidden sm:inline">Add Review</span>
                </button>
            </header>

            <FeedbackStats reviews={reviews} />

            <section className="px-6 py-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg">
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Review Summary</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {reviews.length > 0
                                    ? `${Math.round(reviews.filter(r => r.rating === 5).length / reviews.length * 100)}% are 5-star ratings`
                                    : 'No reviews yet'}
                            </p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </div>
            </section>

            {/* Filter Chips */}
            <section className="sticky top-[80px] z-10 bg-background-light/95 dark:bg-background-light/95 backdrop-blur-sm py-2 transition-colors duration-300">
                <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar">
                    {['All', 'Google', 'Facebook', 'Website', 'New'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-transform active:scale-95 ${activeFilter === filter
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            <p className="text-sm font-bold leading-normal">{filter === 'All' ? 'All Reviews' : filter}</p>
                        </button>
                    ))}
                </div>
            </section>

            <div className="flex flex-col gap-4 p-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    </div>
                ) : filteredReviews.length > 0 ? (
                    filteredReviews.map(review => (
                        <ReviewCard key={review.id} review={mapReview(review)} onUpdate={fetchReviews} />
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        <p>No reviews found for this filter.</p>
                    </div>
                )}
            </div>



            <AddReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchReviews}
            />
        </div>
    );
}
