import { Component } from 'react';

/**
 * React Error Boundary - Base class component
 * Catches JavaScript errors in child component tree
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Report to Sentry if available
        if (window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
            });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    handleGoHome = () => {
        window.location.href = '/overview';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    reset: this.handleReset,
                });
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-4xl text-red-500">
                                error
                            </span>
                            <h1 className="text-xl font-bold text-slate-900">
                                Bir Hata Oluştu
                            </h1>
                        </div>

                        <p className="text-slate-600 mb-4">
                            Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-4 p-3 bg-slate-50 rounded-xl text-xs">
                                <summary className="cursor-pointer font-medium text-slate-700 mb-2">
                                    Hata Detayları (Sadece Geliştirme)
                                </summary>
                                <pre className="whitespace-pre-wrap text-slate-600 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                            >
                                Tekrar Dene
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                            >
                                Ana Sayfa
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
