'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaxSeal from '@/components/ui/WaxSeal';
import FloralDivider from '@/components/ui/FloralDivider';
import { getCmsValue } from '@/lib/cms';

interface RomanticExperienceProps {
  cmsData?: Record<string, string>;
  onLock?: () => void;
  onReturnToStory?: () => void;
}

interface FloatingClickHeart {
  id: number;
  x: number;
  y: number;
  char: string;
}

export default function RomanticExperience({
  cmsData,
  onLock,
  onReturnToStory,
}: RomanticExperienceProps) {
  const [clickHearts, setClickHearts] = useState<FloatingClickHeart[]>([]);
  const [revealedExtra, setRevealedExtra] = useState(false);

  // Retrieve CMS customized fields or default fallbacks
  const title = getCmsValue(cmsData, 'twistTitle');
  const subtitle = getCmsValue(cmsData, 'twistSubtitle');
  const declaration = getCmsValue(cmsData, 'twistDeclaration');
  const wish = getCmsValue(cmsData, 'twistWish');

  const handleClickSpawn = (e: React.MouseEvent<HTMLDivElement>) => {
    // Spawn heart at tap / click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const symbols = ['🌸', '💖', '✨', '🌷', '🤍', '🎀'];
    const char = symbols[Math.floor(Math.random() * symbols.length)];

    const newHeart: FloatingClickHeart = {
      id: Date.now() + Math.random(),
      x,
      y,
      char,
    };

    setClickHearts((prev) => [...prev.slice(-15), newHeart]);

    setTimeout(() => {
      setClickHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  return (
    <div
      onClick={handleClickSpawn}
      className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-[#fdf4f4] via-[#fce8e9] to-[#f7d6d9] text-stone-800 flex flex-col items-center justify-center px-4 py-12 sm:py-20 select-none"
    >
      {/* ── Ambient Romantic Glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle 700px at 50% 30%, rgba(247, 207, 210, 0.7) 0%, transparent 70%), radial-gradient(circle 600px at 20% 80%, rgba(232, 180, 184, 0.5) 0%, transparent 60%)',
        }}
      />

      {/* ── Background Drifting Petals / Hearts ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.span
            key={i}
            initial={{
              y: '110vh',
              x: `${(i * 7.5 + 5)}vw`,
              opacity: 0,
              rotate: 0,
              scale: 0.8,
            }}
            animate={{
              y: '-10vh',
              opacity: [0, 0.7, 0.8, 0],
              rotate: 360,
              scale: [0.8, 1.2, 0.9],
            }}
            transition={{
              duration: 12 + (i % 6) * 3,
              repeat: Infinity,
              delay: (i * 1.3) % 10,
              ease: 'linear',
            }}
            className="absolute text-xl sm:text-2xl text-rose-300/60"
          >
            {i % 3 === 0 ? '🌸' : i % 3 === 1 ? '💖' : '✨'}
          </motion.span>
        ))}
      </div>

      {/* ── Spawned Click Particles ── */}
      <AnimatePresence>
        {clickHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.5, x: h.x, y: h.y }}
            animate={{
              opacity: 0,
              scale: 1.6,
              y: h.y - 120,
              x: h.x + (Math.random() - 0.5) * 60,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="pointer-events-none absolute text-2xl z-50 drop-shadow-md"
          >
            {h.char}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Central Romantic Declaration Card ── */}
      <motion.article
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-12 shadow-2xl border border-rose-200/80 flex flex-col items-center text-center gap-6"
      >
        {/* Soft rose washi ribbon */}
        <div
          aria-hidden
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-32 h-7 bg-rose-200/90 border border-rose-300/70 shadow-sm rounded-sm rotate-[-0.8deg] flex items-center justify-center text-[10px] uppercase font-mono tracking-widest text-rose-800 font-semibold"
        >
          Special Chapter
        </div>

        {/* Botanical Heart Crest */}
        <div className="flex items-center gap-2 pt-2" aria-hidden>
          <span className="text-2xl">🌸</span>
          <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-rose-600 font-semibold">
            {subtitle}
          </span>
          <span className="text-2xl">🌸</span>
        </div>

        {/* Title */}
        <h1 className="font-script text-4xl sm:text-5xl text-rose-950 leading-tight">
          {title}
        </h1>

        <FloralDivider className="w-full max-w-xs opacity-70" />

        {/* Declaration Paragraphs */}
        <div className="flex flex-col gap-4 font-serif text-stone-700 text-sm sm:text-base leading-relaxed text-center sm:text-justify max-w-md">
          <p className="leading-relaxed">
            <span className="float-left text-4xl font-display text-rose-500 pr-2 leading-none">
              I
            </span>
            {declaration.slice(1)}
          </p>

          <p className="text-stone-600 text-xs sm:text-sm italic leading-relaxed text-center pt-2">
            Every moment we talked, every laugh that slipped out when we were tired,
            and every memory in this scrapbook — it was never just a coincidence.
          </p>
        </div>

        {/* 11:11 Wish Card */}
        <div className="w-full bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-2xl p-4 sm:p-5 border border-rose-200/80 text-center shadow-inner">
          <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-rose-500 font-semibold block mb-1">
            An 11:11 Wish for You
          </span>
          <p className="font-script text-2xl text-rose-900 leading-snug">
            &ldquo;{wish}&rdquo;
          </p>
        </div>

        {/* Interactive Heart Touch Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealedExtra((prev) => !prev);
          }}
          className="px-5 py-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-serif italic tracking-wide transition-all shadow-sm flex items-center gap-2"
        >
          <span>💌</span>
          <span>{revealedExtra ? 'Hide quiet thoughts' : 'A small note for you...'}</span>
        </button>

        <AnimatePresence>
          {revealedExtra && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-cream-100/90 rounded-xl p-4 border border-rose-200 text-xs font-serif text-stone-600 leading-relaxed text-center"
            >
              No expectations, no pressure, and no rush.
              Just me being honest about the place you hold in my heart. ♡
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wax Seal & Footer */}
        <footer className="w-full pt-4 border-t border-rose-100 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="font-script text-xl text-rose-800">Always yours,</span>
            <span className="font-sans text-[11px] text-stone-400">— M</span>
          </div>

          <WaxSeal initials="M&L" size={48} color="blush" />
        </footer>
      </motion.article>

      {/* ── Subtitle / Tap Prompt ── */}
      <span className="relative z-10 mt-6 text-[11px] font-sans tracking-widest uppercase text-rose-700/80">
        Tap anywhere to bloom 🌸
      </span>

      {/* ── Action Buttons ── */}
      <div className="relative z-10 flex items-center gap-5 mt-4">
        {onReturnToStory && (
          <button
            onClick={onReturnToStory}
            className="text-[11px] font-sans tracking-widest uppercase text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors"
          >
            ← View Scrapbook
          </button>
        )}
        {onLock && (
          <button
            onClick={onLock}
            className="text-[11px] font-sans tracking-widest uppercase text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors"
          >
            🔒 Lock Story
          </button>
        )}
      </div>
    </div>
  );
}
