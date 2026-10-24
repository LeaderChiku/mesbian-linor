'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import PolaroidCard from '@/components/ui/PolaroidCard';
import StoryLetterCard from '@/components/story/StoryLetterCard';
import StoryTimelineCard from '@/components/story/StoryTimelineCard';
import AmbientAudioToggle from '@/components/ui/AmbientAudioToggle';
import WaxSeal from '@/components/ui/WaxSeal';
import EndingA from '@/components/story/endings/EndingA';
import EndingB from '@/components/story/endings/EndingB';
import EndingC from '@/components/story/endings/EndingC';
import { clearSession } from '@/lib/session';

interface WelcomeSectionProps {
  storyTitle: string;
  activeSectionIndex?: number;
  selectedEnding?: string | null;
  onLock?: () => void;
  onExit?: () => void;
}

const containerVariants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.16,
      delayChildren:   0.1,
    },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function WelcomeSection({
  storyTitle,
  activeSectionIndex,
  selectedEnding,
  onLock,
  onExit,
}: WelcomeSectionProps) {
  // Smoothly scroll visitor phone to the section navigated by Admin
  useEffect(() => {
    if (typeof activeSectionIndex === 'number') {
      const sectionIds = [
        'section-hero',
        'section-polaroids',
        'section-letter',
        'section-timeline',
        'section-closing',
      ];
      const targetId = sectionIds[activeSectionIndex];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, [activeSectionIndex]);

  function handleLockStory() {
    clearSession();
    if (onLock) {
      onLock();
    } else {
      window.location.reload();
    }
  }

  return (
    <motion.div
      key="story-container"
      className="min-h-dvh bg-cream-200 text-stone-800 flex flex-col items-center px-4 py-12 sm:py-20 relative overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: 'easeInOut' }}
    >
      {/* Background delicate parchment noise & warm floral gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle 800px at 50% 20%, rgba(207,224,170,0.25) 0%, transparent 60%), radial-gradient(circle 600px at 80% 80%, rgba(232,180,184,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Floating Ambient Music Controller */}
      <AmbientAudioToggle />

      <motion.div
        className="relative z-10 w-full max-w-2xl flex flex-col gap-12 sm:gap-16 mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── 1. Story Hero Header ── */}
        <motion.header
          id="section-hero"
          variants={itemVariants}
          className="flex flex-col items-center gap-4 text-center pt-2 sm:pt-4 scroll-mt-8"
        >
          {/* Botanical Crest */}
          <div className="flex items-center gap-3" aria-hidden>
            <span className="text-2xl">🌿</span>
            <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-pistachio-600 font-semibold">
              An Interactive Keepsake
            </span>
            <span className="text-2xl">🌿</span>
          </div>

          <h1 className="font-script text-4xl sm:text-6xl text-pistachio-800 leading-tight">
            {storyTitle || 'Your Story Begins'}
          </h1>

          <p className="font-serif text-stone-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Welcome to your personal scrapbook. Every photograph, note, and memory here has been assembled with love.
          </p>

          <FloralDivider className="w-full max-w-sm mt-2 opacity-80" />
        </motion.header>

        {/* ── 2. Polaroid Scrapbook Gallery ── */}
        <motion.section
          id="section-polaroids"
          variants={itemVariants}
          className="flex flex-col items-center gap-6 scroll-mt-10"
        >
          <div className="text-center">
            <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-stone-400 font-medium">
              Treasured Moments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8 w-full max-w-lg mx-auto">
            {/* Polaroid 1: The Beginning */}
            {/* PLACEHOLDER: Pass imageUrl="/photos/day-one.jpg" when real photo is ready */}
            <PolaroidCard
              rotate={-2.5}
              tape="pistachio"
              tapePosition="top-left"
              caption="The Golden Hour"
              date="Day One"
            >
              <div className="w-full h-full bg-gradient-to-br from-pistachio-100 to-cream-300 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-2" aria-hidden>🌅</span>
                <span className="font-script text-stone-600 text-sm">Where our story quietly began</span>
                <span className="font-sans text-[10px] text-stone-400 mt-1 uppercase tracking-wider">[Photo Placeholder]</span>
              </div>
            </PolaroidCard>

            {/* Polaroid 2: Shared Valorant Memories */}
            {/* PLACEHOLDER: Pass imageUrl="/photos/valorant.jpg" or custom screenshot */}
            <PolaroidCard
              rotate={2}
              tape="blush"
              tapePosition="top-right"
              caption="Late Night Queues"
              date="Valorant Memories"
            >
              <div className="w-full h-full bg-gradient-to-br from-blush-100 to-cream-300 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-2" aria-hidden>🎮</span>
                <span className="font-script text-stone-600 text-sm">Overtime clutch &amp; laughing until 2 AM</span>
                <span className="font-sans text-[10px] text-stone-400 mt-1 uppercase tracking-wider">[Gaming Memory]</span>
              </div>
            </PolaroidCard>

            {/* Polaroid 3: Minecraft Memories & Inside Jokes */}
            {/* PLACEHOLDER: Pass imageUrl="/photos/minecraft.jpg" or custom screenshot */}
            <PolaroidCard
              rotate={1.5}
              tape="pistachio"
              tapePosition="top-right"
              caption="Our Little World"
              date="Minecraft &amp; Inside Jokes"
            >
              <div className="w-full h-full bg-gradient-to-br from-pistachio-100 to-cream-200 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-2" aria-hidden>🌱</span>
                <span className="font-script text-stone-600 text-sm">Little houses, lost torches &amp; shared moments</span>
                <span className="font-sans text-[10px] text-stone-400 mt-1 uppercase tracking-wider">[World Memory]</span>
              </div>
            </PolaroidCard>

            {/* Polaroid 4: Folded Whispers & Gratitude */}
            {/* PLACEHOLDER: Pass imageUrl="/photos/gratitude.jpg" */}
            <PolaroidCard
              rotate={-1.8}
              tape="blush"
              tapePosition="top-left"
              caption="Folded Whispers"
              date="Kept Forever"
            >
              <div className="w-full h-full bg-gradient-to-br from-cream-300 to-blush-100 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-2" aria-hidden>💌</span>
                <span className="font-script text-stone-600 text-sm">Grateful for every conversation</span>
                <span className="font-sans text-[10px] text-stone-400 mt-1 uppercase tracking-wider">[Gratitude Card]</span>
              </div>
            </PolaroidCard>
          </div>
        </motion.section>

        {/* ── 3. Narrative Letter Section ── */}
        <motion.section id="section-letter" variants={itemVariants} className="scroll-mt-10">
          <StoryLetterCard
            title="The Chapter We Write Together"
            date="A Story Dedicated to You"
            salutation="To the one reading this,"
            paragraphs={[
              'Before this website opened its doors to you, a quiet clock was ticking down the seconds. That pause was intentional — because the best stories should never be rushed into.',
              'Within these scrapbook frames and handwritten lines lies a space created just for your thoughts and our shared laughter. As new memories are made, new chapters will unfold here in real time.',
              'Take all the time you need. Breathe in the stillness, listen to the ambient music, and let every page speak to your heart.',
            ]}
            signature="Lovingly created,"
            waxSealInitials="M&L"
          />
        </motion.section>

        {/* ── 4. Interactive Chapters Roadmap ── */}
        <motion.section id="section-timeline" variants={itemVariants} className="pt-2 scroll-mt-10">
          <StoryTimelineCard />
        </motion.section>

        {/* ── 5. Story Closing / Selected Ending ── */}
        <motion.footer
          id="section-closing"
          variants={itemVariants}
          className="flex flex-col items-center gap-5 pt-8 pb-12 text-center scroll-mt-10"
        >
          <FloralDivider className="w-full max-w-sm opacity-60" />

          {/* Ending panel — rendered only when admin has selected an ending */}
          {selectedEnding === 'ending-a' && (
            <div className="w-full text-left">
              <EndingA />
            </div>
          )}
          {selectedEnding === 'ending-b' && (
            <div className="w-full text-left">
              <EndingB />
            </div>
          )}
          {selectedEnding === 'ending-c' && (
            <div className="w-full text-left">
              <EndingC />
            </div>
          )}

          {/* Default closing — shown when no ending is selected yet */}
          {!selectedEnding && (
            <>
              <WaxSeal initials="M&L" size={56} color="pistachio" />
              <p className="font-script text-2xl text-pistachio-800">
                made with all our love ♡
              </p>
              <p className="font-serif text-xs text-stone-500 max-w-xs leading-relaxed">
                Your progress is securely saved. You can return anytime on your phone or laptop.
              </p>
            </>
          )}

          {/* Visitor action buttons */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLockStory}
              className="text-[11px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-700 underline underline-offset-4 transition-colors"
            >
              🔒 Lock Story
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="text-[11px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-700 underline underline-offset-4 transition-colors"
              >
                🚪 Leave Story
              </button>
            )}
          </div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}
