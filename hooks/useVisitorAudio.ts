'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioById } from '@/lib/sections';
import type { StorySessionState } from '@/lib/server-state';

/**
 * Visitor Remote Audio Engine
 *
 * - Executes playback commands broadcast by the admin laptop.
 * - Tracks `commandSeq` to prevent duplicate or out-of-order execution.
 * - Respects mobile browser autoplay policies with a user gesture prompt.
 * - Provides audio ducking: lowers background music volume when voice notes play.
 * - Reports actual playback status back to the server.
 */
export function useVisitorAudio(session: StorySessionState | null) {
  const [needsGesture, setNeedsGesture] = useState(false);
  const [actualPlaybackState, setActualPlaybackState] = useState<'playing' | 'paused' | 'stopped' | 'ducked' | 'ready'>('ready');

  const audioCtxRef          = useRef<AudioContext | null>(null);
  const musicGainRef         = useRef<GainNode | null>(null);
  const voiceGainRef         = useRef<GainNode | null>(null);
  const musicTimerRef        = useRef<NodeJS.Timeout | null>(null);
  const voiceTimerRef        = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedSeqRef   = useRef<number>(0);
  const isDuckedRef          = useRef(false);
  const isPlayingRef         = useRef(false);

  // ── Report playback state to server ─────────────────────────
  const reportState = useCallback(async (state: 'playing' | 'paused' | 'stopped' | 'ducked' | 'ready') => {
    setActualPlaybackState(state);
    try {
      await fetch('/api/session/audio-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
    } catch {
      // ignore reporting errors
    }
  }, []);

  // ── Initialize or resume AudioContext ───────────────────────
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Master Gains
      const musicGain = ctx.createGain();
      const voiceGain = ctx.createGain();
      musicGain.connect(ctx.destination);
      voiceGain.connect(ctx.destination);
      musicGainRef.current = musicGain;
      voiceGainRef.current = voiceGain;
    }

    if (audioCtxRef.current.state === 'suspended') {
      return audioCtxRef.current
        .resume()
        .then(() => {
          setNeedsGesture(false);
          return true;
        })
        .catch(() => {
          setNeedsGesture(true);
          return false;
        });
    }

    setNeedsGesture(false);
    return Promise.resolve(true);
  }, []);

  // ── Synthesized Chime Tone (Zero external asset dependencies) ──
  const playTone = useCallback((freq: number, duration: number, gainNode: GainNode, maxGain = 0.05) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    noteGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(maxGain, ctx.currentTime + 0.1);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNode);

    osc.start();
    osc.stop(ctx.currentTime + duration + 0.1);
  }, []);

  // ── Play Music Loop ─────────────────────────────────────────
  const startMusic = useCallback((freqs = [329.63, 415.30, 493.88, 659.25]) => {
    if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    if (!musicGainRef.current) return;

    isPlayingRef.current = true;
    const gainNode = musicGainRef.current;

    const loop = () => {
      const chosen = [
        freqs[Math.floor(Math.random() * freqs.length)],
        freqs[Math.floor(Math.random() * freqs.length)],
      ];
      chosen.forEach((f, idx) => {
        setTimeout(() => {
          playTone(f, 3.2, gainNode, 0.04);
        }, idx * 450);
      });
    };

    loop();
    musicTimerRef.current = setInterval(loop, 4000);
    reportState(isDuckedRef.current ? 'ducked' : 'playing');
  }, [playTone, reportState]);

  // ── Play Voice Note with Ducking ────────────────────────────
  const startVoiceNote = useCallback((freqs = [220.00, 277.18]) => {
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    if (!musicGainRef.current || !voiceGainRef.current || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    // Duck music substantially (down to 15%)
    isDuckedRef.current = true;
    musicGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
    musicGainRef.current.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
    reportState('ducked');

    // Play voice note tones
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        playTone(f, 3.5, voiceGainRef.current!, 0.08);
      }, idx * 800);
    });

    // Restore music volume after voice note finishes (after ~4s)
    voiceTimerRef.current = setTimeout(() => {
      isDuckedRef.current = false;
      if (musicGainRef.current && audioCtxRef.current) {
        musicGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
        musicGainRef.current.gain.linearRampToValueAtTime(1.0, audioCtxRef.current.currentTime + 1.2);
      }
      reportState(isPlayingRef.current ? 'playing' : 'ready');
    }, 4500);
  }, [playTone, reportState]);

  // ── Stop / Pause ────────────────────────────────────────────
  const pauseAudio = useCallback(() => {
    isPlayingRef.current = false;
    if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
    reportState('paused');
  }, [reportState]);

  // ── User Gesture Unlock Handler (Mobile phone tap) ───────────
  const unlockAudioOnGesture = useCallback(() => {
    ensureAudioContext()?.then((unlocked) => {
      if (unlocked && session?.audioCommand === 'play') {
        const audioAsset = getAudioById(session.selectedAudioId || '');
        if (session.audioType === 'voice_note') {
          startVoiceNote(audioAsset?.synthesizedFrequency);
        } else {
          startMusic(audioAsset?.synthesizedFrequency);
        }
      }
    });
  }, [ensureAudioContext, session?.audioCommand, session?.selectedAudioId, session?.audioType, startMusic, startVoiceNote]);

  // ── Synchronize with remote Admin commands ──────────────────
  useEffect(() => {
    if (!session) return;

    // Check if command sequence is newer than last executed
    if (session.commandSeq <= lastExecutedSeqRef.current) {
      return;
    }
    lastExecutedSeqRef.current = session.commandSeq;

    // Apply volume level (0 to 100)
    if (musicGainRef.current && audioCtxRef.current) {
      const vol = (session.audioVolume ?? 80) / 100;
      musicGainRef.current.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    }

    if (session.audioCommand === 'play' || session.audioCommand === 'resume') {
      const ready = ensureAudioContext();
      if (ready instanceof Promise) {
        ready.then((unlocked) => {
          if (!unlocked) return; // Prompt will be visible
          const audioAsset = getAudioById(session.selectedAudioId || '');
          if (session.audioType === 'voice_note') {
            startVoiceNote(audioAsset?.synthesizedFrequency);
          } else {
            startMusic(audioAsset?.synthesizedFrequency);
          }
        });
      }
    } else if (session.audioCommand === 'pause' || session.audioCommand === 'stop') {
      pauseAudio();
    }
  }, [session, ensureAudioContext, startMusic, startVoiceNote, pauseAudio]);

  return {
    needsGesture,
    actualPlaybackState,
    unlockAudioOnGesture,
  };
}
