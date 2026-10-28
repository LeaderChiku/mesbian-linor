'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  storageUrl: string;
  orderIndex: number;
  createdAt: string;
}

export default function AdminAudioManager() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/admin/audio');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTracks(data.tracks || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch audio tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!titleInput) {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setTitleInput(name);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatusMsg({ type: 'error', text: 'Please select an audio file to upload.' });
      return;
    }

    setUploading(true);
    setStatusMsg(null);
    setUploadProgress(`Uploading "${file.name}"...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', titleInput || file.name);
    formData.append('description', descInput);

    try {
      const res = await fetch('/api/admin/audio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: `Track "${data.track.title}" uploaded successfully!` });
        setTitleInput('');
        setDescInput('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchTracks();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to upload audio track' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error uploading audio track' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/audio?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== id));
        if (previewUrl) {
          setPreviewUrl(null);
          audioRef.current?.pause();
        }
        setStatusMsg({ type: 'success', text: `Track "${title}" deleted.` });
      } else {
        const data = await res.json();
        setStatusMsg({ type: 'error', text: data.error || 'Failed to delete track' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error deleting track' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePreview = (url: string) => {
    if (previewUrl === url) {
      audioRef.current?.pause();
      setPreviewUrl(null);
    } else {
      setPreviewUrl(url);
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 50);
    }
  };

  return (
    <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
          Audio Library & Music Manager
        </span>
        <h2 className="font-serif text-2xl text-cream-100">Upload & Manage Audio Tracks</h2>
        <p className="text-xs text-stone-400 mt-1">
          Upload MP3 or audio files from your laptop to play as the soundtrack on the visitor website.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            statusMsg.type === 'success'
              ? 'bg-pistachio-950/70 border-pistachio-800 text-pistachio-200'
              : 'bg-blush-950/70 border-blush-800 text-blush-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        src={previewUrl || ''}
        onEnded={() => setPreviewUrl(null)}
      />

      {/* Upload Card */}
      <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 flex flex-col gap-4">
        <h3 className="font-serif text-sm text-cream-200 flex items-center gap-2">
          <span>🎵</span>
          <span>Upload Audio Track (MP3, WAV, OGG)</span>
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">
              Select Audio File from Laptop (max 50MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.ogg,.wav,.webm,.m4a,.aac,.flac,audio/*"
              onChange={handleFileSelect}
              className="text-xs text-stone-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-700 file:text-stone-200 hover:file:bg-stone-600 cursor-pointer w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Track Title</label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Our Special Melody"
                className="w-full bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Description (optional)</label>
              <input
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="e.g. Acoustic song from our favorite day"
                className="w-full bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-5 py-2.5 rounded-lg bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 self-start mt-1"
          >
            {uploading ? (uploadProgress || 'Uploading...') : '⬆ Upload Track'}
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-sm text-cream-200 flex items-center justify-between">
          <span>Saved Tracks ({loading ? '...' : tracks.length})</span>
          <span className="text-[10px] text-stone-400 font-sans">
            Tracks play on the visitor website via the music player
          </span>
        </h3>

        {loading ? (
          <div className="text-xs text-stone-400 py-6 text-center animate-pulse">
            Loading tracks...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-xs text-stone-500 py-8 text-center border border-dashed border-stone-800 rounded-xl">
            No audio tracks uploaded yet. Upload an MP3 file above to play on the story pages.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tracks.map((track) => {
              const isPlaying = previewUrl === track.storageUrl;

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/80 hover:bg-stone-800 transition-colors"
                >
                  <button
                    onClick={() => handleTogglePreview(track.storageUrl)}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isPlaying
                        ? 'bg-pistachio-500 text-stone-950 animate-pulse'
                        : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                    }`}
                    title={isPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-cream-200 truncate">{track.title}</p>
                    {track.description && (
                      <p className="text-[10px] text-stone-400 truncate">{track.description}</p>
                    )}
                    <span className="text-[9px] text-stone-500 font-mono">
                      {new Date(track.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(track.id, track.title)}
                    disabled={deletingId === track.id}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-stone-700 hover:bg-blush-900/60 text-stone-300 hover:text-blush-200 text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40"
                  >
                    {deletingId === track.id ? '...' : '🗑 Delete'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
