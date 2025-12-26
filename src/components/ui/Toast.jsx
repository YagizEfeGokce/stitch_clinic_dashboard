import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function ToastContainer({ toasts, removeToast }) {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
}

function Toast({ id, type, message, duration = 3000, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const styles = {
        success: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-white/90', border: 'border-green-100' },
        error: { icon: 'error', color: 'text-rose-500', bg: 'bg-white/90', border: 'border-rose-100' },
        info: { icon: 'info', color: 'text-blue-500', bg: 'bg-white/90', border: 'border-blue-100' },
        warning: { icon: 'warning', color: 'text-amber-500', bg: 'bg-white/90', border: 'border-amber-100' }
    };

    const style = styles[type] || styles.info;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`
                pointer-events-auto w-full min-w-[320px] max-w-sm p-4 rounded-2xl shadow-xl shadow-slate-200/50 border backdrop-blur-md flex items-start gap-4
                ${style.bg} ${style.border} dark:bg-slate-800/90 dark:border-slate-700
            `}
        >
            <div className={`p-2 rounded-xl ${style.color} bg-current/10 shrink-0`}>
                <span className="material-symbols-outlined text-[20px] block">{style.icon}</span>
            </div>

            <div className="flex-1 min-w-0 py-1">
                <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{message}</p>
            </div>

            <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
                <span className="material-symbols-outlined text-[18px] block">close</span>
            </button>
        </motion.div>
    );
}
