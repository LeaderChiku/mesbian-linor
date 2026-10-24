'use client';

import { useState, useEffect } from 'react';
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
import CategoryCollageModal from '@/components/story/collages/CategoryCollageModal';
import { clearSession } from '@/lib/session';
import { getCmsValue } from '@/lib/cms';
import { type CategorySlug } from '@/lib/photos';

interface WelcomeSectionProps {
  storyTitle: string;
  cmsData?: Record<string, string>;
  activeSectionIndex?: number;
  selectedEnding?: string | null;
  onLock?: () => void;
  onExit?: () => void;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function WelcomeSection({
  storyTitle,
  cmsData,
  activeSectionIndex,
  selectedEnding,
  onLock,
  onExit,
}: WelcomeSectionProps) {
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);

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

  // Retrieve CMS values with default fallbacks
  const heroDedication = getCmsValue(cmsData, 'heroDedication');
  const heroHeading = getCmsValue(cmsData, 'heroTitle') || storyTitle;
  const heroWelcome = getCmsValue(cmsData, 'heroWelcomeText');

  const letterTitle = getCmsValue(cmsData, 'letterTitle');
  const letterDate = getCmsValue(cmsData, 'letterDate');
  const letterSalutation = getCmsValue(cmsData, 'letterSalutation');
  const letterP1 = getCmsValue(cmsData, 'letterParagraph1');
  const letterP2 = getCmsValue(cmsData, 'letterParagraph2');
  const letterP3 = getCmsValue(cmsData, 'letterParagraph3');
  const letterSignature = getCmsValue(cmsData, 'letterSignature');

  const catGoldenTitle = getCmsValue(cmsData, 'catGoldenHourTitle');
  const catGoldenDesc = getCmsValue(cmsData, 'catGoldenHourDesc');
  const catLateTitle = getCmsValue(cmsData, 'catLateNightTitle');
  const catLateDesc = getCmsValue(cmsData, 'catLateNightDesc');
  const catWorldTitle = getCmsValue(cmsData, 'catOurWorldTitle');
  const catWorldDesc = getCmsValue(cmsData, 'catOurWorldDesc');
  const catFoldedTitle = getCmsValue(cmsData, 'catFoldedWhispersTitle');
  const catFoldedDesc = getCmsValue(cmsData, 'catFoldedWhispersDesc');

  return (
    <>
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
                {heroDedication}
              </span>
              <span className="text-2xl">🌿</span>
            </div>

            <h1 className="font-script text-4xl sm:text-6xl text-pistachio-800 leading-tight">
              {heroHeading}
            </h1>

            <p className="font-serif text-stone-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {heroWelcome}
            </p>

            <FloralDivider className="w-full max-w-sm mt-2 opacity-80" />
          </motion.header>

          {/* ── 2. Polaroid Scrapbook Gallery (Interactive Categories) ── */}
          <motion.section
            id="section-polaroids"
            variants={itemVariants}
            className="flex flex-col items-center gap-6 scroll-mt-10"
          >
            <div className="text-center flex flex-col items-center gap-1">
              <span className="font-sans text-[11px] tracking-[0.25em] uppercase text-stone-400 font-medium">
                Treasured Moments
              </span>
              <span className="text-xs font-serif text-pistachio-700 italic">
                (Tap any polaroid to open its photo album)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8 w-full max-w-lg mx-auto">
              {/* Category 1: The Golden Hour */}
              <div
                onClick={() => setActiveCategory('the-golden-hour')}
                className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveCategory('the-golden-hour')}
                aria-label="Open The Golden Hour photo album"
              >
                <PolaroidCard
                  rotate={-2.5}
                  tape="pistachio"
                  tapePosition="top-left"
                  caption={catGoldenTitle}
                  date="Day One"
                >
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 via-pistachio-50 to-cream-300 flex flex-col items-center justify-center p-6 text-center select-none">
                    <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>🌅</span>
                    <span className="font-script text-stone-700 text-base leading-snug">
                      {catGoldenDesc}
                    </span>
                    <span className="font-sans text-[10px] text-pistachio-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span>View Album</span>
                      <span>↗</span>
                    </span>
                  </div>
                </PolaroidCard>
              </div>

              {/* Category 2: Late Night Queues */}
              <div
                onClick={() => setActiveCategory('late-night-queues')}
                className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveCategory('late-night-queues')}
                aria-label="Open Late Night Queues photo album"
              >
                <PolaroidCard
                  rotate={2}
                  tape="blush"
                  tapePosition="top-right"
                  caption={catLateTitle}
                  date="Valorant Memories"
                >
                  <div className="w-full h-full bg-gradient-to-br from-rose-100 via-blush-50 to-cream-300 flex flex-col items-center justify-center p-6 text-center select-none">
                    <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>🎮</span>
                    <span className="font-script text-stone-700 text-base leading-snug">
                      {catLateDesc}
                    </span>
                    <span className="font-sans text-[10px] text-blush-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span>View Album</span>
                      <span>↗</span>
                    </span>
                  </div>
                </PolaroidCard>
              </div>

              {/* Category 3: Our Little World */}
              <div
                onClick={() => setActiveCategory('our-little-world')}
                className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveCategory('our-little-world')}
                aria-label="Open Our Little World photo album"
              >
                <PolaroidCard
                  rotate={1.5}
                  tape="pistachio"
                  tapePosition="top-right"
                  caption={catWorldTitle}
                  date="Minecraft & Inside Jokes"
                >
                  <div className="w-full h-full bg-gradient-to-br from-pistachio-100 via-cream-100 to-cream-200 flex flex-col items-center justify-center p-6 text-center select-none">
                    <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>🌱</span>
                    <span className="font-script text-stone-700 text-base leading-snug">
                      {catWorldDesc}
                    </span>
                    <span className="font-sans text-[10px] text-pistachio-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span>View Album</span>
                      <span>↗</span>
                    </span>
                  </div>
                </PolaroidCard>
              </div>

              {/* Category 4: Folded Whispers */}
              <div
                onClick={() => setActiveCategory('folded-whispers')}
                className="cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveCategory('folded-whispers')}
                aria-label="Open Folded Whispers photo album"
              >
                <PolaroidCard
                  rotate={-1.8}
                  tape="blush"
                  tapePosition="top-left"
                  caption={catFoldedTitle}
                  date="Kept Forever"
                >
                  <div className="w-full h-full bg-gradient-to-br from-cream-300 via-blush-50 to-stone-200 flex flex-col items-center justify-center p-6 text-center select-none">
                    <span className="text-4xl mb-2 drop-shadow-sm" aria-hidden>💌</span>
                    <span className="font-script text-stone-700 text-base leading-snug">
                      {catFoldedDesc}
                    </span>
                    <span className="font-sans text-[10px] text-blush-700 mt-2 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span>View Album</span>
                      <span>↗</span>
                    </span>
                  </div>
                </PolaroidCard>
              </div>
            </div>
          </motion.section>

          {/* ── 3. Narrative Letter Section (Customizable via CMS) ── */}
          <motion.section id="section-letter" variants={itemVariants} className="scroll-mt-10">
            <StoryLetterCard
              title={letterTitle}
              date={letterDate}
              salutation={letterSalutation}
              paragraphs={[letterP1, letterP2, letterP3]}
              signature={letterSignature}
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
                <EndingA
                  title={getCmsValue(cmsData, 'endingATitle')}
                  wish={getCmsValue(cmsData, 'endingAWish')}
                />
              </div>
            )}
            {selectedEnding === 'ending-b' && (
              <div className="w-full text-left">
                <EndingB
                  title={getCmsValue(cmsData, 'endingBTitle')}
                  wish={getCmsValue(cmsData, 'endingBWish')}
                />
              </div>
            )}
            {selectedEnding === 'ending-c' && (
              <div className="w-full text-left">
                <EndingC
                  title={getCmsValue(cmsData, 'endingCTitle')}
                  wish={getCmsValue(cmsData, 'endingCWish')}
                />
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

      {/* ── Category Photo Collage Modal ── */}
      {activeCategory && (
        <CategoryCollageModal
          categorySlug={activeCategory}
          onClose={() => setActiveCategory(null)}
        />
      )}
    </>
  );
}
