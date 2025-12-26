import { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function HourBlock({ hourStr, children, hasAppointments }) {
    // hourStr e.g. "09" or "09:00" label
    const [expanded, setExpanded] = useState(true); // Always expanded by default per user request
    const timeoutRef = useRef(null);

    // Make the header itself a droppable zone to detect hover
    const { setNodeRef, isOver } = useDroppable({
        id: `hour-block-${hourStr}`,
        data: { type: 'hour-block', hour: hourStr }
    });

    // Auto-expand logic on hover dragging
    useEffect(() => {
        if (isOver && !expanded) {
            timeoutRef.current = setTimeout(() => {
                setExpanded(true);
            }, 800); // 0.8s hover delay to expand
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isOver, expanded]);

    // Auto-expand if new appointments added
    useEffect(() => {
        if (hasAppointments) setExpanded(true);
    }, [hasAppointments]);

    const toggle = () => setExpanded(!expanded);

    const style = isOver ? {
        borderColor: '#0ea5e9',
        backgroundColor: '#f0f9ff'
    } : {};

    return (
        <div ref={setNodeRef} className="rounded-xl overflow-hidden border border-slate-200 bg-white transition-all duration-300">
            {/* Header / Trigger */}
            <div
                onClick={toggle}
                style={style}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
            >
                <div className="flex items-center gap-3">
                    <span
                        className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                    >
                        expand_more
                    </span>
                    <span className="text-lg font-bold text-slate-700">
                        {hourStr}:00
                    </span>
                    {!expanded && hasAppointments && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            Booked
                        </span>
                    )}
                </div>

                {/* Visual cue for drag interaction */}
                {isOver && !expanded && (
                    <span className="text-xs font-medium text-primary animate-pulse">
                        Hold to expand...
                    </span>
                )}
            </div>

            {/* Accordion Body */}
            <div
                className={`transition-all duration-300 ease-in-out border-t border-slate-100 ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}
            >
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}
