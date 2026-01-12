import { useState } from 'react';
import { useTeam } from '../../hooks/useTeam';
import { ROLES } from '../../utils/constants';
import { User, Mail, Trash2, Shield, UserPlus, X, Check } from 'lucide-react';

export default function TeamSettings() {
    const { members, invitations, loading, inviteMember, cancelInvitation } = useTeam();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState(ROLES.STAFF);
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            await inviteMember(inviteEmail, inviteRole);
            setInviteEmail('');
            setInviteRole(ROLES.STAFF); // Reset to default
        } catch (error) {
            // Toast handled in hook
        } finally {
            setIsInviting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ekip Yönetimi</h2>
                <p className="text-slate-500 font-medium">Kliniğinize doktor ve asistan ekleyin.</p>
            </div>

            {/* Invite Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Yeni Kişi Davet Et
                </h3>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">E-posta Adresi</label>
                        <input
                            type="email"
                            required
                            placeholder="ornek@klinik.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-slate-700"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Rol</label>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-slate-700 bg-white"
                        >
                            <option value={ROLES.STAFF}>Asistan / Personel</option>
                            <option value={ROLES.DOCTOR}>Doktor</option>
                            <option value={ROLES.ADMIN}>Yönetici</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isInviting || !inviteEmail}
                        className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isInviting ? 'Gönderiliyor...' : 'Davet Gönder'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Members */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-slate-400" />
                        Aktif Personel ({members.length})
                    </h3>
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <div className="p-4 rounded-xl border border-slate-100 bg-white text-center text-slate-400 text-sm">
                                Henüz personel yok.
                            </div>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="p-4 rounded-xl border border-slate-100 bg-white flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {member.full_name ? member.full_name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate">{member.full_name || 'İsimsiz Kullanıcı'}</h4>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <span className={`px-2 py-0.5 rounded-full ${member.role === ROLES.OWNER ? 'bg-purple-100 text-purple-700' :
                                                    member.role === ROLES.DOCTOR ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {member.role === ROLES.OWNER ? 'Sahip' :
                                                    member.role === ROLES.DOCTOR ? 'Doktor' :
                                                        member.role === ROLES.ADMIN ? 'Yönetici' : 'Personel'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Actions could go here (Edit/Remove) - future scope */}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Invitations */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-amber-500" />
                        Bekleyen Davetler ({invitations.length})
                    </h3>
                    <div className="space-y-3">
                        {invitations.length === 0 ? (
                            <div className="p-4 rounded-xl border border-slate-100 bg-white text-center text-slate-400 text-sm border-dashed">
                                Bekleyen davet yok.
                            </div>
                        ) : (
                            invitations.map((invite) => (
                                <div key={invite.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white border border-amber-100 flex items-center justify-center text-amber-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate">{invite.email}</h4>
                                        <div className="text-xs font-medium text-amber-600">
                                            {invite.role === ROLES.DOCTOR ? 'Doktor' :
                                                invite.role === ROLES.ADMIN ? 'Yönetici' : 'Personel'} olarak davet edildi
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => cancelInvitation(invite.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                        title="Daveti İptal Et"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
