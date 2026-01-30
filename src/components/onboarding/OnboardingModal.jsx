import { useState } from 'react';
import { Loader2, Sparkles, FolderOpen } from 'lucide-react';

export default function OnboardingModal({ onComplete, loading, mode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                            <div className="relative size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Loader2 className="size-10 text-white animate-spin" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-bold text-slate-900">Sisteminiz hazırlanıyor...</p>
                            <p className="text-slate-500">Lütfen bekleyin, örnek veriler ekleniyor</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="mx-auto size-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                                <Sparkles className="size-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Dermdesk'e Hoş Geldiniz!</h1>
                            <p className="text-slate-500">Kliniğinizi nasıl başlatmak istersiniz?</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => onComplete(true)}
                                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-[2px] transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className="relative flex items-center gap-4 rounded-[14px] bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5 text-white">
                                    <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="size-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-lg">Örnek Verilerle Başla</p>
                                        <p className="text-white/80 text-sm">8 hasta, 5 hizmet, 4 ürün, 6 randevu</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => onComplete(false)}
                                className="w-full group rounded-2xl border-2 border-slate-200 hover:border-slate-300 px-6 py-5 transition-all hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                                    <FolderOpen className="size-6 text-slate-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-lg text-slate-900">Boş Sistemle Başla</p>
                                    <p className="text-slate-500 text-sm">Tüm verileri kendiniz ekleyin</p>
                                </div>
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-400 mt-6">
                            Örnek veriler istediğiniz zaman silinebilir
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
