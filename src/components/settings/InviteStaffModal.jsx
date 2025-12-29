import { useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Import directly to create isolated client
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export default function InviteStaffModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'staff'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create a temporary client that DOES NOT persist session
            // This prevents the main app from logging out the Admin and logging in the new user
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false, // Critical: Don't save to localStorage
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // Sign up using the temporary client
            const { data, error } = await tempClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { full_name: formData.fullName }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Use the MAIN 'supabase' client (Admin) to create the profile
                // This ensures we have the permissions to set the 'role'
                const { error: profileError } = await supabase.from('profiles').upsert([
                    {
                        id: data.user.id,
                        email: formData.email,
                        full_name: formData.fullName,
                        role: formData.role
                    }
                ]);
                if (profileError) console.error('Profile update error:', profileError);

                toast.success(`${formData.fullName} için hesap oluşturuldu`);
                onClose();
                setFormData({ email: '', password: '', fullName: '', role: 'staff' });
            }

        } catch (error) {
            console.error('Error creating staff:', error);
            toast.error(error.message || 'Hesap oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Personel Hesabı Oluştur</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 flex gap-2">
                        <span className="material-symbols-outlined text-lg shrink-0">warning</span>
                        <p>Bu işlem yeni bir giriş hesabı oluşturacaktır. Lütfen bu bilgileri personel ile güvenli bir şekilde paylaşın.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                        <input
                            type="text"
                            required
                            placeholder="Dr. Ahmet Yılmaz"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:font-normal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">E-posta Adresi</label>
                        <input
                            type="email"
                            required
                            placeholder="doktor@klinik.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:font-normal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            required
                            placeholder="En az 6 karakter"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 placeholder:font-normal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 bg-white"
                        >
                            <option value="admin">Yönetici</option>
                            <option value="doctor">Doktor</option>
                            <option value="staff">Personel</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">person_add</span>
                                    Hesap Oluştur
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
