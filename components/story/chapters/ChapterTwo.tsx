'use client';

import { motion } from 'framer-motion';
import StoryLetterCard from '@/components/story/StoryLetterCard';
import FloralDivider from '@/components/ui/FloralDivider';
import ChapterMediaRenderer, { type ChapterMediaBlock } from './ChapterMediaRenderer';

interface ChapterTwoProps {
  title: string;
  date: string;
  salutation: string;
  paragraphs: string[];
  signature: string;
  mediaBlocks?: ChapterMediaBlock[];
}

export default function ChapterTwo({
  title,
  date,
  salutation,
  paragraphs,
  signature,
  mediaBlocks = [],
}: ChapterTwoProps) {
  return (
    <article
      id="chapter-two"
      className="w-full flex flex-col items-center gap-6 py-6 scroll-mt-12"
    >
      {/* Chapter 2 Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center flex flex-col items-center gap-2 max-w-lg mx-auto"
      >
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Chapter II
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-stone-800">
          The Letter
        </h2>
        <p className="font-serif text-xs sm:text-sm text-stone-600 italic">
          Words written slowly, kept close to the chest, and meant only for you.
        </p>
        <FloralDivider className="w-48 opacity-60 mt-1" />
      </motion.div>

      {/* Parchment Letter */}
      <div className="w-full max-w-xl mx-auto">
        <StoryLetterCard
          title={title}
          date={date}
          salutation={salutation}
          paragraphs={paragraphs}
          signature={signature}
          waxSealInitials="M&L"
        />
      </div>

      {/* Media storytelling blocks */}
      {mediaBlocks.length > 0 && (
        <ChapterMediaRenderer blocks={mediaBlocks} className="max-w-xl mx-auto mt-2" />
      )}
    </article>
  );
}
