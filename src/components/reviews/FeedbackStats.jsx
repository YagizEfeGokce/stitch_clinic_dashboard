export default function FeedbackStats({ reviews = [] }) {
    // Calculate Stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
        : '0.0';

    // Calculate "New Reviews" (this month)
    const currentMonth = new Date().getMonth();
    const newReviewsCount = reviews.filter(r => new Date(r.date).getMonth() === currentMonth).length;

    // Calculate Positive % (4 or 5 stars)
    const positiveCount = reviews.filter(r => r.rating >= 4).length;
    const positivePercentage = totalReviews > 0
        ? Math.round((positiveCount / totalReviews) * 100)
        : 0;

    return (
        <section className="mt-4 overflow-x-auto no-scrollbar pb-4 px-5 -mx-5 mb-4">
            <div className="flex gap-4 w-max px-5">
                {/* Avg Rating */}
                <div className="flex flex-col justify-between min-w-[140px] h-[140px] rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-yellow-400 text-3xl">star</span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Total: {totalReviews}</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgRating}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Rating</p>
                    </div>
                </div>

                {/* New Reviews */}
                <div className="flex flex-col justify-between min-w-[140px] h-[140px] rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-primary text-3xl">reviews</span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">This Month</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{newReviewsCount}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">New Reviews</p>
                    </div>
                </div>

                {/* Satisfaction */}
                <div className="flex flex-col justify-between min-w-[140px] h-[140px] rounded-2xl p-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-green-500 text-3xl">sentiment_satisfied</span>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{positivePercentage}%</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Positive Feedback</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
