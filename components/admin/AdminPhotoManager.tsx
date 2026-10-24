'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type CategorySlug,
  type PhotoItem,
  PHOTO_CATEGORIES,
} from '@/lib/photos';

export default function AdminPhotoManager() {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('the-golden-hour');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for adding photo
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newComments, setNewComments] = useState('');
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newIsCover, setNewIsCover] = useState(false);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/photos?category=${selectedCategory}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPhotos(data.photos || []);
      }
    } catch {
      console.warn('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim() || !newCaption.trim()) {
      setNotice({ type: 'error', text: 'Image URL and Caption are required.' });
      return;
    }

    setActionLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl.trim(),
          caption: newCaption.trim(),
          comments: newComments.trim() || undefined,
          dateLabel: newDateLabel.trim() || undefined,
          categorySlug: selectedCategory,
          orderIndex: photos.length,
          isCover: newIsCover,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', text: 'Photo added successfully!' });
        setNewImageUrl('');
        setNewCaption('');
        setNewComments('');
        setNewDateLabel('');
        setNewIsCover(false);
        fetchPhotos();
      } else {
        setNotice({ type: 'error', text: data.error || 'Failed to add photo' });
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error adding photo' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCover = async (photo: PhotoItem) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photo.id, isCover: !photo.isCover }),
      });
      if (res.ok) {
        fetchPhotos();
      }
    } catch {
      console.warn('Failed to update cover');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo from the album?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/photos?id=${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotice({ type: 'success', text: 'Photo removed from album' });
        fetchPhotos();
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error deleting photo' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="pb-4 border-b border-stone-800">
        <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
          Photo Scrapbook Manager
        </span>
        <h2 className="font-serif text-2xl text-cream-100">Manage 4 Photo Categories</h2>
        <p className="text-xs text-stone-400 mt-1">
          Upload and organize polaroids, handwritten captions, and sticky note comments for each category album.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border ${
            notice.type === 'success'
              ? 'bg-pistachio-950/70 border-pistachio-800 text-pistachio-200'
              : 'bg-blush-950/70 border-blush-800 text-blush-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Category Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PHOTO_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                isSelected
                  ? 'bg-stone-800 border-pistachio-500 text-cream-100 shadow-md'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs font-semibold">{cat.title}</span>
              <span className="text-[10px] text-stone-500 line-clamp-1">{cat.subtitle}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* ── Photo List (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-cream-100">
              Photos in Album ({photos.length})
            </h3>
            <button
              onClick={fetchPhotos}
              className="text-xs text-stone-400 hover:text-stone-200 underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500 font-mono">
              Loading album photos...
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-8 text-center text-xs text-stone-500">
              No photos currently in this category. Use the form on the right to add one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 flex flex-col gap-2.5"
                >
                  <div className="relative aspect-video w-full rounded-lg bg-stone-900 overflow-hidden border border-stone-800 flex items-center justify-center">
                    <img
                      src={p.imageUrl}
                      alt={p.caption}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-2 text-center text-[10px] text-stone-500">
                      <span>🖼️</span>
                      <span>[Placeholder Image]</span>
                    </div>

                    {p.isCover && (
                      <span className="absolute top-1.5 left-1.5 bg-pistachio-600 text-stone-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        COVER
                      </span>
                    )}

                    {p.dateLabel && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-cream-100 text-[9px] font-mono px-1.5 py-0.5 rounded">
                        {p.dateLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-cream-100 leading-tight">
                      {p.caption}
                    </span>
                    {p.comments && (
                      <span className="text-[11px] text-stone-400 italic line-clamp-2">
                        &ldquo;{p.comments}&rdquo;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[11px]">
                    <button
                      onClick={() => handleToggleCover(p)}
                      disabled={actionLoading}
                      className="text-stone-400 hover:text-pistachio-400 transition-colors"
                    >
                      {p.isCover ? 'Unset Cover' : 'Set as Cover'}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      disabled={actionLoading}
                      className="text-blush-400 hover:text-blush-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Add Photo Form (5 cols) ── */}
        <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 rounded-xl p-5 flex flex-col gap-4">
          <h3 className="font-serif text-base text-cream-100 flex items-center gap-2">
            <span>➕</span>
            <span>Add Photo to Category</span>
          </h3>

          <form onSubmit={handleAddPhoto} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-stone-400">Image URL or Local Path</label>
              <input
                type="text"
                placeholder="/photos/sunset.jpg or https://..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                required
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-stone-400">Handwritten Caption</label>
              <input
                type="text"
                placeholder="e.g. Where our story quietly began"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                required
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-stone-400">Sticky Note Comment (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. That first warm afternoon when time slowed down"
                value={newComments}
                onChange={(e) => setNewComments(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-stone-400">Date Stamp / Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Day One or October 2026"
                value={newDateLabel}
                onChange={(e) => setNewDateLabel(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-xs text-cream-200 rounded-lg p-2.5 outline-none focus:border-pistachio-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isCoverCheckbox"
                checked={newIsCover}
                onChange={(e) => setNewIsCover(e.target.checked)}
                className="accent-pistachio-500 rounded"
              />
              <label htmlFor="isCoverCheckbox" className="text-xs text-stone-300 cursor-pointer">
                Set as album cover photo
              </label>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="mt-2 py-2.5 rounded-lg bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
            >
              {actionLoading ? 'Adding...' : 'Add to Album'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
