'use client';

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
}: StoryTimelineProps) {
  return (
    <section className="w-full max-w-xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-1">
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Story Map
        </span>
        <h3 className="font-display text-2xl text-stone-800">
          The Chapters of Our Journey
        </h3>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-pistachio-200/80 flex flex-col gap-8 ml-3 sm:ml-4">
        {chapters.map((chapter) => (
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
              className={`
                p-5 rounded-2xl border transition-all duration-300
                ${
                  chapter.isUnlocked
                    ? 'bg-white shadow-card border-stone-200/70 hover:border-pistachio-300'
                    : 'bg-cream-100/70 border-dashed border-stone-300/80 opacity-75'
                }
              `}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-script text-lg text-pistachio-700">
                  {chapter.number}
                </span>
                {chapter.date && (
                  <span className="font-sans text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                    {chapter.date}
                  </span>
                )}
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
