import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ClientGallery({ clientId }) {
    const { success, error: showError } = useToast();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [selectedImage, setSelectedImage] = useState(null);
    const [imageToDelete, setImageToDelete] = useState(null);

    useEffect(() => {
        fetchPhotos();
    }, [clientId]);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('client_photos')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${clientId}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('client-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('client-photos')
                .getPublicUrl(fileName);

            // 3. Save to Database
            const { error: dbError } = await supabase
                .from('client_photos')
                .insert([{
                    client_id: clientId,
                    storage_path: fileName,
                    public_url: publicUrl,
                    caption: file.name,
                    category: 'General'
                }]);

            if (dbError) throw dbError;

            success('Photo uploaded successfully');
            fetchPhotos();
        } catch (error) {
            console.error('Error uploading photo:', error);
            showError('Failed to upload photo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmDelete = async () => {
        if (!imageToDelete) return;

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('client-photos')
                .remove([imageToDelete.storage_path]);

            if (storageError) console.error('Storage delete error:', storageError);

            // 2. Delete from Database
            const { error: dbError } = await supabase
                .from('client_photos')
                .delete()
                .eq('id', imageToDelete.id);

            if (dbError) throw dbError;

            success('Photo deleted successfully');
            fetchPhotos();
        } catch (error) {
            console.error('Error deleting photo:', error);
            showError('Failed to delete photo');
        } finally {
            setImageToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Photo Gallery</h3>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                        )}
                        <span>Upload Photo</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </div>
            ) : photos.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <span className="material-symbols-outlined text-3xl">collections</span>
                    </div>
                    <p className="text-slate-500 font-medium">No photos yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                                src={photo.public_url}
                                alt={photo.caption}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setSelectedImage(photo)}
                                    className="size-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-slate-900 backdrop-blur-md transition-all transform hover:scale-110"
                                    title="View Fullscreen"
                                >
                                    <span className="material-symbols-outlined text-[20px]">open_in_full</span>
                                </button>
                                <button
                                    onClick={() => setImageToDelete(photo)}
                                    className="size-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-500 hover:text-white backdrop-blur-md transition-all transform hover:scale-110"
                                    title="Delete Photo"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <Lightbox
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {imageToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]" onClick={() => setImageToDelete(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm transform transition-all scale-100 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                <span className="material-symbols-outlined text-2xl">delete</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Photo?</h3>
                            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. The photo will be permanently removed.</p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setImageToDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Separated Lightbox Component for better state management
function Lightbox({ image, onClose }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setScale(prev => Math.min(prev + 0.5, 4)); // Max 4x zoom
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setScale(prev => {
            const newScale = Math.max(prev - 0.5, 1);
            if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset position if zoomed out completely
            return newScale;
        });
    };

    const handleWheel = (e) => {
        e.stopPropagation();
        if (e.deltaY < 0) {
            setScale(prev => Math.min(prev + 0.2, 4));
        } else {
            setScale(prev => {
                const newScale = Math.max(prev - 0.2, 1);
                if (newScale === 1) setPosition({ x: 0, y: 0 });
                return newScale;
            });
        }
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            onWheel={handleWheel}
        >
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 z-50" onClick={e => e.stopPropagation()}>
                <button
                    onClick={handleZoomOut}
                    disabled={scale === 1}
                    className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                >
                    <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-white font-mono text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                <button
                    onClick={handleZoomIn}
                    disabled={scale === 4}
                    className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            </div>

            <button
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                onClick={onClose}
            >
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div
                className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    src={image.public_url}
                    alt={image.caption}
                    className="max-w-full max-h-[90vh] transition-transform duration-100 ease-out origin-center select-none"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                />
            </div>

            {/* Caption */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/90 font-medium text-lg drop-shadow-md">{image.caption}</p>
            </div>
        </div>
    );
}
