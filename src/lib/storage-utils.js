import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

/**
 * Compresses an image file to be under a specified size (default 0.5MB).
 * @param {File} imageFile - The file object from input.
 * @returns {Promise<File>} - The compressed file.
 */
export async function compressImage(imageFile) {
    const options = {
        maxSizeMB: 0.5,           // Constraint: < 500KB
        maxWidthOrHeight: 1024,   // Reasonable max dimension for web usage
        useWebWorker: true,
        fileType: 'image/jpeg'    // Standardize to JPEG for better compression
    };

    try {
        const compressedFile = await imageCompression(imageFile, options);
        // console.log(`Stats: Original ${imageFile.size / 1024 / 1024} MB, Compressed ${compressedFile.size / 1024 / 1024} MB`);
        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        throw error;
    }
}

/**
 * Uploads a file to Supabase Storage.
 * @param {File} file - The file to upload (should be compressed).
 * @param {string} bucket - The Supabase storage bucket name.
 * @param {string} folder - Optional folder path within the bucket.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export async function uploadImage(file, bucket = 'crm_uploads', folder = 'avatars') {
    try {
        // Generate unique filename
        const fileExt = 'jpg'; // We standardized to jpeg during compression
        const fileName = `${folder}/${uuidv4()}.${fileExt}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Supabase upload failed:', error);
        throw error;
    }
}
