import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const compressionOptions = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export const imageService = {
  /**
   * Compresses and uploads an image to Supabase Storage
   */
  async uploadToSupabase(file: File, bucket: string, customName?: string, onProgress?: (p: number) => void): Promise<string> {
    try {
      if (onProgress) onProgress(10);
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressed = await imageCompression(file, compressionOptions);
      console.log(`Compressed size: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
      if (onProgress) onProgress(40);
      
      const fileExt = file.name.split('.').pop();
      const baseName = customName ? customName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : Date.now().toString();
      const fileName = `${baseName}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      console.log(`Uploading to Supabase bucket: ${bucket}, fileName: ${fileName}`);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressed);
      
      if (error) throw error;
      if (onProgress) onProgress(100);
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error('Supabase upload error:', err);
      throw err;
    }
  },

  /**
   * Compresses and uploads an image to Cloudinary
   */
  async uploadToCloudinary(file: File, customName?: string, onProgress?: (p: number) => void): Promise<string> {
    try {
      if (onProgress) onProgress(10);
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressed = await imageCompression(file, compressionOptions);
      console.log(`Compressed size: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
      if (onProgress) onProgress(30);
      
      const formData = new FormData();
      const fileExt = file.name.split('.').pop();
      const baseName = customName ? customName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : Date.now().toString();
      const fileName = `${baseName}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const renamedFile = new File([compressed], fileName, { type: compressed.type });
      
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing.');
      }

      formData.append('file', renamedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'leo-club');

      if (onProgress) onProgress(50);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (onProgress) onProgress(90);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }
      
      const data = await res.json();
      if (onProgress) onProgress(100);
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw err;
    }
  },

  /**
   * Deletes an image from storage based on its URL
   */
  async deleteFromStorage(url: string, bucket?: string): Promise<void> {
    if (!url) return;

    try {
      if (url.includes('supabase.co')) {
        // Handle Supabase deletion
        if (!bucket) {
          // Try to extract bucket from URL if not provided
          // https://[project].supabase.co/storage/v1/object/public/[bucket]/[filename]
          const parts = url.split('/storage/v1/object/public/');
          if (parts.length > 1) {
            const bucketAndFile = parts[1].split('/');
            const extractedBucket = bucketAndFile[0];
            const fileName = bucketAndFile.slice(1).join('/');
            await supabase.storage.from(extractedBucket).remove([fileName]);
          }
        } else {
          const fileName = url.split('/').pop();
          if (fileName) {
            await supabase.storage.from(bucket).remove([fileName]);
          }
        }
      } else if (url.includes('cloudinary.com')) {
        // Cloudinary deletion from client side is restricted without API Secret
        // Usually requires a backend or signed requests. 
        // We will log this for now as per user instruction to "delete from storage",
        // but it might need a backend implementation if security is enforced.
        console.warn('Cloudinary deletion from client side is restricted. URL:', url);
      }
    } catch (err) {
      console.error('Error deleting from storage:', err);
      // We don't necessarily want to throw here to prevent blocking DB deletion
    }
  }
};

