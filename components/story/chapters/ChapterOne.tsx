'use client';

import { motion } from 'framer-motion';
import PolaroidCard from '@/components/ui/PolaroidCard';
import FloralDivider from '@/components/ui/FloralDivider';
import ChapterMediaRenderer, { type ChapterMediaBlock } from './ChapterMediaRenderer';
import { type CategorySlug } from '@/lib/photos';

interface ChapterOneProps {
  onSelectCategory: (category: CategorySlug) => void;
  goldenTitle: string;
  goldenDesc: string;
  lateTitle: string;
  lateDesc: string;
  worldTitle: string;
  worldDesc: string;
  foldedTitle: string;
  foldedDesc: string;
  mediaBlocks?: ChapterMediaBlock[];
}

export default function ChapterOne({
  onSelectCategory,
  goldenTitle,
  goldenDesc,
  lateTitle,
  lateDesc,
  worldTitle,
  worldDesc,
  foldedTitle,
  foldedDesc,
  mediaBlocks = [],
}: ChapterOneProps) {
  return (
    <article
      id="chapter-one"
      className="w-full flex flex-col items-center gap-8 py-6 scroll-mt-12"
    >
      {/* Chapter 1 Cinematic Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center flex flex-col items-center gap-2 max-w-lg mx-auto"
      >
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Chapter I
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-stone-800">
          Treasured Moments
        </h2>
        <p className="font-serif text-xs sm:text-sm text-stone-600 italic">
          Golden light, shared queues, and whispers kept close. Tap any album to open its polaroids.
        </p>
        <FloralDivider className="w-48 opacity-60 mt-1" />
      </motion.div>

      {/* 4 Polaroid Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8 w-full max-w-lg mx-auto">
        {/* Category 1: The Golden Hour */}
        <div
          onClick={() => onSelectCategory('the-golden-hour')}
          className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectCategory('the-golden-hour')}
          aria-label="Open The Golden Hour album"
        >
          <PolaroidCard
            rotate={-2.5}
            tape="pistachio"
            tapePosition="top-left"
            caption={goldenTitle}
            date="Day One"
          >
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-pistachio-50 to-cream-300 flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>
                🌅
              </span>
              <span className="font-script text-stone-700 text-base leading-snug">
                {goldenDesc}
              </span>
              <span className="font-sans text-[10px] text-pistachio-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span>View Album</span>
                <span>↗</span>
              </span>
            </div>
          </PolaroidCard>
        </div>

        {/* Category 2: Late Night Queues */}
        <div
          onClick={() => onSelectCategory('late-night-queues')}
          className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectCategory('late-night-queues')}
          aria-label="Open Late Night Queues album"
        >
          <PolaroidCard
            rotate={2}
            tape="blush"
            tapePosition="top-right"
            caption={lateTitle}
            date="Valorant Memories"
          >
            <div className="w-full h-full bg-gradient-to-br from-rose-100 via-blush-50 to-cream-300 flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>
                🎮
              </span>
              <span className="font-script text-stone-700 text-base leading-snug">
                {lateDesc}
              </span>
              <span className="font-sans text-[10px] text-blush-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span>View Album</span>
                <span>↗</span>
              </span>
            </div>
          </PolaroidCard>
        </div>

        {/* Category 3: Our Little World */}
        <div
          onClick={() => onSelectCategory('our-little-world')}
          className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectCategory('our-little-world')}
          aria-label="Open Our Little World album"
        >
          <PolaroidCard
            rotate={1.5}
            tape="pistachio"
            tapePosition="top-right"
            caption={worldTitle}
            date="Minecraft & Inside Jokes"
          >
            <div className="w-full h-full bg-gradient-to-br from-pistachio-100 via-cream-100 to-cream-200 flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>
                🌱
              </span>
              <span className="font-script text-stone-700 text-base leading-snug">
                {worldDesc}
              </span>
              <span className="font-sans text-[10px] text-pistachio-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span>View Album</span>
                <span>↗</span>
              </span>
            </div>
          </PolaroidCard>
        </div>

        {/* Category 4: Folded Whispers */}
        <div
          onClick={() => onSelectCategory('folded-whispers')}
          className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectCategory('folded-whispers')}
          aria-label="Open Folded Whispers album"
        >
          <PolaroidCard
            rotate={-1.8}
            tape="blush"
            tapePosition="top-left"
            caption={foldedTitle}
            date="Kept Forever"
          >
            <div className="w-full h-full bg-gradient-to-br from-cream-300 via-blush-50 to-stone-200 flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>
                💌
              </span>
              <span className="font-script text-stone-700 text-base leading-snug">
                {foldedDesc}
              </span>
              <span className="font-sans text-[10px] text-blush-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span>View Album</span>
                <span>↗</span>
              </span>
            </div>
          </PolaroidCard>
        </div>
      </div>

      {/* Media storytelling blocks */}
      {mediaBlocks.length > 0 && (
        <ChapterMediaRenderer blocks={mediaBlocks} className="max-w-xl mx-auto mt-2" />
      )}
    </article>
  );
}
