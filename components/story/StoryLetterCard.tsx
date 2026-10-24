'use client';

import { motion } from 'framer-motion';
import WaxSeal from '@/components/ui/WaxSeal';

interface StoryLetterCardProps {
  title?: string;
  date?: string;
  salutation?: string;
  paragraphs?: string[];
  signature?: string;
  waxSealInitials?: string;
}

export default function StoryLetterCard({
  title = 'A Message for You',
  date = 'October 24, 2026',
  salutation = 'Dearest,',
  paragraphs = [
    'Some moments in our lives deserve to be set apart from the ordinary rush of days. They ask for patience, for anticipation, and for a place where words can breathe quietly.',
    'This journal was made to hold the fragments of memory that belong only to us — the laughter that lingers in quiet rooms, the photographs taken in golden light, and the promises kept in stillness.',
    'As you wander through these pages, know that every single detail was placed here with care, waiting for the exact moment you would arrive.',
  ],
  signature = 'With all my heart,',
  waxSealInitials = 'M&L',
}: StoryLetterCardProps) {
  return (
    <article className="relative bg-white rounded-3xl p-7 sm:p-10 shadow-letter border border-stone-200/60 max-w-xl mx-auto overflow-hidden">
      {/* Top subtle decorative tape */}
      <div
        aria-hidden
        className="washi-tape top-[-8px] left-1/2 -translate-x-1/2 rotate-1"
      />

      {/* Letter Header */}
      <header className="flex flex-col items-center gap-1.5 pb-6 border-b border-stone-100 text-center">
        {date && (
          <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 font-medium">
            {date}
          </span>
        )}
        <h2 className="font-display text-2xl sm:text-3xl text-stone-800 tracking-tight">
          {title}
        </h2>
      </header>

      {/* Salutation */}
      <div className="pt-6 pb-2">
        <p className="font-script text-2xl sm:text-3xl text-pistachio-700">
          {salutation}
        </p>
      </div>

      {/* Body paragraphs with drop cap on first paragraph */}
      <div className="flex flex-col gap-4 font-serif text-stone-700 text-sm sm:text-base leading-relaxed text-justify">
        {paragraphs.map((p, idx) => {
          if (idx === 0) {
            const firstLetter = p.slice(0, 1);
            const rest = p.slice(1);
            return (
              <p key={idx}>
                <span className="float-left text-4xl sm:text-5xl font-display text-pistachio-600 pr-2.5 leading-none mt-1">
                  {firstLetter}
                </span>
                {rest}
              </p>
            );
          }
          return <p key={idx}>{p}</p>;
        })}
      </div>

      {/* Signature & Wax Seal */}
      <footer className="mt-8 pt-4 flex items-end justify-between border-t border-stone-100">
        <div className="flex flex-col">
          <p className="font-script text-xl sm:text-2xl text-stone-600">
            {signature}
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <WaxSeal initials={waxSealInitials} size={48} color="blush" />
        </motion.div>
      </footer>
    </article>
  );
}
