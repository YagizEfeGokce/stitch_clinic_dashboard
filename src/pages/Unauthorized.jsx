import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-display">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-red-500 text-5xl">lock</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                    <p className="text-slate-500">
                        You do not have permission to view this page. Please contact your administrator if you believe this is a mistake.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-3 block w-full text-center text-sm font-bold text-primary hover:underline"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
