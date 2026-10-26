'use client';

import { motion } from 'framer-motion';

export type MediaBlockType = 'text' | 'photo' | 'video';

export interface ChapterMediaBlock {
  id: string;
  type: MediaBlockType;
  content: string; // text content, or image URL, or video URL
  caption?: string;
  subtitle?: string;
  dateLabel?: string;
  orderIndex?: number;
}

interface ChapterMediaRendererProps {
  blocks: ChapterMediaBlock[];
  className?: string;
}

export default function ChapterMediaRenderer({
  blocks,
  className = '',
}: ChapterMediaRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <motion.div
              key={block.id || `text-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="prose prose-stone max-w-none text-stone-700 font-serif text-sm sm:text-base leading-relaxed"
            >
              <p className="whitespace-pre-line">{block.content}</p>
            </motion.div>
          );
        }

        if (block.type === 'photo') {
          return (
            <motion.figure
              key={block.id || `photo-${index}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="my-3 mx-auto max-w-md w-full bg-white p-3 sm:p-4 rounded-xl shadow-card border border-stone-200/80 rotate-[-1deg] hover:rotate-0 transition-transform duration-300"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-stone-100 border border-stone-100 flex items-center justify-center">
                <img
                  src={block.content}
                  alt={block.caption || 'Story photograph'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback visually if image not found
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-4 text-center text-stone-400 text-xs">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span>{block.caption || 'Photo Moment'}</span>
                </div>
              </div>

              {(block.caption || block.dateLabel) && (
                <figcaption className="pt-3 pb-1 px-1 flex items-baseline justify-between gap-2">
                  <span className="font-script text-base text-stone-800 leading-tight">
                    {block.caption}
                  </span>
                  {block.dateLabel && (
                    <span className="font-sans text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                      {block.dateLabel}
                    </span>
                  )}
                </figcaption>
              )}
            </motion.figure>
          );
        }

        if (block.type === 'video') {
          return (
            <motion.figure
              key={block.id || `video-${index}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="my-3 mx-auto max-w-lg w-full bg-stone-900 p-2 sm:p-3 rounded-2xl shadow-xl border border-stone-800 text-stone-100"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
                <video
                  src={block.content}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>

              {block.caption && (
                <figcaption className="pt-2.5 pb-1 px-2 flex items-center justify-between text-xs text-stone-300">
                  <span className="font-sans text-xs flex items-center gap-1.5 text-pistachio-400">
                    <span>🎬</span>
                    <span className="text-stone-300">{block.caption}</span>
                  </span>
                  {block.dateLabel && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      {block.dateLabel}
                    </span>
                  )}
                </figcaption>
              )}
            </motion.figure>
          );
        }

        return null;
      })}
    </div>
  );
}
