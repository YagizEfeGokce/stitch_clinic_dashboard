import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function DraggableAppointment({ appointment, children }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: appointment.id.toString(),
        data: appointment
    });

    // We only want to drag Y axis if list, but X/Y if grid.
    // For now simple transform.
    // We update z-index when dragging so it floats above.

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : 'auto',
        opacity: isDragging ? 0.8 : 1,
        position: isDragging ? 'relative' : 'relative',
        touchAction: 'none' // Important for touch devices
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}
