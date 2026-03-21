import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export const imageService = {
  /**
   * Compresses an image file and uploads it to Supabase Storage
   * @param file The image file to compress and upload
   * @param bucket The name of the Supabase Storage bucket
   * @returns The public URL of the uploaded image
   */
  async uploadImage(file: File, bucket: string = 'gallery'): Promise<string> {
    try {
      // 1. Image Compression Options
      const options = {
        maxSizeMB: 0.8, // Max size 800KB
        maxWidthOrHeight: 1200, // Max dimension 1200px
        useWebWorker: true,
      };

      // 2. Compress the image
      console.log(`Starting compression for ${file.name}...`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed from ${(file.size / 1024 / 1024).toFixed(2)} MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // 3. Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // 4. Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // 5. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error in image compression/upload:', err);
      throw err;
    }
  }
};
