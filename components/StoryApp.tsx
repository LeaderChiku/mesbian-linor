'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { useVisitorAudio } from '@/hooks/useVisitorAudio';
import { getTimeRemaining, type TimeRemaining } from '@/lib/schedule';
import { isVerified, markVerified, savePhase, clearSession, type StoryPhase } from '@/lib/session';

import OpeningScreen    from '@/components/opening/OpeningScreen';
import CountdownScreen  from '@/components/countdown/CountdownScreen';
import AccessCodeScreen from '@/components/access/AccessCodeScreen';
import WelcomeSection   from '@/components/story/WelcomeSection';
import GlassShatterTransition from '@/components/twist/GlassShatterTransition';
import RomanticExperience from '@/components/twist/RomanticExperience';

/**
 * Master Visitor Experience & Real-Time Orchestrator
 *
 * Sequence:
 *   1. loading   → Full-screen cinematic black opening
 *   2. countdown → Live scheduled countdown until agreed timestamp
 *   3. access    → 3-digit secret code entry screen (server-verified)
 *   4. story     → Personalized scrapbook story & chapters (real-time synchronized)
 *
 * Real-Time Features (Phase 2):
 *  - Schedule updates push live to visitor countdown without page refresh.
 *  - Remote section navigation from Admin laptop.
 *  - Remote audio and voice note playback with mobile gesture unlock.
 *  - Real-time Black Screen and Session Pause overlays.
 *  - Server-verified 3-digit passcode.
 */
export default function StoryApp() {
  const [phase, setPhase]               = useState<StoryPhase>('loading');
  const [openingDone, setOpeningDone]   = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // ── Real-time session synchronization (SSE stream + fallback) ──
  const { session, connectionStatus } = useRealtimeSession();

  // ── Remote Audio Engine ──
  const { needsGesture, unlockAudioOnGesture } = useVisitorAudio(session);

  // ── Live countdown calculation based on authoritative scheduledAt ──
  const [remaining, setRemaining] = useState<TimeRemaining>(() => {
    return session?.scheduledAt
      ? getTimeRemaining(session.scheduledAt)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  });

  useEffect(() => {
    if (!session?.scheduledAt) {
      setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      return;
    }

    const updateRemaining = () => {
      setRemaining(getTimeRemaining(session.scheduledAt!));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateRemaining();
      }
    };
    const handleFocus = () => {
      updateRemaining();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session?.scheduledAt]);

  const isSchedulePast = !session?.scheduledAt || remaining.total <= 0;

  // ── P4.8 Romantic Twist Live State & Glass Shatter Animation ──
  const [isShattering, setIsShattering] = useState(false);
  const [prevTwistActive, setPrevTwistActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.isTwistActive === undefined) return;
    if (prevTwistActive === null) {
      setPrevTwistActive(session.isTwistActive);
      return;
    }
    // Detect trigger transition from false -> true
    if (!prevTwistActive && session.isTwistActive) {
      setIsShattering(true);
    }
    setPrevTwistActive(session.isTwistActive);
  }, [session?.isTwistActive, prevTwistActive]);

  // ── P4.5 Black Screen Scroll-Lock & Touch-Lock ──
  useEffect(() => {
    if (session?.isBlackScreen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [session?.isBlackScreen]);

  // ── Keyboard shortcut to toggle dev preview toolbar (Ctrl + Shift + D) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowDevTools((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Check URL parameters for explicit state preview ─────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get('state');
      if (stateParam === 'countdown' || stateParam === 'access' || stateParam === 'story') {
        setPhase(stateParam);
        setOpeningDone(true);
      }
      if (params.get('dev') === 'true') {
        setShowDevTools(true);
      }
    }
  }, []);

  // ── Resolve phase after opening screen completes ────────────
  useEffect(() => {
    if (!openingDone) return;
    if (!session) return; // Wait for initial session snapshot

    // 1. Returning authenticated visitor → story
    if (isVerified()) {
      setPhase('story');
      savePhase('story');
      return;
    }

    // 2. Scheduled in future → countdown
    if (!isSchedulePast) {
      setPhase('countdown');
      savePhase('countdown');
      return;
    }

    // 3. Countdown reached zero or past → access code screen
    setPhase('access');
    savePhase('access');
  }, [openingDone, session, isSchedulePast]);

  // ── Real-time countdown arrival transition ──────────────────
  useEffect(() => {
    if (phase === 'countdown' && isSchedulePast) {
      const timer = setTimeout(() => {
        setPhase('access');
        savePhase('access');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [phase, isSchedulePast]);

  const handleOpeningComplete = useCallback(() => {
    setOpeningDone(true);
  }, []);

  const handleAccessSuccess = useCallback(() => {
    markVerified();
    setPhase('story');
    savePhase('story');
  }, []);

  const handleLockStory = useCallback(() => {
    clearSession();
    if (!isSchedulePast) {
      setPhase('countdown');
    } else {
      setPhase('access');
    }
  }, [isSchedulePast]);

  // ── Display labels ──────────────────────────────────────────
  const storyTitle  = session?.storyTitle || 'A Story for You';
  const scheduledAt = session?.scheduledAt || null;

  return (
    <main className="relative min-h-dvh bg-black">
      {/* ── Subtle Connection Status Indicator (top-right) ── */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm text-[10px] font-mono text-stone-300">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-emerald-400'
              : connectionStatus === 'syncing'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-blush-400'
          }`}
        />
        <span>{connectionStatus === 'connected' ? 'Live' : connectionStatus}</span>
      </div>

      {/* ── Audio Gesture Prompt (if mobile browser blocks autoplay) ── */}
      <AnimatePresence>
        {needsGesture && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-pistachio-900/90 border border-pistachio-500/80 text-cream-100 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between text-xs font-serif"
          >
            <span>🎵 Tap here to enable sound</span>
            <button
              onClick={unlockAudioOnGesture}
              className="px-3 py-1 bg-pistachio-400 text-stone-950 rounded-full font-sans text-[11px] font-semibold uppercase tracking-wider shadow"
            >
              Enable
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Live Black Screen Overlay (Controlled by Admin remotely) ── */}
      <AnimatePresence>
        {session?.isBlackScreen && (
          <motion.div
            key="remote-black-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[99999] bg-black flex items-center justify-center pointer-events-auto select-none touch-none w-screen h-screen"
            aria-modal="true"
            role="dialog"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── P4.8 Glass Shatter Transition ── */}
      <AnimatePresence>
        {isShattering && (
          <GlassShatterTransition
            key="glass-shatter-screen"
            onComplete={() => setIsShattering(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Session Paused Overlay (Controlled by Admin remotely) ── */}
      <AnimatePresence>
        {session?.sessionStatus === 'paused' && !session?.isBlackScreen && (
          <motion.div
            key="remote-paused-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-cream-100 select-none"
          >
            <div className="text-4xl mb-3" aria-hidden>🌿</div>
            <h2 className="font-script text-3xl sm:text-4xl text-cream-100 mb-2">
              Momentarily Paused
            </h2>
            <p className="font-serif text-xs sm:text-sm text-stone-400 max-w-xs leading-relaxed">
              Your story has been paused for a brief moment. Please stay on this screen — it will resume shortly.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session Ended Overlay (Controlled by Admin remotely) ── */}
      <AnimatePresence>
        {session?.sessionStatus === 'ended' && !session?.isBlackScreen && (
          <motion.div
            key="remote-ended-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-cream-100 select-none"
          >
            <div className="text-4xl mb-3" aria-hidden>💌</div>
            <h2 className="font-script text-3xl sm:text-4xl text-pistachio-300 mb-2">
              Until Next Time
            </h2>
            <p className="font-serif text-xs sm:text-sm text-stone-400 max-w-xs leading-relaxed mb-6">
              This storytelling session has ended. Thank you for sharing these quiet moments.
            </p>
            <button
              onClick={() => {
                clearSession();
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-sans text-xs uppercase tracking-wider transition-colors"
            >
              Restart Experience
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Sequential Screens (Inert when black screen is active) ── */}
      <div
        aria-hidden={Boolean(session?.isBlackScreen)}
        className={session?.isBlackScreen ? 'pointer-events-none select-none filter blur-sm' : ''}
      >
        <AnimatePresence mode="wait">
          {/* Phase 1: Opening Screen */}
          {phase === 'loading' && (
            <OpeningScreen key="phase-opening" onComplete={handleOpeningComplete} />
          )}

          {/* Phase 2: Scheduled Countdown Screen */}
          {phase === 'countdown' && !isSchedulePast && (
            <CountdownScreen
              key="phase-countdown"
              remaining={remaining}
              storyTitle={storyTitle}
              scheduledAt={scheduledAt}
            />
          )}

          {/* Phase 3: Access Code Verification Screen */}
          {phase === 'access' && (
            <AccessCodeScreen
              key="phase-access"
              storyTitle={storyTitle}
              onSuccess={handleAccessSuccess}
            />
          )}

          {/* Phase 4: Welcome Section & Scrapbook Story OR Romantic Twist Experience */}
          {phase === 'story' && session?.isTwistActive && !isShattering ? (
            <RomanticExperience
              key="phase-twist"
              cmsData={session?.cmsData}
              onLock={handleLockStory}
            />
          ) : phase === 'story' ? (
            <WelcomeSection
              key="phase-story"
              storyTitle={storyTitle}
              cmsData={session?.cmsData}
              activeSectionIndex={session?.currentSectionIndex ?? 0}
              selectedEnding={session?.selectedEnding ?? null}
              onLock={handleLockStory}
              onExit={handleLockStory}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Discreet Dev Preview Pill / Toolbar (Ctrl+Shift+D) ── */}
      <aside aria-label="Developer Preview Toolbar">
        <button
          onClick={() => setShowDevTools((prev) => !prev)}
          className="fixed bottom-2 left-2 z-40 text-[10px] tracking-wider uppercase bg-black/40 hover:bg-black/80 text-stone-400 hover:text-stone-200 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm transition-all"
        >
          {showDevTools ? '✕ Hide Tools' : '⚙ Dev Tools'}
        </button>

        {showDevTools && (
          <div className="fixed bottom-10 left-2 z-50 bg-stone-900/95 text-cream-100 p-3.5 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md flex flex-col gap-2 max-w-xs text-xs font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-semibold text-pistachio-300">Dev Controls</span>
              <span className="text-[10px] text-stone-400">Ctrl+Shift+D</span>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-stone-300">
              <div>Phase: <b className="text-cream-100">{phase}</b></div>
              <div>Section: <b className="text-pistachio-300">{session?.currentSectionIndex ?? 0 + 1} ({session?.currentSectionId})</b></div>
              <div>Status: <span className="text-cream-100">{session?.sessionStatus}</span></div>
              <a
                href="/admin"
                target="_blank"
                rel="noreferrer"
                className="mt-1 text-center py-1 rounded bg-pistachio-600/30 text-pistachio-300 border border-pistachio-500/40 text-[11px] font-medium"
              >
                ↗ Open /admin Panel
              </a>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => setPhase('countdown')}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left text-[11px]"
              >
                ⏳ Countdown
              </button>
              <button
                onClick={() => setPhase('access')}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left text-[11px]"
              >
                🔑 Passcode
              </button>
              <button
                onClick={() => { markVerified(); setPhase('story'); }}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left text-[11px]"
              >
                📖 Story
              </button>
              <button
                onClick={() => {
                  clearSession();
                  window.location.reload();
                }}
                className="px-2 py-1.5 rounded-lg bg-blush-400/20 text-blush-300 text-left text-[11px]"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}
