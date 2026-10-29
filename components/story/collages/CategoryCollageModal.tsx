'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type CategorySlug,
  type PhotoItem,
  PHOTO_CATEGORIES,
} from '@/lib/photos';

interface CategoryCollageModalProps {
  categorySlug: CategorySlug | null;
  onClose: () => void;
}

export default function CategoryCollageModal({
  categorySlug,
  onClose,
}: CategoryCollageModalProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categoryMeta = PHOTO_CATEGORIES.find((c) => c.slug === categorySlug);

  const handleDownload = async (photo: PhotoItem) => {
    if (!photo.imageUrl) return;
    try {
      const sanitizedTitle =
        (photo.caption || 'scrapbook-photo')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/gi, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 50) || 'memory-photo';
      const filename = `${sanitizedTitle}.jpg`;

      const res = await fetch(photo.imageUrl);
      if (!res.ok) throw new Error('Blob fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = photo.imageUrl;
      link.download = `${(photo.caption || 'photo').replace(/[^a-z0-9_-]/gi, '_')}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Close on Escape key / arrow key navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setLightboxIndex(null);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
        }
      } else {
        if (e.key === 'Escape') onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, onClose, photos.length]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (!categorySlug) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [categorySlug]);

  // Fetch photos for selected category
  useEffect(() => {
    if (!categorySlug) return;
    setLoading(true);

    fetch(`/api/photos?category=${categorySlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.photos)) {
          setPhotos(data.photos);
        }
      })
      .catch((err) => console.warn('Failed to load category photos:', err))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  if (!categorySlug || !categoryMeta) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md">
        {/* Click outside backdrop to close */}
        <div className="absolute inset-0" onClick={onClose} aria-hidden />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-cream-100 text-stone-800 rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden"
        >
          {/* ── Modal Header ── */}
          <header className="px-6 py-5 border-b border-stone-200/60 bg-cream-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {categoryMeta.icon}
              </span>
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-pistachio-700 font-semibold">
                  Photo Scrapbook
                </span>
                <h3 className="font-script text-2xl sm:text-3xl text-stone-900 leading-tight">
                  {categoryMeta.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-cream-300 hover:bg-cream-400 text-stone-700 flex items-center justify-center text-sm font-bold transition-colors shadow-sm"
              aria-label="Close photo gallery"
            >
              ✕
            </button>
          </header>

          {/* ── Modal Subtitle / Description ── */}
          <div className="px-6 py-3 bg-cream-200/40 border-b border-stone-200/40 text-xs font-serif text-stone-600 italic">
            &ldquo;{categoryMeta.description}&rdquo;
          </div>

          {/* ── Vertical Scrollable Collage Scrapbook ── */}
          <div className="p-6 overflow-y-auto flex flex-col gap-10 items-center space-y-2">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3 text-stone-500 font-serif text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-pistachio-600 animate-ping" />
                <span>Gathering scrapbook photographs...</span>
              </div>
            ) : photos.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-serif text-sm">
                <span className="text-3xl mb-2 block">📷</span>
                No photographs added to this album yet.
              </div>
            ) : (
              photos.map((photo, index) => {
                const tilts = [-2, 1.8, -1.2, 2.2, -1.8, 1.5];
                const tilt = tilts[index % tilts.length];
                const tapes = ['pistachio', 'blush', 'gold'] as const;
                const tapeColor = tapes[index % tapes.length];

                return (
                  <motion.article
                    key={photo.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    style={{ transform: `rotate(${tilt}deg)` }}
                    className="relative w-full max-w-md bg-white p-4 pb-6 rounded-xl shadow-xl border border-stone-200/90 flex flex-col gap-3 group transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {/* Washi tape visual accents */}
                    <div
                      aria-hidden
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 opacity-85 rotate-[-1deg] shadow-sm pointer-events-none rounded-sm ${
                        tapeColor === 'pistachio'
                          ? 'bg-pistachio-300/80 border border-pistachio-400/50'
                          : tapeColor === 'blush'
                          ? 'bg-blush-300/80 border border-blush-400/50'
                          : 'bg-amber-200/80 border border-amber-300/50'
                      }`}
                    />

                    {/* Photo Container with Graceful Fallback & Lightbox trigger */}
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="relative aspect-[4/3] w-full rounded-lg bg-stone-100 overflow-hidden border border-stone-200/70 shadow-inner flex items-center justify-center cursor-zoom-in text-left group/photo focus:outline-none focus:ring-2 focus:ring-pistachio-600"
                      title="Click to view full screen and download"
                    >
                      <PhotoDisplay photo={photo} categoryMeta={categoryMeta} />

                      {photo.isCover && (
                        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-pistachio-800/90 text-cream-100 text-[9px] font-sans uppercase tracking-wider shadow">
                          Cover Memory
                        </span>
                      )}

                      {photo.dateLabel && (
                        <span className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-cream-100 text-[10px] font-mono shadow">
                          {photo.dateLabel}
                        </span>
                      )}

                      {/* Hover zoom indicator */}
                      <span className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-stone-900/70 opacity-0 group-hover/photo:opacity-100 backdrop-blur-sm text-cream-100 text-[10px] font-sans tracking-wide transition-opacity flex items-center gap-1">
                        🔍 View Full
                      </span>
                    </button>

                    {/* Handwritten Caption & Sticky Note Comment */}
                    <div className="flex flex-col gap-1.5 px-1 pt-1">
                      <p className="font-script text-xl sm:text-2xl text-stone-900 leading-tight">
                        {photo.caption}
                      </p>

                      {photo.comments && (
                        <div className="mt-1 p-2.5 rounded-lg bg-cream-200/70 border border-stone-200/80 font-serif text-xs text-stone-700 leading-relaxed italic flex items-start gap-2">
                          <span className="text-sm shrink-0" aria-hidden>
                            ✏️
                          </span>
                          <span>&ldquo;{photo.comments}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })
            )}

            {/* End of album stamp */}
            {!loading && photos.length > 0 && (
              <div className="pt-4 pb-2 flex flex-col items-center gap-1.5 text-stone-400 text-center">
                <span className="text-xl">🌿</span>
                <span className="font-sans text-[10px] tracking-widest uppercase">
                  End of this memory album
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Full-Screen Lightbox Modal */}
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-lg select-none"
          >
            {/* Lightbox Header Bar */}
            <header className="w-full flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-stone-300 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700">
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <span className="font-sans font-medium text-cream-200 hidden sm:inline">
                  {categoryMeta.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(photos[lightboxIndex])}
                  className="px-3.5 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-cream-100 flex items-center gap-1.5 text-xs font-medium border border-stone-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-pistachio-500"
                  title="Download photograph"
                >
                  <span aria-hidden>📥</span> Download
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-cream-100 flex items-center justify-center text-sm font-bold border border-stone-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-pistachio-500"
                  aria-label="Close photo preview"
                >
                  ✕
                </button>
              </div>
            </header>

            {/* Lightbox Body (Image & Arrows) */}
            <div className="relative flex-1 flex items-center justify-center w-full my-2">
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : photos.length - 1
                    )
                  }
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-stone-800/80 hover:bg-stone-700 text-cream-100 flex items-center justify-center text-2xl transition-colors shadow-lg border border-stone-700/80 focus:outline-none"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
              )}

              <div className="max-h-[75vh] max-w-[90vw] flex items-center justify-center">
                {photos[lightboxIndex].imageUrl ? (
                  <img
                    src={photos[lightboxIndex].imageUrl}
                    alt={photos[lightboxIndex].caption}
                    className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-stone-800/80"
                  />
                ) : (
                  <div className="p-12 text-center bg-stone-900 text-cream-100 rounded-xl flex flex-col items-center gap-3 border border-stone-800">
                    <span className="text-5xl">{categoryMeta.icon}</span>
                    <p className="font-script text-2xl max-w-sm">{photos[lightboxIndex].caption}</p>
                    <span className="text-xs text-stone-400 font-mono">[Image Unavailable]</span>
                  </div>
                )}
              </div>

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null && prev < photos.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-stone-800/80 hover:bg-stone-700 text-cream-100 flex items-center justify-center text-2xl transition-colors shadow-lg border border-stone-700/80 focus:outline-none"
                  aria-label="Next photo"
                >
                  ›
                </button>
              )}
            </div>

            {/* Lightbox Footer (Caption & Metadata) */}
            <footer className="w-full text-center py-2 flex flex-col items-center gap-1 z-10">
              <p className="font-script text-2xl sm:text-3xl text-cream-100 drop-shadow leading-snug">
                {photos[lightboxIndex].caption}
              </p>
              {photos[lightboxIndex].comments && (
                <p className="text-xs sm:text-sm font-serif italic text-cream-300/80 max-w-xl">
                  &ldquo;{photos[lightboxIndex].comments}&rdquo;
                </p>
              )}
              {photos[lightboxIndex].dateLabel && (
                <span className="text-[10px] font-mono text-stone-400 tracking-wider">
                  {photos[lightboxIndex].dateLabel}
                </span>
              )}
            </footer>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

function PhotoDisplay({
  photo,
  categoryMeta,
}: {
  photo: PhotoItem;
  categoryMeta: (typeof PHOTO_CATEGORIES)[number];
}) {
  const [imageError, setImageError] = useState(false);

  // If real image succeeds loading, show image; otherwise display gorgeous scrapbook placeholder
  if (photo.imageUrl && !imageError) {
    return (
      <img
        src={photo.imageUrl}
        alt={photo.caption}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-cream-200 via-stone-100 to-pistachio-100/40 p-6 flex flex-col items-center justify-center text-center select-none">
      <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>
        {categoryMeta.icon}
      </span>
      <span className="font-script text-lg sm:text-xl text-stone-700 max-w-xs leading-snug">
        {photo.caption}
      </span>
      <span className="font-sans text-[10px] text-stone-400 mt-2 tracking-widest uppercase">
        [Captured Memory]
      </span>
    </div>
  );
}
