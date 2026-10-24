'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import WaxSeal from '@/components/ui/WaxSeal';

/**
 * Ending C — Romantic Conversation Ending
 *
 * CONSENT REQUIREMENT:
 * This ending must only be selected by the administrator when she has
 * EXPLICITLY and VOLUNTARILY expressed that she is comfortable discussing
 * the possibility of a romantic relationship.
 *
 * This ending is NEVER selected automatically.
 * It is NOT triggered by reactions, silence, or completing sections.
 * The administrator must manually choose it from the admin control panel.
 *
 * Design: warm but unhurried. A personal letter, honest expression of
 * feelings, clear acknowledgment that she may feel differently, and a
 * respectful invitation to talk — with no pressure for an answer.
 */
export default function EndingC() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-cream-100 rounded-3xl p-7 sm:p-10 shadow-letter border border-stone-200/60 max-w-xl mx-auto overflow-hidden"
    >
      {/* Warm dual-tone top stripe */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, rgba(143,175,107,0.5), rgba(232,180,184,0.7), rgba(143,175,107,0.5))' }}
      />

      {/* Washi tape decoration */}
      <div aria-hidden className="washi-tape top-[-8px] right-8 rotate-[1.5deg]" />

      {/* Header */}
      <header className="flex flex-col items-center gap-2 pb-6 border-b border-stone-200 text-center">
        <div className="text-3xl mb-1" aria-hidden>💌</div>
        <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 font-medium">
          An Honest Conversation
        </span>
        <h2 className="font-display text-2xl sm:text-3xl text-stone-800 tracking-tight">
          Something I&apos;d Like to Say
        </h2>
      </header>

      {/* Salutation */}
      <div className="pt-6 pb-2">
        <p className="font-script text-2xl sm:text-3xl text-pistachio-700">
          {/* PLACEHOLDER — replace with her name if comfortable */}
          To the person reading this,
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 font-serif text-stone-700 text-sm sm:text-base leading-relaxed text-justify">
        <p>
          <span className="float-left text-4xl sm:text-5xl font-display text-pistachio-600 pr-2.5 leading-none mt-1">T</span>
          here&apos;s something I&apos;ve wanted to say for a while, and I&apos;ve been trying to find the right way to say it.
          Writing has always felt more honest to me than anything else — so here I am, writing.
        </p>
        <p>
          {/* PLACEHOLDER — personalise this paragraph with a real shared memory */}
          I think about the time we first started talking, and how none of it felt like it was going to matter this much.
          But it did. You&apos;ve made ordinary things feel different. Somehow the days where we talked were
          always a little better than the ones where we didn&apos;t.
        </p>
        <p>
          I&apos;ve realised that what I feel for you might be something more than friendship.
          I&apos;m not saying this to make things awkward or to put any pressure on you —
          I genuinely mean that. You owe me nothing. Not an answer, not a specific reaction, not anything.
        </p>
        <p>
          You might not feel the same way, and if that&apos;s the case, that&apos;s completely okay.
          I would rather have your honesty than a kindness that doesn&apos;t reflect what you actually feel.
          Our friendship has always meant something to me, and I don&apos;t want you to feel like you have to
          choose between keeping me in your life and being honest with yourself.
        </p>
        <p>
          If you&apos;d like to talk about it — in whatever way feels comfortable for you — I&apos;m here.
          If you need time to think, that&apos;s okay too. If your answer is no, I&apos;ll respect that without question.
        </p>
        <p>
          All I wanted was for you to know.
        </p>
      </div>

      <FloralDivider className="my-6 opacity-50" />

      {/* Gentle pause note */}
      <div className="bg-pistachio-50 rounded-2xl p-4 border border-pistachio-200/60 text-center">
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-pistachio-600 mb-1.5">
          No rush. No deadline.
        </p>
        <p className="font-serif text-sm text-stone-600 leading-relaxed">
          {/* PLACEHOLDER — personalise this closing note */}
          Whenever you&apos;re ready — or if you&apos;re not — that&apos;s okay too.
          I&apos;ll be here either way.
        </p>
      </div>

      {/* 11:11 Wish */}
      <div className="bg-cream-200 rounded-2xl p-4 border border-stone-200/40 text-center mt-4">
        <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-1.5">11:11 Wish</p>
        <p className="font-script text-xl text-stone-700 leading-relaxed">
          {/* PLACEHOLDER — personalise the 11:11 wish */}
          I wish that whatever you choose leads you exactly where you&apos;re meant to be.
        </p>
      </div>

      {/* Signature & Wax Seal */}
      <footer className="mt-8 pt-4 flex items-end justify-between border-t border-stone-100">
        <div className="flex flex-col gap-1">
          <p className="font-script text-xl sm:text-2xl text-stone-600">
            Honestly yours,
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
