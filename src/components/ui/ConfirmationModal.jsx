export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger', loading = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${type === 'danger' ? 'bg-red-100' : 'bg-primary/10'}`}>
                        <span className={`material-symbols-outlined text-2xl ${type === 'danger' ? 'text-red-600' : 'text-primary'}`}>
                            {type === 'danger' ? 'warning' : 'info'}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 mb-6">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                                }`}
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
