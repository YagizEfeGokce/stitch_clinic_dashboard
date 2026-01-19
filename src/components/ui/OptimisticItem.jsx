/**
 * Wrapper component that adds visual feedback for optimistically added items
 * Shows a pulsing indicator and reduced opacity for items pending server confirmation
 */
export function OptimisticItem({ isOptimistic, children, className = '' }) {
    if (!isOptimistic) {
        return children;
    }

    return (
        <div className={`relative ${className}`}>
            {/* Slight opacity to indicate pending state */}
            <div className="opacity-70 transition-opacity duration-300">
                {children}
            </div>

            {/* Pulsing sync indicator */}
            <div className="absolute top-2 right-2 z-10">
                <span className="flex h-3 w-3" title="Senkronize ediliyor...">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
            </div>
        </div>
    );
}

/**
 * Inline sync indicator for smaller elements
 */
export function SyncIndicator({ show }) {
    if (!show) return null;

    return (
        <span className="inline-flex items-center gap-1 text-xs text-teal-600">
            <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="sr-only">Senkronize ediliyor</span>
        </span>
    );
}

export default OptimisticItem;
