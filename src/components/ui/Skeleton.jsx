/**
 * Base Skeleton Components for Loading States
 * Provides smooth pulse animation placeholders matching actual UI dimensions
 */

/**
 * Base skeleton element with pulse animation
 */
export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`animate-pulse bg-slate-200 rounded ${className}`}
            {...props}
        />
    );
}

/**
 * Skeleton for multiple text lines
 * @param {number} lines - Number of lines to show
 */
export function SkeletonText({ lines = 3, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-4/5' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for avatar/circle placeholders
 * @param {'sm'|'md'|'lg'|'xl'} size - Avatar size
 */
export function SkeletonAvatar({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20',
    };

    return (
        <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />
    );
}

/**
 * Skeleton for button placeholders
 */
export function SkeletonButton({ className = '' }) {
    return (
        <Skeleton className={`h-10 w-24 rounded-xl ${className}`} />
    );
}

/**
 * Skeleton for input field placeholders
 */
export function SkeletonInput({ className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
        </div>
    );
}

export default Skeleton;
