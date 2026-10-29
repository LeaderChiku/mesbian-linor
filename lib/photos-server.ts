import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
    // Only use cached items — never fall back to broken dummy DEFAULT_PHOTOS URLs
    global.__mbl_photos_state = cached && cached.length > 0 ? cached : [];
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
        const mapped: PhotoItem[] = data.map((d) => ({
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

        // Synchronize local cache with authoritative Supabase data
        const currentAll = getLocalPhotos();
        const otherCategories = categorySlug
          ? currentAll.filter((p) => p.categorySlug !== categorySlug)
          : [];
        setLocalPhotos([...otherCategories, ...mapped]);

        return mapped;
      }
    } catch {
      // Fallback to local
    }
  }

  const all = getLocalPhotos();
  if (all.length === 0) return [];
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
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const current = getLocalPhotos();
  // If new photo is cover, unset cover on any other photo in this category
  let updatedList = [...current];
  if (newPhoto.isCover) {
    updatedList = updatedList.map((p) =>
      p.categorySlug === newPhoto.categorySlug ? { ...p, isCover: false } : p
    );
  }
  updatedList.push(newPhoto);
  setLocalPhotos(updatedList);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      if (newPhoto.isCover) {
        await supabase
          .from('story_photos')
          .update({ is_cover: false })
          .eq('category_slug', newPhoto.categorySlug);
      }

      const { error } = await supabase.from('story_photos').insert({
        id: newPhoto.id,
        image_url: newPhoto.imageUrl,
        caption: newPhoto.caption,
        comments: newPhoto.comments,
        category_slug: newPhoto.categorySlug,
        order_index: newPhoto.orderIndex,
        is_cover: newPhoto.isCover,
        date_label: newPhoto.dateLabel,
        created_at: newPhoto.createdAt,
      });
      if (error) {
        console.warn('[supabase photo insert warning]:', error.message);
      }
    } catch (err) {
      console.warn('[supabase photo insert exception]:', err);
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
  const targetCategory = updates.categorySlug || (index !== -1 ? current[index].categorySlug : undefined);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      if (updates.isCover && targetCategory) {
        await supabase
          .from('story_photos')
          .update({ is_cover: false })
          .eq('category_slug', targetCategory)
          .neq('id', id);
      }

      const dbUpdatePayload: Record<string, unknown> = {};
      if (updates.imageUrl !== undefined) dbUpdatePayload.image_url = updates.imageUrl;
      if (updates.caption !== undefined) dbUpdatePayload.caption = updates.caption;
      if (updates.comments !== undefined) dbUpdatePayload.comments = updates.comments;
      if (updates.categorySlug !== undefined) dbUpdatePayload.category_slug = updates.categorySlug;
      if (updates.orderIndex !== undefined) dbUpdatePayload.order_index = updates.orderIndex;
      if (updates.isCover !== undefined) dbUpdatePayload.is_cover = updates.isCover;
      if (updates.dateLabel !== undefined) dbUpdatePayload.date_label = updates.dateLabel;

      const { data, error } = await supabase
        .from('story_photos')
        .update(dbUpdatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        const updatedFromDb: PhotoItem = {
          id: data.id,
          imageUrl: data.image_url,
          caption: data.caption || '',
          comments: data.comments || '',
          categorySlug: data.category_slug as CategorySlug,
          orderIndex: data.order_index ?? 0,
          isCover: Boolean(data.is_cover),
          dateLabel: data.date_label || '',
          createdAt: data.created_at || new Date().toISOString(),
        };

        let updatedList = [...current];
        if (updates.isCover && targetCategory) {
          updatedList = updatedList.map((p) =>
            p.categorySlug === targetCategory && p.id !== id ? { ...p, isCover: false } : p
          );
        }
        if (index !== -1) {
          updatedList[index] = updatedFromDb;
        } else {
          updatedList.push(updatedFromDb);
        }
        setLocalPhotos(updatedList);
        return updatedFromDb;
      }
    } catch (err) {
      console.warn('[supabase photo update exception]:', err);
    }
  }

  if (index === -1) return null;

  let updatedList = [...current];
  if (updates.isCover && targetCategory) {
    updatedList = updatedList.map((p) =>
      p.categorySlug === targetCategory && p.id !== id ? { ...p, isCover: false } : p
    );
  }
  const updatedItem = { ...updatedList[index], ...updates };
  updatedList[index] = updatedItem;
  setLocalPhotos(updatedList);

  return updatedItem;
}

/**
 * Delete a photo.
 */
export async function deletePhoto(id: string): Promise<boolean> {
  const current = getLocalPhotos();
  const toDelete = current.find((p) => p.id === id);
  const filtered = current.filter((p) => p.id !== id);

  let deletedFromSupabase = false;
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { error, count } = await supabase
        .from('story_photos')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (!error && (count ?? 0) > 0) {
        deletedFromSupabase = true;
      }

      // Also clean up Supabase Storage file if URL is in Supabase 'photos' bucket
      if (toDelete?.imageUrl && toDelete.imageUrl.includes('/photos/')) {
        try {
          const parts = toDelete.imageUrl.split('/photos/');
          if (parts.length > 1) {
            const storagePath = parts[1].split('?')[0];
            await supabase.storage.from('photos').remove([storagePath]);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // Offline fallback
    }
  }

  // Also clean up local file if stored locally in public/uploads/
  if (toDelete?.imageUrl && toDelete.imageUrl.startsWith('/uploads/')) {
    try {
      const localFilePath = path.join(process.cwd(), 'public', toDelete.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch {
      // ignore
    }
  }

  const hadLocal = filtered.length !== current.length;
  if (hadLocal) {
    setLocalPhotos(filtered);
  }

  return deletedFromSupabase || hadLocal;
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

        // If bucket does not exist, attempt auto-creation if privileged
        if (uploadErr.message?.toLowerCase().includes('not found') || uploadErr.message?.toLowerCase().includes('bucket')) {
          try {
            const { error: createErr } = await supabase.storage.createBucket('photos', {
              public: true,
              fileSizeLimit: 10485760, // 10MB
            });
            if (!createErr) {
              const retry = await supabase.storage.from('photos').upload(uniqueKey, buffer, {
                contentType: file.type || 'image/jpeg',
                upsert: true,
              });
              if (!retry.error && retry.data) {
                const { data: urlData } = supabase.storage.from('photos').getPublicUrl(uniqueKey);
                if (urlData?.publicUrl) {
                  finalUrl = urlData.publicUrl;
                }
              }
            }
          } catch {
            // ignore
          }
        }
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
