import { useDroppable } from '@dnd-kit/core';

export default function DroppableTimeSlot({ time, children }) {
    const { setNodeRef, isOver } = useDroppable({
        id: time,
    });

    const [hour, minutes] = time.split(':');

    // Determine display format similar to user request "gömülü olmasın"
    // We show full time e.g. "09:15" to make it very clear and distinct.
    const displayTime = `${hour}:${minutes}`;

    const style = isOver ? {
        backgroundColor: '#f0f9ff',
        borderColor: '#0ea5e9'
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative transition-colors border-b border-dashed border-slate-100 last:border-b-0 min-h-[50px] flex items-stretch group"
        >
            {/* Time Label - Sidebar Style */}
            <div className="w-20 shrink-0 flex items-center justify-center border-r border-slate-100 bg-slate-50/50 group-hover:bg-indigo-50/30 transition-colors">
                <div className={`text-xs font-bold ${minutes === '00' ? 'text-slate-900' : 'text-slate-400'
                    } group-hover:text-primary transition-colors`}>
                    {displayTime}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative pl-3 hover:bg-slate-50/50 transition-colors py-1">
                {children}
            </div>
        </div>
    );
}
