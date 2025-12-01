import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  VEHICLES: 'vehicles',
  PLACES: 'places',
  GENERAL: 'general',
} as const;

// Helper functions for direct Supabase Storage access (alternative to backend API)
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options?.cacheControl || '3600',
    upsert: options?.upsert || false,
  });

  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

export const listFiles = async (bucket: string, folder?: string) => {
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) throw error;
  return data;
};

// Upload image with automatic path generation
export const uploadImage = async (
  bucket: string,
  file: File,
  userId?: string,
  customPath?: string
): Promise<{ path: string; publicUrl: string }> => {
  // Generate path: userId/filename or custom path
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const path = customPath || (userId ? `${userId}/${fileName}` : fileName);

  // Upload file
  const uploadData = await uploadFile(bucket, path, file);
  
  // Get public URL
  const publicUrl = getPublicUrl(bucket, uploadData.path);

  return {
    path: uploadData.path,
    publicUrl,
  };
};

// Convert file to base64 (for backend API upload)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
