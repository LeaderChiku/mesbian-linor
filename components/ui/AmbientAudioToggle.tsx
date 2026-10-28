'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  storageUrl: string;
}

/**
 * Persistent Visitor Ambient Audio Player
 *
 * Supports:
 * - Playing admin-uploaded MP3/audio tracks across chapters.
 * - Gentle synthesized chimes fallback if no tracks are uploaded.
 * - Volume control (0 - 100%).
 * - Responds to explicit visitor tap/click (respecting autoplay policies).
 * - Persists uninterrupted across chapter navigation.
 */
export default function AmbientAudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [showControls, setShowControls] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioElRef  = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);

  // Fetch uploaded audio tracks on mount
  useEffect(() => {
    fetch('/api/audio')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks);
        }
      })
      .catch(() => {
        // Fallback to chimes
      });
  }, []);

  const activeTrack = tracks.length > 0 ? tracks[currentTrackIndex % tracks.length] : null;

  // Sync volume to audio element
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = volume / 100;
    }
  }, [volume]);

  // ── Synthesized Chimes Fallback ──
  function playChimeTone(freq: number, duration: number, timeOffset: number) {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime + timeOffset;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const maxGain = (volume / 100) * 0.05;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(maxGain, now + 0.15);
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

      const scale = [329.63, 415.30, 493.88, 659.25, 830.61, 987.77];

      const playSequence = () => {
        const chord = [
          scale[Math.floor(Math.random() * scale.length)],
          scale[Math.floor(Math.random() * scale.length)],
          scale[Math.floor(Math.random() * scale.length)],
        ];

        chord.forEach((freq, idx) => {
          playChimeTone(freq, 2.8, idx * 0.4);
        });
      };

      playSequence();
      timerRef.current = setInterval(playSequence, 4200);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  function stopChimes() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.suspend();
    }
  }

  // ── Master Play / Stop Handler ──
  async function togglePlay() {
    if (isPlaying) {
      // Pause
      if (activeTrack && audioElRef.current) {
        audioElRef.current.pause();
      } else {
        stopChimes();
      }
      setIsPlaying(false);
    } else {
      // Play
      if (activeTrack && audioElRef.current) {
        try {
          audioElRef.current.volume = volume / 100;
          await audioElRef.current.play();
          setIsPlaying(true);
        } catch {
          // If browser restricts audio, fall back to chimes
          startChimes();
        }
      } else {
        startChimes();
      }
    }
  }

  function nextTrack() {
    if (tracks.length <= 1) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    if (isPlaying && audioElRef.current) {
      setTimeout(() => {
        audioElRef.current?.play().catch(() => {});
      }, 50);
    }
  }

  useEffect(() => {
    return () => {
      stopChimes();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {/* Hidden HTML5 Audio Element for uploaded MP3 files */}
      {activeTrack && (
        <audio
          ref={audioElRef}
          src={activeTrack.storageUrl}
          loop={tracks.length === 1}
          onEnded={nextTrack}
          onError={() => {
            // Fallback to synthesized chimes if uploaded URL has error
            if (isPlaying) startChimes();
          }}
        />
      )}

      {/* Expanded Controls Popover */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-xl backdrop-blur-md flex flex-col gap-2.5 w-56 text-stone-800"
          >
            <div className="flex items-center justify-between text-xs font-serif border-b border-stone-200/60 pb-2">
              <span className="font-semibold text-stone-700 truncate max-w-[140px]">
                {activeTrack ? activeTrack.title : 'Gentle Chimes'}
              </span>
              <button
                onClick={() => setShowControls(false)}
                className="text-stone-400 hover:text-stone-700 text-xs px-1"
                aria-label="Close sound settings"
              >
                ✕
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] text-stone-500 font-sans uppercase tracking-wider">
                <span>Volume</span>
                <span>{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-pistachio-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Next track button if multiple tracks */}
            {tracks.length > 1 && (
              <button
                onClick={nextTrack}
                className="text-[10px] font-sans uppercase tracking-wider text-pistachio-800 hover:text-pistachio-950 font-semibold flex items-center justify-center gap-1 py-1 rounded bg-pistachio-100/60 hover:bg-pistachio-100 transition-colors"
              >
                <span>Next Track</span>
                <span>⏭</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Toggle Button */}
      <div className="flex items-center gap-1.5">
        <motion.button
          onClick={togglePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
          className={`
            flex items-center gap-2.5 px-3.5 py-2
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
            {isPlaying ? (activeTrack ? activeTrack.title.slice(0, 16) : 'Sound On') : 'Music'}
          </span>
          {isPlaying && (
            <span className="flex gap-0.5 items-end h-3" aria-hidden>
              <span className="w-0.5 h-2 bg-pistachio-600 animate-pulse" />
              <span className="w-0.5 h-3 bg-pistachio-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-0.5 h-1.5 bg-pistachio-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </span>
          )}
        </motion.button>

        {/* Settings gear toggle */}
        <button
          onClick={() => setShowControls((prev) => !prev)}
          className="w-8 h-8 rounded-full bg-cream-100/90 border border-stone-300/50 text-stone-600 hover:text-stone-900 shadow-md backdrop-blur-md flex items-center justify-center text-xs transition-colors"
          title="Sound settings"
          aria-label="Sound settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
