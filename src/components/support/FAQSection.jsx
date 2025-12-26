export default function FAQSection() {
    return (
        <section className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Common Questions</h3>
            <div className="flex flex-col gap-4">
                <details className="group bg-white rounded-2xl border border-slate-100 open:shadow-md transition-all">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-slate-800 text-sm">
                        How do I reset my staff pin?
                        <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 group-open:text-primary transition-all">expand_more</span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed">
                        Go to Settings &gt; Team Management and select the staff member. Click 'Reset PIN' to send a temporary code to their registered email.
                    </div>
                </details>
                <details className="group bg-white rounded-2xl border border-slate-100 open:shadow-md transition-all">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-slate-800 text-sm">
                        Can I customize the booking form?
                        <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 group-open:text-primary transition-all">expand_more</span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed">
                        Absolutely. Navigate to Booking Settings &gt; Forms to add custom fields, consent waivers, and pre-appointment questionnaires.
                    </div>
                </details>
                <details className="group bg-white rounded-2xl border border-slate-100 open:shadow-md transition-all">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-slate-800 text-sm">
                        Where can I find monthly reports?
                        <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 group-open:text-primary transition-all">expand_more</span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed">
                        Reports are auto-generated on the 1st of each month. You can find them under the 'Analytics' tab in the main sidebar.
                    </div>
                </details>
            </div>
        </section>
    );
}
