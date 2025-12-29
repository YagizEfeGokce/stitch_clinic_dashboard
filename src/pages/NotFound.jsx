import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-display">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-slate-400 text-5xl">search_off</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Sayfa Bulunamadı</h1>
                    <p className="text-slate-500">
                        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                    </p>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/schedule')}
                        className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Panele Git
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        </div>
    );
}
