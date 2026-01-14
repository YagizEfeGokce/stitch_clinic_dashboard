export default function AvailableSlot({ time, ampm, onClick }) {
    return (
        <div className="flex gap-4 pb-4">
            <div className="flex flex-col items-end min-w-[3.5rem] pt-3">
                <span className="text-sm font-bold text-slate-400">{time}</span>
                <span className="text-xs font-medium text-slate-400">{ampm}</span>
            </div>
            <div className="relative flex-1 group">
                <div className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-white border-2 border-slate-300 z-10"></div>
                <button
                    onClick={onClick}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-[20px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group-hover:scale-[1.01]"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span className="text-sm font-semibold">Available Slot</span>
                </button>
            </div>
        </div>
    )
}
