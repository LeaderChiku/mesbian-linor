'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Ambient audio toggle.
 *
 * Uses gentle Web Audio synthesized chimes (E, G#, B, E, G# chords)
 * so it produces a tranquil, personal soundtrack without requiring
 * external mp3 downloads or heavy libraries.
 */
export default function AmbientAudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef               = useRef<AudioContext | null>(null);
  const timerRef                  = useRef<NodeJS.Timeout | null>(null);

  function stopAudio() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.suspend();
    }
    setIsPlaying(false);
  }

  function playTone(freq: number, duration: number, timeOffset: number) {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime + timeOffset;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Soft chime envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  function startChimes() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // Peaceful harp notes (E maj pentatonic)
      const scale = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77];

      const playSequence = () => {
        const chord = [
          scale[Math.floor(Math.random() * scale.length)],
          scale[Math.floor(Math.random() * scale.length)],
          scale[Math.floor(Math.random() * scale.length)],
        ];

        chord.forEach((freq, idx) => {
          playTone(freq, 2.8, idx * 0.4);
        });
      };

      playSequence();
      timerRef.current = setInterval(playSequence, 4200);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  function toggle() {
    if (isPlaying) {
      stopAudio();
    } else {
      startChimes();
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isPlaying ? 'Mute background music' : 'Play peaceful background melody'}
      className={`
        fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-3.5 py-2
        rounded-full shadow-lg border backdrop-blur-md transition-colors text-xs font-serif
        ${
          isPlaying
            ? 'bg-pistachio-100/90 border-pistachio-300 text-pistachio-900 shadow-pistachio-400/20'
            : 'bg-cream-100/90 border-stone-300/50 text-stone-600 hover:text-stone-900 shadow-stone-400/10'
        }
      `}
    >
      <span className="text-sm" aria-hidden>
        {isPlaying ? '🎵' : '🎼'}
      </span>
      <span className="font-sans text-[11px] uppercase tracking-wider font-medium">
        {isPlaying ? 'Sound On' : 'Music'}
      </span>
      {isPlaying && (
        <span className="flex gap-0.5 items-end h-3" aria-hidden>
          <span className="w-0.5 h-2 bg-pistachio-600 animate-pulse" />
          <span className="w-0.5 h-3 bg-pistachio-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="w-0.5 h-1.5 bg-pistachio-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
        </span>
      )}
    </motion.button>
  );
}
