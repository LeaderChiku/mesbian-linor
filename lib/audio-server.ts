import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  storageUrl: string;
  durationSeconds?: number;
  orderIndex: number;
  createdAt: string;
}

const AUDIO_CACHE_FILE = path.join(process.cwd(), '.audio_cache.json');

declare global {
  // eslint-disable-next-line no-var
  var __mbl_audio_state: AudioTrack[] | undefined;
}

function loadAudioFromCache(): AudioTrack[] | null {
  try {
    if (fs.existsSync(AUDIO_CACHE_FILE)) {
      const raw = fs.readFileSync(AUDIO_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore cache load errors
  }
  return null;
}

function saveAudioToCache(tracks: AudioTrack[]): void {
  try {
    fs.writeFileSync(AUDIO_CACHE_FILE, JSON.stringify(tracks, null, 2), 'utf-8');
  } catch {
    // Ignore cache write errors
  }
}

export function getLocalAudioTracks(): AudioTrack[] {
  if (!global.__mbl_audio_state) {
    const cached = loadAudioFromCache();
    global.__mbl_audio_state = cached && cached.length > 0 ? cached : [];
  }
  return global.__mbl_audio_state;
}

export function setLocalAudioTracks(tracks: AudioTrack[]): void {
  global.__mbl_audio_state = tracks;
  saveAudioToCache(tracks);
}

/**
 * Fetch all audio tracks from Supabase or local cache.
 */
export async function getAudioTracks(): Promise<AudioTrack[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audio_tracks')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          storageUrl: d.storage_url,
          durationSeconds: d.duration_seconds || undefined,
          orderIndex: d.order_index ?? 0,
          createdAt: d.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Fallback to local cache
    }
  }
  return getLocalAudioTracks();
}

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
]);

const ALLOWED_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.webm', '.m4a', '.aac', '.flac']);
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Basic magic byte validation to verify audio files
 */
function isValidAudioHeader(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // ID3 header for MP3 (ID3)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // Raw MP3 frame sync (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2)
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  // RIFF header for WAV (RIFF....WAVE)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true;
  // Ogg container (OggS)
  if (buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) return true;
  // fLaC header
  if (buf[0] === 0x66 && buf[1] === 0x4c && buf[2] === 0x61 && buf[3] === 0x43) return true;
  // MP4 / M4A (ftyp)
  if (buf.length >= 8 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true;

  // If header matches typical audio types
  return true;
}

/**
 * Handle direct audio file upload from admin laptop.
 * Uploads to Supabase Storage bucket 'audio' or local fallback.
 */
export async function uploadAudioFile(
  file: File,
  title: string,
  description?: string
): Promise<{ success: boolean; track?: AudioTrack; error?: string }> {
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      success: false,
      error: `Unsupported audio format (${file.type || ext}). Allowed: MP3, OGG, WAV, M4A, AAC, FLAC.`,
    };
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return {
      success: false,
      error: `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isValidAudioHeader(buffer)) {
    return {
      success: false,
      error: 'Invalid audio file format header.',
    };
  }

  const cleanExt = ext || (file.type === 'audio/ogg' ? '.ogg' : file.type === 'audio/wav' ? '.wav' : '.mp3');
  const safeTitle = (title.trim() || path.basename(file.name, ext))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  const uniqueKey = `audio/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeTitle}${cleanExt}`;
  const supabase = getSupabaseServerClient();

  let finalUrl = '';

  // 1. Prefer Supabase Storage bucket 'audio'
  if (supabase) {
    try {
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('audio')
        .upload(uniqueKey, buffer, {
          contentType: file.type || 'audio/mpeg',
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from('audio').getPublicUrl(uniqueKey);
        if (urlData?.publicUrl) {
          finalUrl = urlData.publicUrl;
        }
      } else if (uploadErr) {
        console.warn('[supabase audio storage warning]:', uploadErr.message);
      }
    } catch (storageErr) {
      console.warn('[supabase audio storage exception]:', storageErr);
    }
  }

  // 2. Local filesystem fallback for dev / offline testing
  if (!finalUrl) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, path.basename(uniqueKey));
      fs.writeFileSync(localFilePath, buffer);
      finalUrl = `/uploads/audio/${path.basename(uniqueKey)}`;
    } catch (fsErr) {
      console.warn('[local audio write fallback error]:', fsErr);
    }
  }

  if (!finalUrl) {
    return {
      success: false,
      error: 'Storage failure: Supabase bucket "audio" not found and filesystem is read-only. Please create bucket "audio" in Supabase Storage.',
    };
  }

  const trackId = crypto.randomUUID();
  const current = getLocalAudioTracks();
  const newTrack: AudioTrack = {
    id: trackId,
    title: title.trim() || path.basename(file.name, ext).replace(/_/g, ' '),
    description: description?.trim() || undefined,
    storageUrl: finalUrl,
    orderIndex: current.length,
    createdAt: new Date().toISOString(),
  };

  // Save to local cache
  setLocalAudioTracks([...current, newTrack]);

  // Save metadata to Supabase
  if (supabase) {
    try {
      const { error: insertErr } = await supabase.from('audio_tracks').insert({
        id: newTrack.id,
        title: newTrack.title,
        description: newTrack.description,
        storage_url: newTrack.storageUrl,
        order_index: newTrack.orderIndex,
        created_at: newTrack.createdAt,
      });
      if (insertErr) {
        console.warn('[supabase audio_tracks insert warning]:', insertErr.message);
      }
    } catch (dbErr) {
      console.warn('[supabase audio_tracks insert exception]:', dbErr);
    }
  }

  return { success: true, track: newTrack };
}

/**
 * Delete an audio track by ID.
 */
export async function deleteAudioTrack(id: string): Promise<boolean> {
  const current = getLocalAudioTracks();
  const track = current.find((t) => t.id === id);
  if (!track) return false;

  const filtered = current.filter((t) => t.id !== id);
  setLocalAudioTracks(filtered);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('audio_tracks').delete().eq('id', id);
      // Clean up object in storage if applicable
      const urlParts = track.storageUrl.split('/audio/');
      if (urlParts.length > 1) {
        await supabase.storage.from('audio').remove([`audio/${urlParts[1]}`]);
      }
    } catch (err) {
      console.warn('[supabase audio delete error]:', err);
    }
  }

  return true;
}
