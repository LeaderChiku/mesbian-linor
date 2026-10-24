'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSchedule }     from '@/hooks/useSchedule';
import { isVerified, markVerified, savePhase, clearSession, type StoryPhase } from '@/lib/session';

import OpeningScreen    from '@/components/opening/OpeningScreen';
import CountdownScreen  from '@/components/countdown/CountdownScreen';
import AccessCodeScreen from '@/components/access/AccessCodeScreen';
import WelcomeSection   from '@/components/story/WelcomeSection';

/**
 * Root state machine for the visitor experience.
 *
 * Sequence:
 *   1. loading   → Full-screen cinematic black opening
 *   2. countdown → Live scheduled countdown until agreed timestamp
 *   3. access    → 3-digit secret code entry screen
 *   4. story     → Personalized scrapbook story & chapters
 *
 * Features:
 *  - Handles page refreshes gracefully without resetting the countdown clock.
 *  - Automatically advances to access-code screen when countdown reaches 00:00:00.
 *  - Respects verified session state so returning visitors skip to story.
 *  - Discreet dev testing triggers for Phase 1 verification.
 */
export default function StoryApp() {
  const [phase, setPhase]             = useState<StoryPhase>('loading');
  const [openingDone, setOpeningDone] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const scheduleStatus                = useSchedule();

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

  // ── Resolve next phase once opening animation completes ─────
  useEffect(() => {
    if (!openingDone) return;
    if (scheduleStatus.status === 'loading') return;

    // 1. Returning authenticated visitor → jump directly to story
    if (isVerified()) {
      setPhase('story');
      savePhase('story');
      return;
    }

    // 2. Scheduled in future → countdown screen
    if (scheduleStatus.status === 'countdown') {
      setPhase('countdown');
      savePhase('countdown');
      return;
    }

    // 3. Countdown reached zero or past → access code screen
    if (scheduleStatus.status === 'ready') {
      setPhase('access');
      savePhase('access');
      return;
    }
  }, [openingDone, scheduleStatus.status]);

  // ── Advance from countdown → access code when clock hits zero ─
  useEffect(() => {
    if (phase === 'countdown' && scheduleStatus.status === 'ready') {
      // Smooth transition to access screen
      const timer = setTimeout(() => {
        setPhase('access');
        savePhase('access');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, scheduleStatus.status]);

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
    if (scheduleStatus.status === 'countdown') {
      setPhase('countdown');
    } else {
      setPhase('access');
    }
  }, [scheduleStatus.status]);

  // ── Derive display values ───────────────────────────────────
  const config =
    scheduleStatus.status === 'countdown' || scheduleStatus.status === 'ready'
      ? scheduleStatus.config
      : null;

  const storyTitle  = config?.story_title  || 'A Story for You';
  const accessCode  = config?.access_code  || '472';
  const scheduledAt = config?.scheduled_at || null;

  return (
    <main className="relative min-h-dvh bg-black">
      <AnimatePresence mode="wait">
        {/* Phase 1: Opening Screen */}
        {phase === 'loading' && (
          <OpeningScreen key="phase-opening" onComplete={handleOpeningComplete} />
        )}

        {/* Phase 2: Scheduled Countdown Screen */}
        {phase === 'countdown' && scheduleStatus.status === 'countdown' && (
          <CountdownScreen
            key="phase-countdown"
            remaining={scheduleStatus.remaining}
            storyTitle={storyTitle}
            scheduledAt={scheduledAt}
          />
        )}

        {/* Phase 3: Access Code Verification Screen */}
        {phase === 'access' && (
          <AccessCodeScreen
            key="phase-access"
            correctCode={accessCode}
            storyTitle={storyTitle}
            onSuccess={handleAccessSuccess}
          />
        )}

        {/* Phase 4: Welcome Section & Scrapbook Story */}
        {phase === 'story' && (
          <WelcomeSection
            key="phase-story"
            storyTitle={storyTitle}
            onLock={handleLockStory}
          />
        )}
      </AnimatePresence>

      {/* ── Discreet Dev Preview Pill / Toolbar (toggleable via Ctrl+Shift+D) ── */}
      <aside aria-label="Developer Preview Toolbar">
        <button
          onClick={() => setShowDevTools((prev) => !prev)}
          className="fixed bottom-2 left-2 z-50 text-[10px] tracking-wider uppercase bg-black/40 hover:bg-black/80 text-stone-400 hover:text-stone-200 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm transition-all"
        >
          {showDevTools ? '✕ Hide Tools' : '⚙ Phase 1 Tools'}
        </button>

        {showDevTools && (
          <div className="fixed bottom-10 left-2 z-50 bg-stone-900/95 text-cream-100 p-3.5 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md flex flex-col gap-2 max-w-xs text-xs font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="font-semibold text-pistachio-300">Phase 1 Preview Controls</span>
              <span className="text-[10px] text-stone-400">Ctrl+Shift+D</span>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-stone-300">
              <div>Phase: <b className="text-cream-100">{phase}</b></div>
              <div>Access Code: <b className="text-pistachio-300">{accessCode}</b></div>
              <div>Schedule: <span className="text-[10px] text-stone-400">{scheduledAt ? new Date(scheduledAt).toLocaleTimeString() : 'None'}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => { setPhase('countdown'); }}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left"
              >
                ⏳ Countdown
              </button>
              <button
                onClick={() => {
                  // Simulate 10-second countdown to test live reaching zero
                  const tenSec = new Date(Date.now() + 10000).toISOString();
                  localStorage.setItem('mbl_dev_config', JSON.stringify({
                    id: 'dev-10s',
                    scheduled_at: tenSec,
                    access_code: accessCode,
                    is_enabled: true,
                    story_title: storyTitle,
                  }));
                  window.dispatchEvent(new Event('mbl_config_updated'));
                  setPhase('countdown');
                }}
                className="px-2 py-1.5 rounded-lg bg-pistachio-400/20 hover:bg-pistachio-400/30 text-pistachio-200 text-left"
              >
                ⚡ 10s Countdown
              </button>
              <button
                onClick={() => { setPhase('access'); }}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left"
              >
                🔑 Passcode
              </button>
              <button
                onClick={() => { markVerified(); setPhase('story'); }}
                className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-left"
              >
                📖 Story
              </button>
            </div>

            <button
              onClick={() => {
                clearSession();
                localStorage.removeItem('mbl_dev_config');
                window.location.reload();
              }}
              className="mt-1 w-full py-1 text-center rounded-lg bg-blush-400/20 hover:bg-blush-400/30 text-blush-300 text-[10px] uppercase tracking-wider"
            >
              Reset Session
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}
