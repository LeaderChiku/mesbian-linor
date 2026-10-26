'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface StoryChapter {
  id:          string;
  number:      string; // e.g. "Chapter I"
  title:       string;
  description: string;
  isUnlocked:  boolean;
  date?:       string;
}

interface StoryTimelineProps {
  chapters?: StoryChapter[];
  unlockedIndex?: number;
  onSelectChapter?: (index: number) => void;
}

const defaultChapters: StoryChapter[] = [
  {
    id: 'ch-prologue',
    number: 'Prologue',
    title: 'A Story for You',
    description: 'Where memories find their home. The opening dedication and botanical crest.',
    isUnlocked: true,
    date: 'The Beginning',
  },
  {
    id: 'ch-1',
    number: 'Chapter I',
    title: 'Treasured Moments',
    description: 'Polaroid gallery — golden light and captured whispers from the days we shared.',
    isUnlocked: true,
    date: 'Our Memories',
  },
  {
    id: 'ch-2',
    number: 'Chapter II',
    title: 'The Letter',
    description: 'Words kept close to the chest. A parchment letter with handwritten care.',
    isUnlocked: true,
    date: 'Written for You',
  },
  {
    id: 'ch-3',
    number: 'Chapter III',
    title: 'The Journey Map',
    description: 'How every step brought us here — a map of the path we walked together.',
    isUnlocked: true,
    date: 'Our Story',
  },
  {
    id: 'ch-4',
    number: 'Chapter IV',
    title: 'A Promise for Tomorrow',
    description: 'The final chapter — a closing page, a seal, and the words that matter most.',
    isUnlocked: true,
    date: 'Until Next Time',
  },
];

export default function StoryTimelineCard({
  chapters = defaultChapters,
  unlockedIndex = 0,
  onSelectChapter,
}: StoryTimelineProps) {
  const [readyStatus, setReadyStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Compute unlock state based on authoritative unlockedIndex
  const computedChapters = chapters.map((ch, idx) => ({
    ...ch,
    isUnlocked: idx <= unlockedIndex,
  }));

  const handleChapterClick = (index: number, isUnlocked: boolean, title: string) => {
    if (!isUnlocked) {
      setLockedNotice(`🔒 ${title} is currently sealed. When the storyteller clicks "Next Section", it will unlock automatically!`);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    if (onSelectChapter) {
      onSelectChapter(index);
    } else {
      const sectionIds = [
        'section-hero',
        'section-polaroids',
        'section-letter',
        'section-timeline',
        'section-closing',
      ];
      const targetId = sectionIds[index];
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleReadyToBegin = async () => {
    if (readyStatus === 'sending' || readyStatus === 'sent') return;
    setReadyStatus('sending');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/session/ready-to-begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Your girl is ready to see the story! 💌' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReadyStatus('sent');
      } else {
        setErrorMessage(data.error || 'Failed to send notification');
        setReadyStatus('error');
      }
    } catch {
      setErrorMessage('Network error sending notification');
      setReadyStatus('error');
    }
  };

  return (
    <section className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-1.5">
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Story Map
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-stone-800">
          The Chapters of Our Journey
        </h3>

        {/* Ready to Begin Action Button */}
        <motion.button
          onClick={handleReadyToBegin}
          disabled={readyStatus === 'sending' || readyStatus === 'sent'}
          whileHover={readyStatus === 'idle' ? { scale: 1.03 } : {}}
          whileTap={readyStatus === 'idle' ? { scale: 0.97 } : {}}
          className={`
            mt-2.5 px-6 py-2.5 rounded-full text-xs font-sans tracking-widest uppercase font-semibold
            transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm
            ${
              readyStatus === 'sent'
                ? 'bg-pistachio-100 text-pistachio-800 border-pistachio-300 shadow-inner'
                : readyStatus === 'sending'
                ? 'bg-stone-100 text-stone-500 border-stone-200 cursor-wait'
                : 'bg-white hover:bg-pistachio-50 text-pistachio-700 hover:text-pistachio-900 border-pistachio-300/80 cursor-pointer shadow-sm hover:shadow'
            }
          `}
        >
          {readyStatus === 'sending' && (
            <>
              <span className="w-2 h-2 rounded-full bg-pistachio-600 animate-ping mr-1" />
              <span>Notifying him...</span>
            </>
          )}
          {readyStatus === 'sent' && (
            <>
              <span>✓</span>
              <span>He knows you&apos;re ready 💌</span>
            </>
          )}
          {(readyStatus === 'idle' || readyStatus === 'error') && (
            <>
              <span aria-hidden>💌</span>
              <span>Ready to Begin</span>
            </>
          )}
        </motion.button>

        {errorMessage && (
          <p className="text-[11px] font-sans text-stone-500 mt-1 italic">
            {errorMessage}
          </p>
        )}

        {lockedNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium max-w-sm"
          >
            {lockedNotice}
          </motion.div>
        )}
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-pistachio-200/80 flex flex-col gap-8 ml-3 sm:ml-4">
        {computedChapters.map((chapter, idx) => (
          <div key={chapter.id} className="relative group">
            {/* Timeline bullet / node */}
            <div
              className={`
                absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2
                ${
                  chapter.isUnlocked
                    ? 'bg-pistachio-400 border-white shadow-sm text-stone-900 text-xs'
                    : 'bg-cream-100 border-stone-300 text-stone-400 text-xs'
                }
              `}
            >
              {chapter.isUnlocked ? '✓' : '🔒'}
            </div>

            {/* Chapter Card */}
            <div
              onClick={() => handleChapterClick(idx, chapter.isUnlocked, chapter.title)}
              className={`
                p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                ${
                  chapter.isUnlocked
                    ? 'bg-white shadow-card border-stone-200/70 hover:border-pistachio-400 hover:shadow-md'
                    : 'bg-cream-100/70 border-dashed border-stone-300/80 opacity-75 hover:border-stone-400'
                }
              `}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-script text-lg text-pistachio-700">
                  {chapter.number}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  {chapter.isUnlocked ? (
                    <span className="text-pistachio-700 bg-pistachio-100/80 px-2 py-0.5 rounded-full">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                      🔒 Sealed
                    </span>
                  )}
                </span>
              </div>

              <h4 className="font-display text-lg text-stone-800 mb-1">
                {chapter.title}
              </h4>

              <p className="font-serif text-xs sm:text-sm text-stone-600 leading-relaxed">
                {chapter.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
