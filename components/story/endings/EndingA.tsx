'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import WaxSeal from '@/components/ui/WaxSeal';

/**
 * Ending A — Normal Goodbye
 *
 * A gentle, warm conclusion. Expresses appreciation for the friendship
 * and shared memories, wishes her happiness, and respects her freedom.
 * No expectations, no guilt, no pressure.
 */
interface EndingAProps {
  title?: string;
  wish?: string;
}

export default function EndingA({
  title = 'Thank You for Everything',
  wish = 'I wish you a life full of moments that make you smile without knowing why.',
}: EndingAProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-cream-100 rounded-3xl p-7 sm:p-10 shadow-letter border border-stone-200/60 max-w-xl mx-auto overflow-hidden"
    >
      {/* Soft pistachio top stripe */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, rgba(143,175,107,0.5), rgba(207,224,170,0.8), rgba(143,175,107,0.5))' }}
      />

      {/* Washi tape decoration */}
      <div aria-hidden className="washi-tape top-[-8px] left-8 rotate-[-2deg]" />

      {/* Header */}
      <header className="flex flex-col items-center gap-2 pb-6 border-b border-stone-200 text-center">
        <div className="text-3xl mb-1" aria-hidden>🌿</div>
        <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 font-medium">
          A Quiet Goodbye
        </span>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-800 tracking-tight">
          {title}
        </h2>
      </header>

      {/* Salutation */}
      <div className="pt-6 pb-2">
        <p className="font-script text-2xl sm:text-3xl text-pistachio-700">
          {/* PLACEHOLDER — replace with her name or leave as-is */}
          To the one who made ordinary days feel different,
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 font-serif text-stone-700 text-sm sm:text-base leading-relaxed text-justify">
        <p>
          <span className="float-left text-4xl sm:text-5xl font-display text-pistachio-600 pr-2.5 leading-none mt-1">S</span>
          ome people walk into your life and, without even trying, make it a little warmer. You were that for me.
          Every laugh, every late-night conversation, every moment we shared — I carry them with gratitude.
        </p>
        <p>
          {/* PLACEHOLDER — personalise this paragraph with a specific shared memory */}
          I&apos;ve loved having you as a friend. The Valorant queues, the Minecraft afternoons, the random voice calls —
          they all meant more than I probably ever said out loud. I&apos;m glad I got to know you.
        </p>
        <p>
          You owe me nothing — not a reply, not an explanation, not your time. You are completely free to go
          where life takes you, and I genuinely hope that place is full of good things.
        </p>
        <p>
          Whatever comes next for you, I&apos;m rooting for it. Be well. Be happy. That&apos;s all I&apos;ve ever wanted for you.
        </p>
      </div>

      <FloralDivider className="my-6 opacity-50" />

      {/* 11:11 Wish */}
      <div className="bg-pistachio-50 rounded-2xl p-4 border border-pistachio-200/60 text-center">
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-pistachio-600 mb-1.5">11:11 Wish</p>
        <p className="font-script text-xl text-pistachio-800 leading-relaxed">
          {wish}
        </p>
      </div>

      {/* Signature & Wax Seal */}
      <footer className="mt-8 pt-4 flex items-end justify-between border-t border-stone-100">
        <div className="flex flex-col gap-1">
          <p className="font-script text-xl sm:text-2xl text-stone-600">
            With a warm heart,
          </p>
          <p className="font-sans text-xs text-stone-400">
            {/* PLACEHOLDER — replace with your name or initials */}
            — M
          </p>
        </div>
        <WaxSeal initials="M&L" size={48} color="pistachio" />
      </footer>
    </motion.article>
  );
}
