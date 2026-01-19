import { memo } from 'react';

/**
 * Centralized loading spinner component using Material Symbols
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Spinner size
 * @param {'primary'|'white'|'muted'} props.color - Spinner color
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Accessibility label
 */
export const Spinner = memo(function Spinner({
    size = 'md',
    color = 'primary',
    className = '',
    label = 'Yükleniyor...',
}) {
    const sizeClasses = {
        sm: 'text-sm',      // 14px - buttons
        md: 'text-xl',      // 20px - inline
        lg: 'text-3xl',     // 30px - sections
        xl: 'text-4xl',     // 36px - full page
    };

    const colorClasses = {
        primary: 'text-primary',
        white: 'text-white',
        muted: 'text-slate-400',
    };

    return (
        <span
            className={`material-symbols-outlined animate-spin inline-block ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-label={label}
        >
            progress_activity
        </span>
    );
});

/**
 * Full-page loading spinner centered in container
 */
export function PageSpinner({ message }) {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <Spinner size="xl" />
            {message && <p className="text-slate-500 mt-4 font-medium">{message}</p>}
        </div>
    );
}

/**
 * Button loading spinner (white, small)
 */
export function ButtonSpinner() {
    return <Spinner size="sm" color="white" />;
}

/**
 * Inline loading with optional text
 */
export function InlineSpinner({ message, size = 'md' }) {
    return (
        <span className="inline-flex items-center gap-2 text-slate-600">
            <Spinner size={size} color="muted" />
            {message && <span className="text-sm font-medium">{message}</span>}
        </span>
    );
}

export default Spinner;
