import ErrorBoundary from './ErrorBoundary';

/**
 * Section-level Error Boundary
 * Shows inline error without breaking entire page
 */
export function SectionErrorBoundary({
    children,
    sectionName = 'Bu bölüm',
    onReset
}) {
    return (
        <ErrorBoundary
            onReset={onReset}
            fallback={({ error, reset }) => (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl text-red-500 flex-shrink-0">
                            error
                        </span>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900 mb-1">
                                {sectionName} yüklenemedi
                            </h3>
                            <p className="text-sm text-red-700 mb-3">
                                Bu bölümde bir hata oluştu. Diğer bölümler çalışmaya devam ediyor.
                            </p>

                            {import.meta.env.DEV && error && (
                                <details className="mb-3">
                                    <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                                        Hata detayları
                                    </summary>
                                    <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-24 bg-red-100 p-2 rounded">
                                        {error.toString()}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={reset}
                                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 font-medium"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Tekrar Dene
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
