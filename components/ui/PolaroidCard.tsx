'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface PolaroidCardProps {
  children?: React.ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  date?: string;
  rotate?: number;
  tape?: 'pistachio' | 'blush' | 'none';
  tapePosition?: 'top' | 'top-left' | 'top-right';
  className?: string;
}

export default function PolaroidCard({
  children,
  imageUrl,
  imageAlt,
  caption,
  date,
  rotate = 1,
  tape = 'pistachio',
  tapePosition = 'top',
  className = '',
}: PolaroidCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const tapePositions = {
    top:         'top-[-10px] left-1/2 -translate-x-1/2 -rotate-1',
    'top-left':  'top-[-10px] left-2 -rotate-12',
    'top-right': 'top-[-10px] right-2 rotate-12',
  };

  return (
    <motion.div
      style={shouldReduceMotion ? {} : { rotate }}
      whileHover={shouldReduceMotion ? {} : { rotate: 0, scale: 1.025, y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={`
        relative bg-white p-3.5 pb-8 sm:pb-9 shadow-polaroid
        rounded-sm select-none border border-black/[0.04]
        transition-shadow hover:shadow-2xl
        ${className}
      `}
    >
      {/* Scrapbook Washi Tape */}
      {tape !== 'none' && (
        <div
          aria-hidden
          className={`
            washi-tape ${tape === 'blush' ? 'washi-tape-blush' : ''}
            ${tapePositions[tapePosition] || tapePositions.top}
          `}
        />
      )}

      {/* Photo / Visual Frame */}
      <div className="w-full aspect-[4/3] bg-stone-100 rounded-[2px] overflow-hidden flex items-center justify-center border border-black/[0.03]">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={imageAlt || caption || 'Scrapbook photograph'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          children
        )}
      </div>

      {/* Handwritten Caption & Date */}
      {(caption || date) && (
        <div className="mt-3.5 flex flex-col items-center gap-0.5 text-center px-1">
          {caption && (
            <p className="font-script text-base sm:text-lg text-stone-700 leading-snug">
              {caption}
            </p>
          )}
          {date && (
            <p className="font-sans text-[10px] sm:text-xs text-stone-400 uppercase tracking-widest font-medium">
              {date}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
