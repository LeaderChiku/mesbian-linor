'use client';

import { motion } from 'framer-motion';

interface LockedChapterGateProps {
  chapterNumber: string;
  chapterTitle: string;
  chapterSubtitle?: string;
}

export default function LockedChapterGate({
  chapterNumber,
  chapterTitle,
  chapterSubtitle,
}: LockedChapterGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-xl mx-auto my-6 p-8 sm:p-10 rounded-3xl border border-dashed border-stone-300 bg-white/70 backdrop-blur-sm shadow-card flex flex-col items-center text-center gap-4 select-none"
    >
      {/* Botanical Corner Flourish */}
      <span className="text-xl opacity-60" aria-hidden>
        🌿
      </span>

      {/* Lock Badge */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-cream-100 border border-stone-300 flex items-center justify-center text-2xl shadow-inner">
          <span>🔒</span>
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pistachio-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pistachio-600" />
        </span>
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <span className="font-script text-lg text-pistachio-700 tracking-wide">
          {chapterNumber}
        </span>
        <h3 className="font-display text-xl sm:text-2xl text-stone-800">
          {chapterTitle}
        </h3>
        {chapterSubtitle && (
          <span className="font-serif text-xs text-stone-500 italic">
            &ldquo;{chapterSubtitle}&rdquo;
          </span>
        )}
      </div>

      {/* Romantic Lock Explanation */}
      <div className="bg-cream-100/90 border border-stone-200/90 rounded-2xl p-4 max-w-md w-full">
        <p className="font-serif text-xs sm:text-sm text-stone-600 leading-relaxed">
          This chapter is sealed for now. When he clicks{' '}
          <strong className="text-stone-800 font-semibold">Next Section</strong> on his control panel,
          this page will unfold for you in real-time.
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] font-sans text-stone-400">
        <span className="w-1.5 h-1.5 rounded-full bg-pistachio-500 animate-pulse" />
        <span>Waiting for storyteller authorization...</span>
      </div>
    </motion.div>
  );
}
