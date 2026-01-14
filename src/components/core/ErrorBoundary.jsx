import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 max-w-2xl w-full">
                        <span className="material-symbols-outlined text-4xl text-rose-500 mb-4">bug_report</span>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-600 mb-6">The application encountered a critical error.</p>

                        <div className="bg-slate-900 text-slate-50 text-left p-4 rounded-xl overflow-auto text-sm font-mono max-h-64 mb-6">
                            <p className="font-bold text-rose-400 mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
