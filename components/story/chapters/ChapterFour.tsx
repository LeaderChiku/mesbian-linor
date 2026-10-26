'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import WaxSeal from '@/components/ui/WaxSeal';
import EndingA from '@/components/story/endings/EndingA';
import EndingB from '@/components/story/endings/EndingB';
import EndingC from '@/components/story/endings/EndingC';
import ChapterMediaRenderer, { type ChapterMediaBlock } from './ChapterMediaRenderer';

interface ChapterFourProps {
  selectedEnding?: string | null;
  endingATitle?: string;
  endingAWish?: string;
  endingBTitle?: string;
  endingBWish?: string;
  endingCTitle?: string;
  endingCWish?: string;
  onLock?: () => void;
  onExit?: () => void;
  mediaBlocks?: ChapterMediaBlock[];
}

export default function ChapterFour({
  selectedEnding,
  endingATitle,
  endingAWish,
  endingBTitle,
  endingBWish,
  endingCTitle,
  endingCWish,
  onLock,
  onExit,
  mediaBlocks = [],
}: ChapterFourProps) {
  return (
    <article
      id="chapter-four"
      className="w-full flex flex-col items-center gap-8 py-6 scroll-mt-12 text-center"
    >
      {/* Chapter 4 Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center flex flex-col items-center gap-2 max-w-lg mx-auto"
      >
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Chapter IV
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-stone-800">
          A Promise for Tomorrow
        </h2>
        <p className="font-serif text-xs sm:text-sm text-stone-600 italic">
          Until the next page is written — the words that matter most.
        </p>
        <FloralDivider className="w-48 opacity-60 mt-1" />
      </motion.div>

      {/* Media storytelling blocks */}
      {mediaBlocks.length > 0 && (
        <ChapterMediaRenderer blocks={mediaBlocks} className="max-w-xl mx-auto" />
      )}

      {/* Ending Panel or Default Keepsake Blessing */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
        {selectedEnding === 'ending-a' && (
          <div className="w-full text-left">
            <EndingA title={endingATitle} wish={endingAWish} />
          </div>
        )}
        {selectedEnding === 'ending-b' && (
          <div className="w-full text-left">
            <EndingB title={endingBTitle} wish={endingBWish} />
          </div>
        )}
        {selectedEnding === 'ending-c' && (
          <div className="w-full text-left">
            <EndingC title={endingCTitle} wish={endingCWish} />
          </div>
        )}

        {!selectedEnding && (
          <div className="flex flex-col items-center gap-3 py-4">
            <WaxSeal initials="M&L" size={56} color="pistachio" />
            <p className="font-script text-2xl text-pistachio-800">
              made with all our love ♡
            </p>
            <p className="font-serif text-xs text-stone-500 max-w-xs leading-relaxed">
              Your progress is securely saved. You can return anytime on your phone or laptop.
            </p>
          </div>
        )}

        {/* Lock Story Actions */}
        <div className="flex items-center gap-4 mt-2">
          {onLock && (
            <button
              onClick={onLock}
              className="text-[11px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-700 underline underline-offset-4 transition-colors"
            >
              🔒 Lock Story
            </button>
          )}
          {onExit && (
            <button
              onClick={onExit}
              className="text-[11px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-700 underline underline-offset-4 transition-colors"
            >
              🚪 Leave Story
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
