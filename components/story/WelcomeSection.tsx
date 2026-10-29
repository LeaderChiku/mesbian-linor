'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AmbientAudioToggle from '@/components/ui/AmbientAudioToggle';
import StoryTimelineCard from '@/components/story/StoryTimelineCard';
import CategoryCollageModal from '@/components/story/collages/CategoryCollageModal';
import ChapterPrologue from '@/components/story/chapters/ChapterPrologue';
import ChapterOne from '@/components/story/chapters/ChapterOne';
import ChapterTwo from '@/components/story/chapters/ChapterTwo';
import ChapterThree from '@/components/story/chapters/ChapterThree';
import ChapterFour from '@/components/story/chapters/ChapterFour';
import LockedChapterGate from '@/components/story/chapters/LockedChapterGate';
import { clearSession } from '@/lib/session';
import { getCmsValue } from '@/lib/cms';
import { type CategorySlug } from '@/lib/photos';

interface WelcomeSectionProps {
  storyTitle: string;
  cmsData?: Record<string, string>;
  activeSectionIndex?: number;
  unlockedChapterIndex?: number;
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
  activeSectionIndex = 0,
  unlockedChapterIndex,
  selectedEnding,
  onLock,
  onExit,
}: WelcomeSectionProps) {
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);

  // Authoritative unlocked chapter boundary (0 = Prologue only, 1 = Ch 1, 2 = Ch 2, 3 = Ch 3, 4 = Ch 4)
  const unlockedIdx = typeof unlockedChapterIndex === 'number' ? unlockedChapterIndex : 0;

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const endingATitle = getCmsValue(cmsData, 'endingATitle');
  const endingAWish = getCmsValue(cmsData, 'endingAWish');
  const endingBTitle = getCmsValue(cmsData, 'endingBTitle');
  const endingBWish = getCmsValue(cmsData, 'endingBWish');
  const endingCTitle = getCmsValue(cmsData, 'endingCTitle');
  const endingCWish = getCmsValue(cmsData, 'endingCWish');

  const chaptersNav = [
    { id: 'section-hero', number: 'Prologue', isUnlocked: true },
    { id: 'section-polaroids', number: 'Ch I', isUnlocked: unlockedIdx >= 1 },
    { id: 'section-letter', number: 'Ch II', isUnlocked: unlockedIdx >= 2 },
    { id: 'section-timeline', number: 'Ch III', isUnlocked: unlockedIdx >= 3 },
    { id: 'section-closing', number: 'Ch IV', isUnlocked: unlockedIdx >= 4 },
  ];

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

        {/* Sticky Chapter Navigation Bar */}
        <nav
          aria-label="Story chapter progress"
          className="sticky top-4 z-40 mb-6 px-3 py-1.5 rounded-full bg-white/80 border border-stone-200/90 shadow-sm backdrop-blur-md flex items-center gap-1 sm:gap-2 text-[11px] font-sans"
        >
          {chaptersNav.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => ch.isUnlocked && scrollToSection(ch.id)}
              disabled={!ch.isUnlocked}
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                ch.isUnlocked
                  ? 'text-stone-700 hover:text-pistachio-800 hover:bg-pistachio-50 font-medium cursor-pointer'
                  : 'text-stone-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <span>{ch.isUnlocked ? '✓' : '🔒'}</span>
              <span>{ch.number}</span>
            </button>
          ))}
        </nav>

        <motion.div
          className="relative z-10 w-full max-w-2xl flex flex-col gap-12 sm:gap-16 mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── 1. Prologue: A Story for You (Always Unlocked) ── */}
          <motion.div id="section-hero" variants={itemVariants}>
            <ChapterPrologue
              dedication={heroDedication}
              title={heroHeading}
              welcomeText={heroWelcome}
            />
          </motion.div>

          {/* ── 2. Chapter I: Treasured Moments ── */}
          <motion.div id="section-polaroids" variants={itemVariants}>
            {unlockedIdx >= 1 ? (
              <ChapterOne
                onSelectCategory={setActiveCategory}
                goldenTitle={catGoldenTitle}
                goldenDesc={catGoldenDesc}
                lateTitle={catLateTitle}
                lateDesc={catLateDesc}
                worldTitle={catWorldTitle}
                worldDesc={catWorldDesc}
                foldedTitle={catFoldedTitle}
                foldedDesc={catFoldedDesc}
              />
            ) : (
              <LockedChapterGate
                chapterNumber="Chapter I"
                chapterTitle="Treasured Moments"
                chapterSubtitle="Golden light and captured whispers"
              />
            )}
          </motion.div>

          {/* ── 3. Chapter II: The Letter ── */}
          <motion.div id="section-letter" variants={itemVariants}>
            {unlockedIdx >= 2 ? (
              <ChapterTwo
                title={letterTitle}
                date={letterDate}
                salutation={letterSalutation}
                paragraphs={[letterP1, letterP2, letterP3]}
                signature={letterSignature}
              />
            ) : (
              <LockedChapterGate
                chapterNumber="Chapter II"
                chapterTitle="The Letter"
                chapterSubtitle="Words kept close to the chest"
              />
            )}
          </motion.div>

          {/* ── 4. Chapter III: The Journey Map ── */}
          <motion.div id="section-timeline" variants={itemVariants}>
            {unlockedIdx >= 3 ? (
              <ChapterThree />
            ) : (
              <LockedChapterGate
                chapterNumber="Chapter III"
                chapterTitle="The Journey Map"
                chapterSubtitle="How every step brought us here"
              />
            )}
          </motion.div>

          {/* ── 5. Chapter IV: A Promise for Tomorrow / Endings ── */}
          <motion.div id="section-closing" variants={itemVariants}>
            {unlockedIdx >= 4 ? (
              <ChapterFour
                selectedEnding={selectedEnding}
                endingATitle={endingATitle}
                endingAWish={endingAWish}
                endingBTitle={endingBTitle}
                endingBWish={endingBWish}
                endingCTitle={endingCTitle}
                endingCWish={endingCWish}
                onLock={handleLockStory}
                onExit={onExit}
              />
            ) : (
              <LockedChapterGate
                chapterNumber="Chapter IV"
                chapterTitle="A Promise for Tomorrow"
                chapterSubtitle="Until the next page is written"
              />
            )}
          </motion.div>

          {/* ── Interactive Chapters Roadmap & Ready to Begin ── */}
          <motion.section variants={itemVariants} className="pt-2">
            <StoryTimelineCard
              unlockedIndex={unlockedIdx}
              onSelectChapter={(idx) => {
                const sectionIds = [
                  'section-hero',
                  'section-polaroids',
                  'section-letter',
                  'section-timeline',
                  'section-closing',
                ];
                if (sectionIds[idx]) scrollToSection(sectionIds[idx]);
              }}
            />
          </motion.section>
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
