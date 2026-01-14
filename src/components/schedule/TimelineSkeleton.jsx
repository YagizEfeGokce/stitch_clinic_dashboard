export default function TimelineSkeleton() {
    return (
        <div className="flex gap-8 opacity-70 animate-pulse">
            {/* Time Column */}
            <div className="flex flex-col items-end min-w-[5rem] shrink-0 pt-3 gap-2 text-right">
                <div className="h-4 w-12 bg-slate-200 rounded"></div>
                <div className="h-3 w-8 bg-slate-200 rounded"></div>
            </div>

            <div className="relative flex-1">
                {/* Connector Line Mock */}
                <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-slate-200"></div>
                <div className="absolute -left-[18px] top-7 w-[2px] h-full bg-slate-200"></div>

                {/* Card Mock */}
                <div className="flex flex-col p-4 bg-white rounded-[20px] border border-slate-100 shadow-sm mb-4">
                    <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3 w-full">
                            {/* Avatar */}
                            <div className="size-12 rounded-full bg-slate-200 shrink-0"></div>

                            {/* Text Content */}
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
                                <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                                <div className="flex gap-2 pt-1">
                                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
