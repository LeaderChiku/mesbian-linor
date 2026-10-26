import fs from 'node:fs';
import path from 'node:path';
import { getSupabaseServerClient } from '@/lib/supabase';
import {
  type CategorySlug,
  type PhotoItem,
  DEFAULT_PHOTOS,
} from '@/lib/photos';

export {
  type CategorySlug,
  type PhotoItem,
  DEFAULT_PHOTOS,
  PHOTO_CATEGORIES,
} from '@/lib/photos';

const PHOTOS_CACHE_FILE = path.join(process.cwd(), '.photos_cache.json');

declare global {
  // eslint-disable-next-line no-var
  var __mbl_photos_state: PhotoItem[] | undefined;
}

function loadPhotosFromCache(): PhotoItem[] | null {
  try {
    if (fs.existsSync(PHOTOS_CACHE_FILE)) {
      const raw = fs.readFileSync(PHOTOS_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore cache load errors
  }
  return null;
}

function savePhotosToCache(photos: PhotoItem[]): void {
  try {
    fs.writeFileSync(PHOTOS_CACHE_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch {
    // Ignore cache write errors
  }
}

export function getLocalPhotos(): PhotoItem[] {
  if (!global.__mbl_photos_state) {
    const cached = loadPhotosFromCache();
    global.__mbl_photos_state = cached && cached.length > 0 ? cached : [...DEFAULT_PHOTOS];
  }
  return global.__mbl_photos_state;
}

export function setLocalPhotos(photos: PhotoItem[]): void {
  global.__mbl_photos_state = photos;
  savePhotosToCache(photos);
}

/**
 * Fetch photos for a specific category or all categories.
 */
export async function getPhotosByCategory(categorySlug?: CategorySlug): Promise<PhotoItem[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase
        .from('story_photos')
        .select('*')
        .order('order_index', { ascending: true });

      if (categorySlug) {
        query = query.eq('category_slug', categorySlug);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          imageUrl: d.image_url,
          caption: d.caption || '',
          comments: d.comments || '',
          categorySlug: d.category_slug as CategorySlug,
          orderIndex: d.order_index ?? 0,
          isCover: Boolean(d.is_cover),
          dateLabel: d.date_label || '',
          createdAt: d.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback to local
    }
  }

  const all = getLocalPhotos();
  if (!categorySlug) return all;
  return all
    .filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Add a new photo.
 */
export async function addPhoto(
  payload: Omit<PhotoItem, 'id' | 'createdAt'>
): Promise<PhotoItem> {
  const newPhoto: PhotoItem = {
    ...payload,
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const current = getLocalPhotos();
  const updated = [...current, newPhoto];
  setLocalPhotos(updated);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('story_photos').insert({
        id: newPhoto.id,
        image_url: newPhoto.imageUrl,
        caption: newPhoto.caption,
        comments: newPhoto.comments,
        category_slug: newPhoto.categorySlug,
        order_index: newPhoto.orderIndex,
        is_cover: newPhoto.isCover,
        created_at: newPhoto.createdAt,
      });
    } catch {
      // Offline fallback
    }
  }

  return newPhoto;
}

/**
 * Update an existing photo.
 */
export async function updatePhoto(
  id: string,
  updates: Partial<Omit<PhotoItem, 'id' | 'createdAt'>>
): Promise<PhotoItem | null> {
  const current = getLocalPhotos();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedItem = { ...current[index], ...updates };
  current[index] = updatedItem;
  setLocalPhotos([...current]);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('story_photos')
        .update({
          image_url: updatedItem.imageUrl,
          caption: updatedItem.caption,
          comments: updatedItem.comments,
          category_slug: updatedItem.categorySlug,
          order_index: updatedItem.orderIndex,
          is_cover: updatedItem.isCover,
        })
        .eq('id', id);
    } catch {
      // Offline fallback
    }
  }

  return updatedItem;
}

/**
 * Delete a photo.
 */
export async function deletePhoto(id: string): Promise<boolean> {
  const current = getLocalPhotos();
  const filtered = current.filter((p) => p.id !== id);
  if (filtered.length === current.length) return false;

  setLocalPhotos(filtered);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('story_photos').delete().eq('id', id);
    } catch {
      // Offline fallback
    }
  }

  return true;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Handle direct photo file upload from admin laptop.
 * Uploads to Supabase Storage bucket 'photos' or local fallback.
 */
export async function uploadPhotoFile(
  file: File,
  categorySlug: CategorySlug,
  customCaption?: string
): Promise<{ success: boolean; photo?: PhotoItem; error?: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Unsupported format (${file.type || ext}). Allowed: JPG, PNG, WebP, AVIF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const cleanExt = ext || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
  const safeBaseName = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const uniqueKey = `${categorySlug}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBaseName}${cleanExt}`;
  const defaultCaption = customCaption?.trim() || safeBaseName.replace(/_/g, ' ') || 'Untitled Photo';

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseServerClient();

  let finalUrl = '';

  // 1. Prefer Supabase Storage bucket 'photos'
  if (supabase) {
    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(uniqueKey, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(uniqueKey);
        if (urlData?.publicUrl) {
          finalUrl = urlData.publicUrl;
        }
      } else if (uploadErr) {
        console.warn('[supabase storage warning]:', uploadErr.message);
      }
    } catch (storageErr) {
      console.warn('[supabase storage exception]:', storageErr);
    }
  }

  // 2. Local filesystem fallback for dev / offline testing
  if (!finalUrl) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos', categorySlug);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, path.basename(uniqueKey));
      fs.writeFileSync(localFilePath, buffer);
      finalUrl = `/uploads/photos/${categorySlug}/${path.basename(uniqueKey)}`;
    } catch (fsErr) {
      console.warn('[local file write fallback error]:', fsErr);
    }
  }

  if (!finalUrl) {
    return {
      success: false,
      error: 'Storage failure: Supabase bucket "photos" not found and filesystem is read-only. Please create bucket "photos" in Supabase Storage.',
    };
  }

  const existingPhotos = await getPhotosByCategory(categorySlug);
  const newPhoto = await addPhoto({
    imageUrl: finalUrl,
    caption: defaultCaption,
    categorySlug,
    orderIndex: existingPhotos.length,
    isCover: existingPhotos.length === 0,
    dateLabel: new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      year: 'numeric',
    }).format(new Date()),
  });

  return { success: true, photo: newPhoto };
}
