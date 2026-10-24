'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import WaxSeal from '@/components/ui/WaxSeal';

/**
 * Ending B — Emotional Goodbye
 *
 * Expresses that the friendship and shared memories have genuinely mattered.
 * Explains that some distance may be needed for personal healing.
 * Makes it clear she has done nothing wrong.
 * Ends with a sincere wish for her happiness, with no guilt or pressure.
 */
export default function EndingB() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-cream-100 rounded-3xl p-7 sm:p-10 shadow-letter border border-stone-200/60 max-w-xl mx-auto overflow-hidden"
    >
      {/* Soft blush top stripe */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, rgba(232,180,184,0.4), rgba(247,207,210,0.9), rgba(232,180,184,0.4))' }}
      />

      {/* Washi tape decoration — blush */}
      <div aria-hidden className="washi-tape washi-tape-blush top-[-8px] left-8 rotate-[2deg]" />

      {/* Header */}
      <header className="flex flex-col items-center gap-2 pb-6 border-b border-stone-200 text-center">
        <div className="text-3xl mb-1" aria-hidden>🥀</div>
        <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 font-medium">
          From the Heart
        </span>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-800 tracking-tight">
          Some Things Are Hard to Keep Inside
        </h2>
      </header>

      {/* Salutation */}
      <div className="pt-6 pb-2">
        <p className="font-script text-2xl sm:text-3xl text-blush-600">
          {/* PLACEHOLDER — replace with her name or leave as-is */}
          To someone I care about more than I said,
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 font-serif text-stone-700 text-sm sm:text-base leading-relaxed text-justify">
        <p>
          <span className="float-left text-4xl sm:text-5xl font-display text-blush-500 pr-2.5 leading-none mt-1">I</span>
          &apos;ve been trying to find the right words for a while now. Not because I want anything from you,
          but because I think you deserve honesty — and honesty has always felt safer in writing.
        </p>
        <p>
          {/* PLACEHOLDER — personalise this paragraph */}
          Our friendship has meant a lot to me. The laughter, the gaming sessions, the moments where it felt
          like the rest of the world didn&apos;t exist — those things were real, and I&apos;m not going to pretend otherwise.
          You&apos;ve been kind to me, and I&apos;m grateful for that.
        </p>
        <p>
          Somewhere along the way, my feelings grew beyond what I was expecting. That&apos;s not something you asked for,
          and I want to be clear — you haven&apos;t done anything wrong. Not one thing. This is entirely mine to deal with.
        </p>
        <p>
          I think I need a little space to get my footing back. Not because I&apos;m angry or hurt,
          but because I care enough about myself — and about you — not to pretend I&apos;m okay when I&apos;m still working through this.
        </p>
        <p>
          If you ever need someone, I&apos;m still here. But I don&apos;t need you to look after my heart — that&apos;s on me.
        </p>
        <p>
          I hope life is gentle with you. I really do.
        </p>
      </div>

      <FloralDivider className="my-6 opacity-50" />

      {/* Voice Note Placeholder */}
      <div className="bg-blush-50 rounded-2xl p-4 border border-blush-200/60">
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-blush-500 mb-1.5">
          🎙️ Voice Note
        </p>
        <p className="font-serif text-xs text-stone-500 leading-relaxed">
          {/* PLACEHOLDER — admin can trigger a voice note from the control panel */}
          A personal message will play here when the administrator sends it from the session panel.
          Replace this placeholder once your voice note recording is ready.
        </p>
      </div>

      {/* 11:11 Wish */}
      <div className="bg-cream-200 rounded-2xl p-4 border border-stone-200/40 text-center mt-4">
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">11:11 Wish</p>
        <p className="font-script text-xl text-stone-700 leading-relaxed">
          {/* PLACEHOLDER — personalise the 11:11 wish */}
          I wish you find the kind of peace that feels like coming home.
        </p>
      </div>

      {/* Signature & Wax Seal */}
      <footer className="mt-8 pt-4 flex items-end justify-between border-t border-stone-100">
        <div className="flex flex-col gap-1">
          <p className="font-script text-xl sm:text-2xl text-stone-600">
            Take care of yourself,
          </p>
          <p className="font-sans text-xs text-stone-400">
            {/* PLACEHOLDER — replace with your name or initials */}
            — M
          </p>
        </div>
        <WaxSeal initials="M&L" size={48} color="blush" />
      </footer>
    </motion.article>
  );
}
