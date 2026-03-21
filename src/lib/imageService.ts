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
  async uploadToSupabase(file: File, bucket: string, customName?: string): Promise<string> {
    try {
      const compressed = await imageCompression(file, compressionOptions);
      const fileExt = file.name.split('.').pop();
      const baseName = customName ? customName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : Date.now().toString();
      const fileName = `${baseName}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressed);
      
      if (error) throw error;
      
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
  async uploadToCloudinary(file: File, customName?: string): Promise<string> {
    try {
      const compressed = await imageCompression(file, compressionOptions);
      const formData = new FormData();
      
      // If customName is provided, we can try to set the public_id or just rename the file blob
      const fileExt = file.name.split('.').pop();
      const baseName = customName ? customName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : Date.now().toString();
      const fileName = `${baseName}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      // Note: Cloudinary's unsigned upload uses the filename as the public_id if configured in the preset
      const renamedFile = new File([compressed], fileName, { type: compressed.type });
      
      formData.append('file', renamedFile);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'leo-club');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }
      
      const data = await res.json();
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

