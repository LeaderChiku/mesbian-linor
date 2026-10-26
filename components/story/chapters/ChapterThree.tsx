'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import ChapterMediaRenderer, { type ChapterMediaBlock } from './ChapterMediaRenderer';

interface MilestoneItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  date: string;
  note: string;
  icon: string;
}

const defaultMilestones: MilestoneItem[] = [
  {
    id: 'm1',
    badge: 'Milestone I',
    title: 'The First Spark',
    subtitle: 'Where conversations never felt long enough',
    date: 'Day One',
    note: 'The very first hours when we realized time moves differently when we talk.',
    icon: '✨',
  },
  {
    id: 'm2',
    badge: 'Milestone II',
    title: 'Late Night Queues & Inside Jokes',
    subtitle: 'Overtime heartbeats and unstoppable laughter',
    date: 'Gaming Memories',
    note: 'Clutches, lost rounds, chaotic Minecraft builds, and secret corners we claimed as ours.',
    icon: '🎮',
  },
  {
    id: 'm3',
    badge: 'Milestone III',
    title: 'The Unspoken Understanding',
    subtitle: 'When silence felt warm instead of heavy',
    date: 'Autumn Days',
    note: 'Knowing what the other is feeling without having to explain every thought.',
    icon: '🍂',
  },
  {
    id: 'm4',
    badge: 'Milestone IV',
    title: 'Every Small Promise',
    subtitle: 'Building a home inside each other’s days',
    date: 'Kept Forever',
    note: 'The promises made in quiet moments that shaped everything we are now.',
    icon: '🌱',
  },
];

interface ChapterThreeProps {
  mediaBlocks?: ChapterMediaBlock[];
  milestones?: MilestoneItem[];
}

export default function ChapterThree({
  mediaBlocks = [],
  milestones = defaultMilestones,
}: ChapterThreeProps) {
  return (
    <article
      id="chapter-three"
      className="w-full flex flex-col items-center gap-8 py-6 scroll-mt-12"
    >
      {/* Chapter 3 Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center flex flex-col items-center gap-2 max-w-lg mx-auto"
      >
        <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-pistachio-600 font-semibold">
          Chapter III
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-stone-800">
          The Journey Map
        </h2>
        <p className="font-serif text-xs sm:text-sm text-stone-600 italic">
          How every step, laugh, and late-night conversation brought us here.
        </p>
        <FloralDivider className="w-48 opacity-60 mt-1" />
      </motion.div>

      {/* Interactive Milestone Cards */}
      <div className="w-full max-w-xl mx-auto flex flex-col gap-5">
        {milestones.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className="p-5 sm:p-6 rounded-2xl bg-white/90 border border-stone-200/90 shadow-card backdrop-blur-sm flex flex-col gap-2.5 relative overflow-hidden group hover:border-pistachio-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {m.icon}
                </span>
                <span className="font-script text-lg text-pistachio-700">
                  {m.badge}
                </span>
              </div>
              <span className="font-sans text-[10px] uppercase tracking-wider text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">
                {m.date}
              </span>
            </div>

            <h3 className="font-display text-lg text-stone-800">
              {m.title}
            </h3>

            <p className="font-serif text-xs text-stone-500 italic">
              {m.subtitle}
            </p>

            <p className="font-serif text-xs sm:text-sm text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
              {m.note}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Media storytelling blocks */}
      {mediaBlocks.length > 0 && (
        <ChapterMediaRenderer blocks={mediaBlocks} className="max-w-xl mx-auto mt-2" />
      )}
    </article>
  );
}
