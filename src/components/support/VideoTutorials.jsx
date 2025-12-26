export default function VideoTutorials() {
    const videos = [
        {
            id: 1,
            title: "Mastering the Dashboard",
            duration: "2:15",
            category: "Getting Started",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDk6cg3KBDgrhE6rUXFa7EFAtaMhq5yFjkpvz5TNX0nhusKqF6OajgUtNfDfC8uBBAuSpnFAJdo5R5EhRFADQkR0SoyoFw4Se69J1ALnWLI0gaKVHz51HqkYTWamOf0FlXE03X3g5p5NJTqZBBhTHvMx-XuJt2Mst9iWh9YzJJvftJUJfN-i5as08f0fMfrh9w4cb8nS7_NL6eEpij9YBlXKciG68jzYkJfC70FmPTEhOCCcyXARAr15p67pisJ_ZC9DrRAT7Vd5GIc"
        },
        {
            id: 2,
            title: "Managing Patient Records",
            duration: "4:30",
            category: "Advanced Tips",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIM6k_kzZSK9vKeGQ9JyYc44uvnXKQFJuRRh9lvv-nsCtMi600lt7GVCs815AI_Wp8Juc2utSfuI6w-6l8xyGDiJwPBzEp7LrvX-THila8nd5zezonbKXgW6mzt2U_1Zf5KjMdWe1NE5x2_zNmbW1QpqZhqcULgSt4kSwr6dmbJgp7UAhxRMyM6kWzr0LW4KcJmNOm3h-xOosxtwUekfS5WBeENE4YvgbsK2zaOpu4BThNMmNfLLDq_nTRYxCUzeFkWTTjlw7ZLC_a"
        },
        {
            id: 3,
            title: "Setting up Payments",
            duration: "1:45",
            category: "Billing",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgYv9-fS9DQ1Gk8fHrAcfOE8U6chy5EzccJVgN_wd-exhHLEJeIDU-g5YFQNywh8W-Nw-p36AH5zd7Ezgu3_snTJQEneGlfN2LnYH0bAAO2S-glug96pGtVMWf2xrA3C85-CHQRLWwJisaMqTaBFG508Q0E6m8BY0g2cZ4etVkfRf80ZpEEiS2lXK7w7K6IALnZyBY34bqz-Dt26eA-tYY0VIOWvRlxHfdHk_AEOLKtOtGB04cmi5X9S5sH7z4_AbYZyqvR18Q78J6"
        }
    ];

    return (
        <section className="mb-8 border-t border-slate-100 pt-8 -mx-6">
            <div className="px-6 mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Video Tutorials</h3>
                <span className="text-sm font-semibold text-primary">View all</span>
            </div>
            <div className="flex overflow-x-auto px-6 gap-4 pb-4 no-scrollbar snap-x">
                {videos.map(video => (
                    <button key={video.id} className="snap-start shrink-0 w-64 flex flex-col gap-3 group text-left">
                        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-200 shadow-sm">
                            <img src={video.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={video.title} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-lg">
                                    <span className="material-symbols-outlined text-white fill-current">play_arrow</span>
                                </div>
                            </div>
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm">{video.duration}</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-base font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{video.title}</p>
                            <p className="text-xs font-medium text-slate-500">{video.category}</p>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
