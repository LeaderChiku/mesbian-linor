'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  STORY_SECTIONS,
  getSectionByIndex,
  type StorySection,
} from '@/lib/sections';
import { getTimeRemaining, formatScheduledDate, pad } from '@/lib/schedule';
import type { StorySessionState } from '@/lib/server-state';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [session, setSession]             = useState<StorySessionState | null>(null);
  const [visitorCode, setVisitorCode]     = useState<string>('739');
  const [loading, setLoading]             = useState(true);
  const [savingAction, setSavingAction]   = useState<string | null>(null);
  const [bannerNotice, setBannerNotice]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Admin Countdown Visibility Toggle (Default: OFF) ────────
  const [showAdminCountdown, setShowAdminCountdown] = useState(false);

  // ── Scheduling state (ISO local input) ──────────────────────
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // ── Visitor Code state ──────────────────────────────────────
  const [newCodeInput, setNewCodeInput] = useState<string>('');

  // ── Audio controls state ────────────────────────────────────
  const [selectedAudioId, setSelectedAudioId] = useState<string>('music-chimes');
  const [volumeLevel, setVolumeLevel]         = useState<number>(80);

  // ── Exit confirmation modal ─────────────────────────────────
  const [showExitModal, setShowExitModal] = useState(false);

  // ── Fetch authoritative Admin state ─────────────────────────
  const fetchAdminState = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/command', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSession(data.state);
        if (data.visitorCode) {
          setVisitorCode(data.visitorCode);
          setNewCodeInput(data.visitorCode);
        }
        if (data.state?.scheduledAt) {
          const d = new Date(data.state.scheduledAt);
          // Format for HTML date & time inputs
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setScheduledDate(`${yyyy}-${mm}-${dd}`);
          setScheduledTime(`${hh}:${min}`);
        }
        if (data.state?.audioVolume) {
          setVolumeLevel(data.state.audioVolume);
        }
        if (data.state?.selectedAudioId) {
          setSelectedAudioId(data.state.selectedAudioId);
        }
      } else if (res.status === 401) {
        onLogout();
      }
    } catch (err) {
      console.warn('Failed to fetch admin state:', err);
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  // ── Connect SSE for instantaneous Admin feedback ───────────
  useEffect(() => {
    fetchAdminState();

    const es = new EventSource('/api/session/stream');
    es.onmessage = (event) => {
      try {
        const data: StorySessionState = JSON.parse(event.data);
        setSession(data);
      } catch {
        // ping
      }
    };

    return () => {
      es.close();
    };
  }, [fetchAdminState]);

  // ── Execute Admin Command ───────────────────────────────────
  const executeCommand = async (action: Record<string, unknown>, label: string) => {
    setSavingAction(label);
    setBannerNotice(null);

    try {
      const res = await fetch('/api/admin/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSession(data.state);
        if (data.visitorCode) setVisitorCode(data.visitorCode);
        setBannerNotice({ type: 'success', text: `${label} applied successfully.` });
      } else {
        setBannerNotice({ type: 'error', text: data.error || `Failed to execute ${label}` });
      }
    } catch {
      setBannerNotice({ type: 'error', text: 'Network error executing command' });
    } finally {
      setSavingAction(null);
    }
  };

  // ── Schedule Save Handler ───────────────────────────────────
  const handleSaveSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      setBannerNotice({ type: 'error', text: 'Please select both a valid date and time.' });
      return;
    }
    const combined = new Date(`${scheduledDate}T${scheduledTime}:00`);
    if (isNaN(combined.getTime())) {
      setBannerNotice({ type: 'error', text: 'Invalid date/time combination.' });
      return;
    }
    executeCommand({ type: 'SET_SCHEDULE', scheduledAt: combined.toISOString() }, 'Schedule updated');
  };

  const handleClearSchedule = () => {
    setScheduledDate('');
    setScheduledTime('');
    executeCommand({ type: 'SET_SCHEDULE', scheduledAt: null }, 'Schedule cleared (immediate access)');
  };

  // ── Visitor Code Save Handler ───────────────────────────────
  const handleSaveVisitorCode = () => {
    const trimmed = newCodeInput.trim();
    if (!/^\d{3}$/.test(trimmed)) {
      setBannerNotice({ type: 'error', text: 'Visitor passcode must be exactly 3 numeric digits (e.g. 739).' });
      return;
    }
    executeCommand({ type: 'SET_VISITOR_CODE', code: trimmed }, 'Visitor code updated');
  };

  // ── Section Navigation Handlers ─────────────────────────────
  const currentSection: StorySection = useMemo(() => {
    return getSectionByIndex(session?.currentSectionIndex ?? 0);
  }, [session?.currentSectionIndex]);

  const canGoPrev = (session?.currentSectionIndex ?? 0) > 0;
  const canGoNext = (session?.currentSectionIndex ?? 0) < STORY_SECTIONS.length - 1;

  const handlePrevSection = () => {
    if (!canGoPrev) return;
    executeCommand({ type: 'NAVIGATE', sectionIndex: (session?.currentSectionIndex ?? 0) - 1 }, 'Previous Section');
  };

  const handleNextSection = () => {
    if (!canGoNext) return;
    executeCommand({ type: 'NAVIGATE', sectionIndex: (session?.currentSectionIndex ?? 0) + 1 }, 'Next Section');
  };

  const handleJumpToSection = (index: number) => {
    executeCommand({ type: 'NAVIGATE', sectionIndex: index }, `Navigate to Section ${index + 1}`);
  };

  // ── Audio Command Handlers ──────────────────────────────────
  const handleAudioAction = (command: 'play' | 'pause' | 'resume' | 'stop') => {
    const audioObj = currentSection.associatedAudios.find((a) => a.id === selectedAudioId);
    executeCommand(
      {
        type: 'AUDIO_CONTROL',
        command,
        audioId: selectedAudioId,
        volume: volumeLevel,
        audioType: audioObj?.type || 'music',
      },
      `Audio ${command.toUpperCase()}`
    );
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeLevel(newVol);
    executeCommand({ type: 'AUDIO_CONTROL', command: 'resume', volume: newVol }, 'Volume adjust');
  };

  // ── Live Admin Countdown Calculation (when toggle ON) ───────
  const adminCountdown = useMemo(() => {
    if (!showAdminCountdown || !session?.scheduledAt) return null;
    return getTimeRemaining(session.scheduledAt);
  }, [showAdminCountdown, session?.scheduledAt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex items-center justify-center font-sans text-sm">
        <span className="w-2 h-2 rounded-full bg-pistachio-400 animate-ping mr-3" />
        Connecting to session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-16 select-none">
      {/* ── Top Bar / Header ── */}
      <header className="sticky top-0 z-30 bg-stone-900/90 border-b border-stone-800 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-serif text-lg text-cream-100 font-medium tracking-tight">
            Story Admin Control Panel
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700/60 font-mono">
            Seq #{session?.commandSeq ?? 1}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400 mr-2">
            <span>Status:</span>
            <span className={`px-2 py-0.5 rounded-md font-medium uppercase tracking-wider text-[10px] ${
              session?.sessionStatus === 'active'
                ? 'bg-emerald-950 border border-emerald-700/60 text-emerald-300'
                : session?.sessionStatus === 'paused'
                ? 'bg-amber-950 border border-amber-700/60 text-amber-300'
                : 'bg-stone-800 border border-stone-700 text-stone-300'
            }`}>
              {session?.sessionStatus ?? 'scheduled'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
          >
            Lock / Logout
          </button>
        </div>
      </header>

      {/* ── Alert / Feedback Banner ── */}
      <AnimatePresence>
        {bannerNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-6 py-2.5 text-xs font-sans font-medium flex items-center justify-between border-b ${
              bannerNotice.type === 'success'
                ? 'bg-pistachio-950/70 border-pistachio-800/80 text-pistachio-200'
                : 'bg-blush-950/70 border-blush-800/80 text-blush-200'
            }`}
          >
            <span>{bannerNotice.text}</span>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Admin Grid Layout ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Column 1: Live Navigation & Status (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Section 1: Real-time Section Navigation */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
                  Section Navigation
                </span>
                <h2 className="font-serif text-xl text-cream-100">
                  Section {currentSection.index + 1} of {STORY_SECTIONS.length}: {currentSection.title}
                </h2>
              </div>

              <span className="text-xs text-stone-400 font-script text-base">
                {currentSection.chapterNumber}
              </span>
            </div>

            {/* Current Section Card Details */}
            <div className="bg-stone-950/70 rounded-xl p-4 border border-stone-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Subtitle</span>
                <span className="text-xs text-cream-200 italic font-serif">
                  &ldquo;{currentSection.subtitle}&rdquo;
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mt-1">
                {currentSection.summary}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrevSection}
                disabled={!canGoPrev || Boolean(savingAction)}
                className={`
                  py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
                  ${
                    canGoPrev && !savingAction
                      ? 'bg-stone-800 hover:bg-stone-700 text-cream-100 border-stone-700 cursor-pointer shadow-md'
                      : 'bg-stone-900/50 text-stone-600 border-stone-800 cursor-not-allowed'
                  }
                `}
              >
                <span>←</span>
                <span>Previous Section</span>
              </button>

              <button
                onClick={handleNextSection}
                disabled={!canGoNext || Boolean(savingAction)}
                className={`
                  py-3.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all
                  ${
                    canGoNext && !savingAction
                      ? 'bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 border-pistachio-500 cursor-pointer shadow-lg shadow-pistachio-950/50'
                      : 'bg-stone-900/50 text-stone-600 border-stone-800 cursor-not-allowed'
                  }
                `}
              >
                <span>Next Section</span>
                <span>→</span>
              </button>
            </div>

            {/* Jump-to Section Selector */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-800/60">
              <span className="text-xs text-stone-400 whitespace-nowrap">Jump to:</span>
              <select
                value={session?.currentSectionIndex ?? 0}
                onChange={(e) => handleJumpToSection(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-800 text-xs text-cream-200 rounded-lg px-3 py-2 outline-none focus:border-pistachio-500 cursor-pointer"
              >
                {STORY_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.index}>
                    {sec.index + 1}. {sec.chapterNumber} — {sec.title}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Section 2: Audio & Voice Note Controls */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
                  Audio & Voice Notes
                </span>
                <h3 className="font-serif text-lg text-cream-100">
                  Remote Sound Controller
                </h3>
              </div>

              {/* Live device audio report */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-400 text-[11px]">Device State:</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-pistachio-300 font-mono text-[10px] border border-stone-700">
                  {session?.audioState ?? 'ready'}
                </span>
              </div>
            </div>

            {/* Audio Track Selector for current section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-stone-400">Select Audio Track for Section</label>
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-xs text-cream-200 rounded-lg px-3 py-2.5 outline-none focus:border-pistachio-500 cursor-pointer"
              >
                <optgroup label="Associated with this Section">
                  {currentSection.associatedAudios.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type === 'voice_note' ? '🎙️ [Voice Note]' : '🎵 [Music]'} {a.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Remote Play / Pause / Resume Controls */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => handleAudioAction('play')}
                className="py-2.5 rounded-lg bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>▶</span>
                <span>Play</span>
              </button>

              <button
                onClick={() => handleAudioAction('pause')}
                className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-cream-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
              >
                <span>⏸</span>
                <span>Pause</span>
              </button>

              <button
                onClick={() => handleAudioAction('resume')}
                className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-cream-200 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
              >
                <span>↺</span>
                <span>Resume</span>
              </button>

              <button
                onClick={() => handleAudioAction('stop')}
                className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-blush-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
              >
                <span>⏹</span>
                <span>Stop</span>
              </button>
            </div>

            {/* Remote Volume Slider */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Remote Volume</span>
                <span className="font-mono text-pistachio-300">{volumeLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volumeLevel}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-pistachio-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
            </div>
          </section>

          {/* Section 3: Session State Controls */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
              Live Session Overrides
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pause / Resume Session */}
              <button
                onClick={() =>
                  executeCommand(
                    {
                      type: 'SET_SESSION_STATUS',
                      status: session?.sessionStatus === 'paused' ? 'active' : 'paused',
                    },
                    session?.sessionStatus === 'paused' ? 'Resume Session' : 'Pause Session'
                  )
                }
                className={`
                  p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider flex flex-col items-center gap-1 text-center transition-all
                  ${
                    session?.sessionStatus === 'paused'
                      ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                      : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
                  }
                `}
              >
                <span className="text-base">{session?.sessionStatus === 'paused' ? '▶' : '⏸'}</span>
                <span>{session?.sessionStatus === 'paused' ? 'Resume Session' : 'Pause Session'}</span>
              </button>

              {/* Black Screen Toggle */}
              <button
                onClick={() =>
                  executeCommand(
                    { type: 'SET_BLACK_SCREEN', enabled: !session?.isBlackScreen },
                    session?.isBlackScreen ? 'Disable Black Screen' : 'Enable Black Screen'
                  )
                }
                className={`
                  p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider flex flex-col items-center gap-1 text-center transition-all
                  ${
                    session?.isBlackScreen
                      ? 'bg-stone-950 border-purple-500 text-purple-300 shadow-inner'
                      : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200'
                  }
                `}
              >
                <span className="text-base">🌑</span>
                <span>{session?.isBlackScreen ? 'Screen: BLACK' : 'Black Screen'}</span>
              </button>

              {/* Exit Session (modal confirmation) */}
              <button
                onClick={() => setShowExitModal(true)}
                className="p-3 rounded-xl border border-blush-900/60 bg-blush-950/30 hover:bg-blush-950/60 text-blush-300 text-xs font-semibold uppercase tracking-wider flex flex-col items-center gap-1 text-center transition-all"
              >
                <span className="text-base">🚪</span>
                <span>End Session</span>
              </button>
            </div>
          </section>
        </div>

        {/* ── Column 2: Schedule & Passcode Settings (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Section 4: Schedule Management */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
                  Countdown Schedule
                </span>
                <h3 className="font-serif text-lg text-cream-100">
                  Agreed Session Time
                </h3>
              </div>
            </div>

            {/* Currently Configured Time Notice */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 flex flex-col gap-1">
              <span className="text-[11px] text-stone-400">Configured Visitor Time</span>
              <p className="text-xs text-cream-200 font-medium">
                {session?.scheduledAt
                  ? formatScheduledDate(session.scheduledAt)
                  : 'Immediate Access (No countdown configured)'}
              </p>
              {session?.scheduledAt && (
                <span className="text-[10px] text-stone-500 font-mono">
                  UTC: {new Date(session.scheduledAt).toUTCString()}
                </span>
              )}
            </div>

            {/* Date & Time Input Controls */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-stone-400">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-stone-950 border border-stone-800 text-xs text-cream-200 rounded-lg px-2.5 py-2 outline-none focus:border-pistachio-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-stone-400">Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-stone-950 border border-stone-800 text-xs text-cream-200 rounded-lg px-2.5 py-2 outline-none focus:border-pistachio-500"
                />
              </div>
            </div>

            <p className="text-[10px] text-stone-500 font-mono">
              Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>

            {/* Save / Clear Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveSchedule}
                disabled={Boolean(savingAction)}
                className="py-2.5 rounded-lg bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Save Schedule
              </button>

              <button
                onClick={handleClearSchedule}
                disabled={Boolean(savingAction)}
                className="py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-700 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* ── Admin Countdown Visibility Toggle (Default: OFF) ── */}
            <div className="pt-3 border-t border-stone-800/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-300">
                  Show countdown in admin panel
                </span>

                <button
                  type="button"
                  onClick={() => setShowAdminCountdown((prev) => !prev)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none
                    ${showAdminCountdown ? 'bg-pistachio-600' : 'bg-stone-800 border border-stone-700'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${showAdminCountdown ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Conditional Admin Countdown Display */}
              {showAdminCountdown && (
                <div className="bg-stone-950 rounded-xl p-3 border border-stone-800 flex items-center justify-center gap-3 text-center">
                  {adminCountdown && adminCountdown.total > 0 ? (
                    <>
                      {adminCountdown.days > 0 && (
                        <div>
                          <div className="text-lg font-mono text-cream-100">{pad(adminCountdown.days)}</div>
                          <div className="text-[9px] uppercase tracking-wider text-stone-500">Days</div>
                        </div>
                      )}
                      <div>
                        <div className="text-lg font-mono text-cream-100">{pad(adminCountdown.hours)}</div>
                        <div className="text-[9px] uppercase tracking-wider text-stone-500">Hours</div>
                      </div>
                      <span className="text-stone-600 mb-2">:</span>
                      <div>
                        <div className="text-lg font-mono text-cream-100">{pad(adminCountdown.minutes)}</div>
                        <div className="text-[9px] uppercase tracking-wider text-stone-500">Mins</div>
                      </div>
                      <span className="text-stone-600 mb-2">:</span>
                      <div>
                        <div className="text-lg font-mono text-cream-100">{pad(adminCountdown.seconds)}</div>
                        <div className="text-[9px] uppercase tracking-wider text-stone-500">Secs</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-pistachio-400 font-mono">
                      ✓ Scheduled time has arrived
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Visitor 3-Digit Passcode Management */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
              Visitor Access Code
            </span>

            <div className="flex items-center justify-between bg-stone-950/70 rounded-xl p-3 border border-stone-800/80">
              <span className="text-xs text-stone-400">Current Active Code:</span>
              <span className="font-mono text-base tracking-widest text-pistachio-300 font-bold">
                {visitorCode}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={3}
                pattern="[0-9]*"
                placeholder="New 3-digit code"
                value={newCodeInput}
                onChange={(e) => setNewCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full bg-stone-950 border border-stone-800 text-xs font-mono tracking-widest text-cream-200 rounded-lg px-3 py-2 outline-none focus:border-pistachio-500"
              />

              <button
                onClick={handleSaveVisitorCode}
                disabled={Boolean(savingAction) || newCodeInput.length !== 3}
                className={`
                  px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors
                  ${
                    newCodeInput.length === 3 && !savingAction
                      ? 'bg-pistachio-600 hover:bg-pistachio-500 text-stone-950 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                  }
                `}
              >
                Update Code
              </button>
            </div>

            <p className="text-[11px] text-stone-500">
              Code is verified securely server-side. Not leaked to visitor bundles.
            </p>
          </section>

          {/* Section 6: Ending Selection */}
          <section className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="pb-2 border-b border-stone-800">
              <span className="text-[11px] font-mono uppercase tracking-wider text-pistachio-400">
                Ending Selection
              </span>
              <h3 className="font-serif text-lg text-cream-100">Choose the Story Ending</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                You must explicitly choose an ending. None is ever selected automatically.
                Only select Ending C when she has clearly and voluntarily expressed comfort discussing a romantic conversation.
              </p>
            </div>

            {/* Current ending display */}
            <div className="bg-stone-950/70 rounded-xl p-3 border border-stone-800/80 flex items-center justify-between">
              <span className="text-xs text-stone-400">Currently selected:</span>
              <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
                session?.selectedEnding === 'ending-a'
                  ? 'bg-pistachio-950 text-pistachio-300 border border-pistachio-800'
                  : session?.selectedEnding === 'ending-b'
                  ? 'bg-stone-800 text-blush-300 border border-blush-900/60'
                  : session?.selectedEnding === 'ending-c'
                  ? 'bg-stone-800 text-amber-300 border border-amber-900/60'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}>
                {session?.selectedEnding === 'ending-a' && '✓ Ending A — Normal Goodbye'}
                {session?.selectedEnding === 'ending-b' && '✓ Ending B — Emotional Goodbye'}
                {session?.selectedEnding === 'ending-c' && '✓ Ending C — Romantic Conversation'}
                {!session?.selectedEnding && 'None — default closing shown'}
              </span>
            </div>

            {/* Ending A */}
            <button
              onClick={() => executeCommand({ type: 'SET_ENDING', ending: 'ending-a' }, 'Set Ending A')}
              disabled={Boolean(savingAction)}
              className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                session?.selectedEnding === 'ending-a'
                  ? 'bg-pistachio-950/80 border-pistachio-700 text-pistachio-200'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-200'
              }`}
            >
              <span className="text-lg mt-0.5">🌿</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Ending A — Normal Goodbye</span>
                <span className="text-[11px] text-stone-400 leading-relaxed">
                  Gentle conclusion. Warm appreciation, wishes her happiness. No expectations.
                </span>
              </div>
            </button>

            {/* Ending B */}
            <button
              onClick={() => executeCommand({ type: 'SET_ENDING', ending: 'ending-b' }, 'Set Ending B')}
              disabled={Boolean(savingAction)}
              className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                session?.selectedEnding === 'ending-b'
                  ? 'bg-blush-950/60 border-blush-800/80 text-blush-200'
                  : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-200'
              }`}
            >
              <span className="text-lg mt-0.5">🥀</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Ending B — Emotional Goodbye</span>
                <span className="text-[11px] text-stone-400 leading-relaxed">
                  Honest about feelings. Notes need for distance. She has done nothing wrong.
                </span>
              </div>
            </button>

            {/* Ending C — with mandatory consent warning */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-900/60">
                <span className="text-amber-400 text-xs mt-0.5">⚠</span>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  <strong>Consent required.</strong> Only select this ending if she has explicitly and voluntarily said she is comfortable discussing romantic feelings. Do not infer from reactions.
                </p>
              </div>
              <button
                onClick={() => executeCommand({ type: 'SET_ENDING', ending: 'ending-c' }, 'Set Ending C')}
                disabled={Boolean(savingAction)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  session?.selectedEnding === 'ending-c'
                    ? 'bg-amber-950/40 border-amber-700/80 text-amber-200'
                    : 'bg-stone-800/60 hover:bg-stone-800 border-stone-700 text-stone-200'
                }`}
              >
                <span className="text-lg mt-0.5">💌</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider">Ending C — Romantic Conversation</span>
                  <span className="text-[11px] text-stone-400 leading-relaxed">
                    Honest, respectful expression of feelings. Open invitation to talk. No pressure.
                  </span>
                </div>
              </button>
            </div>

            {/* Clear ending */}
            {session?.selectedEnding && (
              <button
                onClick={() => executeCommand({ type: 'SET_ENDING', ending: null }, 'Clear Ending')}
                disabled={Boolean(savingAction)}
                className="w-full py-2 rounded-lg bg-stone-800/40 hover:bg-stone-800 border border-stone-700/50 text-stone-400 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Clear — Show Default Closing
              </button>
            )}
          </section>
        </div>
      </main>

      {/* ── Confirmation Modal: End Session ── */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="text-3xl">⚠️</div>
              <h3 className="font-serif text-xl text-cream-100">
                End Story Session?
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                This will mark the current session as ended for the visitor. You can resume or restart anytime.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    executeCommand({ type: 'SET_SESSION_STATUS', status: 'ended' }, 'Session Ended');
                  }}
                  className="py-2.5 rounded-xl bg-blush-600 hover:bg-blush-500 text-stone-950 text-xs font-semibold uppercase tracking-wider shadow-md"
                >
                  Confirm Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
