import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ClientGallery from './ClientGallery';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/logger';
import { useAuth } from '../../context/AuthContext';
import { compressImage, uploadImage } from '../../lib/storage-utils';
import { formatPhoneNumber } from '../../utils/formatUtils';
import { handleError } from '../../utils/errorHelpers';
import { Spinner } from '../ui/Spinner';

export default function ClientModal({ isOpen, onClose, client, onSuccess }) {
    const { profile } = useAuth();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState('Profile');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Image Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'Active',
        note: '',
        image_url: ''
    });

    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);

            if (client) {
                // Edit Mode: Populate Form
                setFormData({
                    first_name: client.first_name || '',
                    last_name: client.last_name || '',
                    email: client.email || '',
                    phone: formatPhoneNumber(client.phone || ''),
                    status: client.status || 'Active',
                    image_url: client.image_url || '',
                    note: ''
                });
                setActiveTab('Profile');
                fetchHistory(client.id);
            } else {
                // Create Mode: Reset Form
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    status: 'Active',
                    image_url: '',
                    note: ''
                });
                setActiveTab('Profile');
                setHistory([]);
            }
        }
    }, [client, isOpen]);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Preview immediately (before compression/upload)
                const objectUrl = URL.createObjectURL(file);
                setPreviewUrl(objectUrl);
                setSelectedFile(file);
            } catch (err) {
                console.error("File selection error", err);
                showError("Resim seçilemedi");
            }
        }
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const fetchHistory = async (clientId) => {
        try {
            setLoadingHistory(true);
            const { data, error } = await supabase
                .from('appointments')
                .select('*, services(name, duration_min)')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .order('time', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsSuccess(false);

        try {
            let clientId = client?.id;
            let error;
            let finalImageUrl = formData.image_url;

            // 1. Handle Image Upload if new file selected
            if (selectedFile) {
                try {
                    const compressedFile = await compressImage(selectedFile);
                    finalImageUrl = await uploadImage(compressedFile, 'crm_uploads');
                } catch (uploadErr) {
                    console.error("Upload failed", uploadErr);
                    showError("Resim yüklenemedi, resimsiz kaydediliyor.");
                }
            }

            // Prepare client data (exclude note)
            const clientData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email?.trim() || null,
                phone: formData.phone?.trim() || null,
                status: formData.status,
                image_url: finalImageUrl
            };

            if (client) {
                // Edit Mode
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(clientData)
                    .eq('id', client.id);
                error = updateError;

                if (!error) {
                    const changes = Object.keys(clientData).filter(k => clientData[k] !== client[k]);
                    await logActivity('Müşteri Güncellendi', {
                        client_name: `${formData.first_name} ${formData.last_name} `,
                        client_id: client.id,
                        changes: changes.length > 0 ? changes : ['Önemli değişiklik yok']
                    });
                }
            } else {
                // Create Mode
                if (!profile?.clinic_id) throw new Error('Bir kliniğe bağlı değilsiniz.');

                const { data, error: insertError } = await supabase
                    .from('clients')
                    .insert([clientData])
                    .select()
                    .single();

                error = insertError;

                if (data) {
                    clientId = data.id;
                    await logActivity('Müşteri Oluşturuldu', {
                        client_name: `${formData.first_name} ${formData.last_name} `,
                        client_id: clientId
                    });
                }
            }

            if (error) throw error;

            // Handle Note (Only if new note is provided)
            if (formData.note && formData.note.trim()) {
                if (clientId) {
                    const { error: noteError } = await supabase
                        .from('client_notes')
                        .insert([{
                            client_id: clientId,
                            content: formData.note.trim()
                        }]);

                    if (noteError) {
                        console.error('Error adding initial note:', noteError);
                        showError('Müşteri oluşturuldu ancak not kaydedilemedi.');
                    }
                }
            }

            // Success UI Feedback
            setIsSuccess(true);
            success(client ? 'Müşteri başarıyla güncellendi' : 'Müşteri başarıyla oluşturuldu');

            // Wait a moment for the user to see "Saved!", then close
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (error) {
            console.error('Error saving client:', error);

            if (error.message?.includes('clients_email_key') || error.code === '23505') {
                showError('Bu e-posta adresiyle kayıtlı bir müşteri zaten var.');
            } else {
                showError(handleError(error, { operation: 'save_client', client_id: client?.id }));
            }
            setLoading(false); // Only stop loading on error (on success we keep it until close)
        }
    };


    if (!isOpen) return null;

    const isNewClient = !client;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white md:rounded-2xl shadow-xl w-full md:max-w-4xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="font-bold text-lg text-slate-900">
                        {isNewClient ? 'Yeni Hasta' : `${client?.first_name || ''} ${client?.last_name || ''}`}
                    </h2>
                    <div className="w-[44px]"></div>
                </div>

                {/* Mobile Horizontal Tabs */}
                <div className="md:hidden flex border-b border-slate-100 bg-slate-50 overflow-x-auto">
                    {['Profile', 'History', 'Gallery'].map(tab => (
                        <button
                            key={tab}
                            disabled={isNewClient && tab !== 'Profile'}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all min-h-[48px] whitespace-nowrap ${activeTab === tab
                                ? 'text-primary border-b-2 border-primary bg-white'
                                : 'text-slate-500'
                                } ${isNewClient && tab !== 'Profile' ? 'opacity-50' : ''}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {tab === 'Profile' ? 'id_card' : tab === 'History' ? 'history' : 'photo_library'}
                            </span>
                            <span className="hidden sm:inline">{tab === 'Profile' ? 'Profil' : tab === 'History' ? 'Geçmiş' : 'Galeri'}</span>
                        </button>
                    ))}
                </div>

                {/* Desktop Sidebar / Tabs */}
                <div className="hidden md:flex w-64 bg-slate-50 border-r border-slate-100 flex-col">
                    <div className="p-6 border-b border-slate-100">
                        {isNewClient ? (
                            <div className="flex flex-col items-center gap-3">
                                <label className="relative group cursor-pointer w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden hover:ring-4 hover:ring-slate-100 transition-all">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-slate-400">add_a_photo</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-[10px] font-bold">YÜKLE</span>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <span className="font-bold text-slate-900">Yeni Hasta</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <label className="relative group cursor-pointer w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm hover:border-primary/20 transition-all">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : formData.image_url ? (
                                        <img src={formData.image_url} alt={formData.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-primary text-3xl font-bold">
                                            {(client.first_name || 'U')[0]}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">edit</span>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-3">{client.first_name} {client.last_name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{client.status === 'Active' ? 'Aktif' : client.status === 'Lead' ? 'Potansiyel' : 'Pasif'}</p>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {['Profile', 'History', 'Gallery'].map(tab => (
                            <button
                                key={tab}
                                disabled={isNewClient && tab !== 'Profile'}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] ${activeTab === tab
                                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100'
                                    : 'text-slate-500 hover:bg-slate-100'
                                    } ${isNewClient && tab !== 'Profile' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="material-symbols-outlined">
                                    {tab === 'Profile' ? 'id_card' : tab === 'History' ? 'history' : 'photo_library'}
                                </span>
                                {tab === 'Profile' ? 'Profil' : tab === 'History' ? 'Geçmiş' : 'Galeri'}
                            </button>
                        ))}
                    </nav>

                    {/* Footer Close Button */}
                    <div className="p-4 border-t border-slate-100">
                        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors min-h-[44px]">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="text-sm font-bold">Kapat</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">

                        {/* PROFILE TAB */}
                        {activeTab === 'Profile' && (
                            <div className="max-w-xl mx-auto space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-slate-900">Kişisel Bilgiler</h2>
                                </div>
                                <form id="clientForm" onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Ad <span className="text-xs font-normal text-slate-400">(İsteğe Bağlı)</span></label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={50}
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                                placeholder="Ayşe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Soyad <span className="text-xs font-normal text-slate-400">(İsteğe Bağlı)</span></label>
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                                placeholder="Yılmaz"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">E-posta Adresi <span className="text-xs font-normal text-slate-400">(İsteğe Bağlı)</span></label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                            placeholder="ayse@ornek.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Telefon Numarası <span className="text-xs font-normal text-slate-400">(İsteğe Bağlı)</span></label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all"
                                                placeholder="(5XX) XXX XX XX"
                                            />
                                            {formData.phone && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cleanNumber = formData.phone.replace(/\D/g, '');
                                                        window.open(`https://wa.me/90${cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber}`, '_blank');
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                                                    title="WhatsApp'ta Aç"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                                </button >
                                            )}
                                        </div >
                                    </div >

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Durum</label>
                                        <div className="relative">
                                            <select

                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-primary/10 outline-none font-bold text-slate-700 appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="Active">Aktif Hasta</option>
                                                <option value="Lead">Potansiyel / Aday</option>
                                                <option value="Inactive">Pasif</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <span className="material-symbols-outlined">expand_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New Note Field */}
                                    {
                                        isNewClient && (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">İlk Not <span className="text-xs font-normal text-slate-400">(İsteğe Bağlı)</span></label>
                                                <textarea
                                                    value={formData.note}
                                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none font-medium transition-all resize-none h-24"
                                                    placeholder="Hoşgeldin notu veya ilk görüşme detayları ekleyin..."
                                                />
                                            </div>
                                        )
                                    }
                                </form >
                            </div >
                        )}

                        {/* HISTORY TAB */}
                        {
                            activeTab === 'History' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Randevu Geçmişi</h2>

                                    {loadingHistory ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner size="lg" />
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <span className="material-symbols-outlined text-2xl">event_busy</span>
                                            </div>
                                            <p className="text-slate-500 font-medium">Randevu geçmişi bulunamadı.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {history.map(apt => (
                                                <div key={apt.id} className="flex items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 
                                                    ${apt.status === 'Completed' ? 'bg-green-50 text-green-600' :
                                                            apt.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                                'bg-blue-50 text-blue-600'}`}>
                                                        <span className="material-symbols-outlined">
                                                            {apt.status === 'Completed' ? 'check_circle' :
                                                                apt.status === 'Cancelled' ? 'cancel' : 'event'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900">{apt.services?.name || 'Randevu'}</h4>
                                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                                {new Date(apt.date).toLocaleDateString('tr-TR')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                                {apt.time.slice(0, 5)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold 
                                                    ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                            apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'}`}>
                                                        {apt.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        {/* GALLERY TAB */}
                        {
                            activeTab === 'Gallery' && (
                                <div className="h-full flex flex-col">
                                    <ClientGallery clientId={client.id} />
                                </div>
                            )
                        }

                    </div >

                    {/* Footer Actions (Only show Save for Profile tab) */}
                    {
                        activeTab === 'Profile' ? (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    form="clientForm"
                                    disabled={loading}
                                    className={`px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 flex items-center gap-2
                                    ${isSuccess ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary text-white hover:bg-primary-dark'}`}
                                >
                                    {isSuccess ? (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                            Kaydedildi
                                        </>
                                    ) : loading ? (
                                        <>
                                            <Spinner size="md" color="white" />
                                            Değişiklikleri Kaydet
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">save</span>
                                            Değişiklikleri Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                    Kapat
                                </button>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}
