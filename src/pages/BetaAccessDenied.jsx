import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ArrowRight, LogOut, Users, Mail, Clock } from 'lucide-react';

export default function BetaAccessDenied() {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 md:p-10 text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                    <Lock className="w-10 h-10 text-amber-600" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Beta Erişimi Gerekli
                </h1>

                {/* Description */}
                <p className="text-slate-600 mb-8 leading-relaxed">
                    Dermdesk şu anda <span className="font-semibold text-teal-600">kapalı beta</span> aşamasındadır.
                    Uygulamayı kullanmak için beta davetiyesi almanız gerekiyor.
                </p>

                {/* Steps Card */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-teal-600" />
                        Beta erişimi nasıl alırım?
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-slate-600">
                            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-700 font-bold text-xs">1</span>
                            </div>
                            <span>Beta bekleme listesine kaydolun</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-600">
                            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-700 font-bold text-xs">2</span>
                            </div>
                            <span>Davet emailinizi bekleyin (1-3 gün)</span>
                        </li>
                        <li className="flex gap-3 text-sm text-slate-600">
                            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-teal-700 font-bold text-xs">3</span>
                            </div>
                            <span>Arkadaşlarınızı davet ederek sırada öne geçin</span>
                        </li>
                    </ul>
                </div>

                {/* Info Banner */}
                <div className="bg-teal-50 rounded-lg p-4 mb-6 flex items-start gap-3 text-left border border-teal-100">
                    <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-teal-800 font-medium">İlk 50 klinik 3 ay ücretsiz!</p>
                        <p className="text-xs text-teal-600 mt-1">Hemen bekleme listesine katılın.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link
                        to="/"
                        className="w-full bg-teal-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
                    >
                        Beta Listesine Katıl
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-6 rounded-xl font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>

                {/* Contact */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        Sorularınız için:{' '}
                        <a
                            href="mailto:destek@dermdesk.net"
                            className="text-teal-600 hover:underline font-medium"
                        >
                            destek@dermdesk.net
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
