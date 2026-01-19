import ErrorBoundary from './ErrorBoundary';

/**
 * Page-level Error Boundary
 * Shows full-page error UI with navigation options
 */
export function PageErrorBoundary({ children, pageName = 'Sayfa' }) {
    return (
        <ErrorBoundary
            fallback={({ error, reset }) => (
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
                        <div className="text-center mb-6">
                            <span className="material-symbols-outlined text-6xl text-red-400 mb-4 inline-block">
                                sentiment_dissatisfied
                            </span>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {pageName} Yüklenemedi
                            </h1>
                            <p className="text-slate-600">
                                Bu sayfayı yüklerken bir sorun oluştu.
                            </p>
                        </div>

                        {import.meta.env.DEV && error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                                <p className="text-sm font-medium text-red-800 mb-2">
                                    Geliştirici Bilgisi:
                                </p>
                                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                                    {error.toString()}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={reset}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">refresh</span>
                                Sayfayı Yenile
                            </button>
                            <button
                                onClick={() => window.location.href = '/overview'}
                                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">home</span>
                                Ana Sayfa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        >
            {children}
        </ErrorBoundary>
    );
}
