'use client';

import { motion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import PolaroidCard from '@/components/ui/PolaroidCard';
import StoryLetterCard from '@/components/story/StoryLetterCard';
import StoryTimelineCard from '@/components/story/StoryTimelineCard';
import AmbientAudioToggle from '@/components/ui/AmbientAudioToggle';
import WaxSeal from '@/components/ui/WaxSeal';
import { clearSession } from '@/lib/session';

interface WelcomeSectionProps {
  storyTitle: string;
  onLock?: () => void;
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
  onLock,
}: WelcomeSectionProps) {
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
          variants={itemVariants}
          className="flex flex-col items-center gap-4 text-center pt-2 sm:pt-4"
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
          variants={itemVariants}
          className="flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-stone-400 font-medium">
              Treasured Moments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8 w-full max-w-lg mx-auto">
            {/* Polaroid 1 */}
            <PolaroidCard
              rotate={-2.5}
              tape="pistachio"
              tapePosition="top-left"
              caption="The Golden Hour"
              date="Day One"
            >
              <div className="w-full h-full bg-gradient-to-br from-pistachio-100 to-cream-300 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl mb-2" aria-hidden>🌅</span>
                <span className="font-script text-stone-600 text-sm">Where light meets wonder</span>
              </div>
            </PolaroidCard>

            {/* Polaroid 2 */}
            <PolaroidCard
              rotate={2}
              tape="blush"
              tapePosition="top-right"
              caption="Folded Whispers"
              date="Kept Forever"
            >
              <div className="w-full h-full bg-gradient-to-br from-blush-100 to-cream-300 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-5xl mb-2" aria-hidden>💌</span>
                <span className="font-script text-stone-600 text-sm">Every letter carries your name</span>
              </div>
            </PolaroidCard>
          </div>
        </motion.section>

        {/* ── 3. Narrative Letter Section ── */}
        <motion.section variants={itemVariants}>
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
        <motion.section variants={itemVariants} className="pt-2">
          <StoryTimelineCard />
        </motion.section>

        {/* ── 5. Story Footer & Re-lock Action ── */}
        <motion.footer
          variants={itemVariants}
          className="flex flex-col items-center gap-5 pt-8 pb-12 text-center"
        >
          <FloralDivider className="w-full max-w-sm opacity-60" />

          <WaxSeal initials="M&L" size={56} color="pistachio" />

          <p className="font-script text-2xl text-pistachio-800">
            made with all our love ♡
          </p>

          <p className="font-serif text-xs text-stone-500 max-w-xs leading-relaxed">
            Your progress is securely saved. You can return anytime on your phone or laptop.
          </p>

          {/* Discreet Re-lock / Replay button for testing */}
          <button
            onClick={handleLockStory}
            className="mt-2 text-[11px] font-sans tracking-widest uppercase text-stone-400 hover:text-stone-700 underline underline-offset-4 transition-colors"
          >
            🔒 Lock Story & Test Passcode Again
          </button>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}
