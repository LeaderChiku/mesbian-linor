'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import ChapterMediaRenderer, { type ChapterMediaBlock } from './ChapterMediaRenderer';

interface ChapterPrologueProps {
  dedication: string;
  title: string;
  welcomeText: string;
  mediaBlocks?: ChapterMediaBlock[];
}

export default function ChapterPrologue({
  dedication,
  title,
  welcomeText,
  mediaBlocks = [],
}: ChapterPrologueProps) {
  return (
    <article
      id="chapter-prologue"
      className="w-full flex flex-col items-center gap-6 py-6 scroll-mt-12"
    >
      {/* Botanical Crest & Dedication */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center text-center gap-3"
      >
        <div className="flex items-center gap-3" aria-hidden>
          <span className="text-2xl">🌿</span>
          <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-pistachio-600 font-semibold">
            {dedication}
          </span>
          <span className="text-2xl">🌿</span>
        </div>

        <h2 className="font-script text-4xl sm:text-6xl text-pistachio-800 leading-tight">
          {title}
        </h2>

        <p className="font-serif text-stone-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          {welcomeText}
        </p>

        <FloralDivider className="w-full max-w-sm mt-1 opacity-80" />
      </motion.div>

      {/* Media storytelling blocks */}
      {mediaBlocks.length > 0 && (
        <ChapterMediaRenderer blocks={mediaBlocks} className="max-w-xl mx-auto mt-2" />
      )}
    </article>
  );
}
