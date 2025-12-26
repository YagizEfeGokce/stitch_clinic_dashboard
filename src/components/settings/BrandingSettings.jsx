import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function BrandingSettings() {
    const { toast } = useToast();
    const { setClinic } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [logoFile, setLogoFile] = useState(null);

    const [settings, setSettings] = useState({
        id: null,
        clinic_name: '',
        logo_url: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        working_start_hour: '09:00',
        working_end_hour: '18:00',
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clinic_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
            }

            if (data) {
                setSettings(prev => ({ ...prev, ...data }));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            let logoUrl = settings.logo_url;

            // 1. Upload Logo if selected
            if (logoFile) {
                try {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `clinic-logo-${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // Ensure bucket exists (handled by SQL script ideally, but here we assume 'clinic-assets' or use 'avatars' as fallback if needed, but sticking to plan)
                    // We'll use 'clinic-assets' bucket. User needs to create it or run the SQL.
                    const { error: uploadError } = await supabase.storage
                        .from('clinic-assets')
                        .upload(filePath, logoFile);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('clinic-assets')
                        .getPublicUrl(filePath);

                    logoUrl = publicUrl;
                } catch (uploadError) {
                    console.error('Logo upload error:', uploadError);
                    toast.error('Failed to upload logo. Ensure "clinic-assets" bucket exists.');
                    // Don't stop saving other settings, just warn
                }
            }

            // 2. Prepare Payload
            const payload = {
                ...settings,
                logo_url: logoUrl
            };
            if (!payload.id) delete payload.id;

            const { data, error } = await supabase
                .from('clinic_settings')
                .upsert(payload)
                .select()
                .single();

            if (error) throw error;

            toast.success('Settings updated successfully!');
            setLogoFile(null); // Reset file input

            if (data) {
                setSettings(data);
                if (setClinic) setClinic(data);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-slate-900 text-xl font-bold leading-tight mb-4">Clinic Branding & Info</h3>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-8">

                {/* Logo & Name Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Logo Upload */}
                    <div className="shrink-0 flex flex-col items-center gap-3">
                        <div
                            className="relative group cursor-pointer w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoFile ? (
                                <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain p-2" />
                            ) : settings.logo_url ? (
                                <img src={settings.logo_url} alt="Clinic Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center p-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">add_a_photo</span>
                                    <p className="text-xs text-slate-400 font-bold">Upload Logo</p>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white">edit</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Change Logo
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Clinic Name</label>
                            <input
                                type="text"
                                value={settings.clinic_name}
                                onChange={(e) => setSettings({ ...settings, clinic_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                                placeholder="e.g. Stitch Clinic"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description / Tagline <span className="text-slate-400 font-normal">(Optional)</span></label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white"
                                placeholder="e.g. Advanced Aesthetic Medicine"
                                disabled // Placeholder for future use
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">call</span>
                            <input
                                type="tel"
                                value={settings.phone || ''}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">mail</span>
                            <input
                                type="email"
                                value={settings.email || ''}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="contact@clinic.com"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 material-symbols-outlined text-slate-400 text-lg">location_on</span>
                            <textarea
                                value={settings.address || ''}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                rows="2"
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                                placeholder="123 Medical Center, Suite 100, City, Country"
                            ></textarea>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Website URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">language</span>
                            <input
                                type="url"
                                value={settings.website || ''}
                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                placeholder="https://www.yourclinic.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* Working Hours Section */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-900">Working Hours</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={settings.working_start_hour || '09:00'}
                                onChange={(e) => setSettings({ ...settings, working_start_hour: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">End Time</label>
                            <input
                                type="time"
                                value={settings.working_end_hour || '18:00'}
                                onChange={(e) => setSettings({ ...settings, working_end_hour: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium bg-white text-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Working Days</label>
                        <div className="flex flex-wrap gap-2">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const currentDays = settings.working_days || [];
                                        const newDays = currentDays.includes(day)
                                            ? currentDays.filter(d => d !== day)
                                            : [...currentDays, day];
                                        setSettings({ ...settings, working_days: newDays });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${(settings.working_days || []).includes(day)
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
