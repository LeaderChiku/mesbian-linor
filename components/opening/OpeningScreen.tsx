'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Full-screen black opening screen.
 *
 * Requirements:
 * - Start with pure black background.
 * - Introduce elements through a gradual, cinematic fade-in.
 * - Minimal, elegant typography.
 * - Prevent flashing, hydration errors, and abrupt layout shifts.
 */
export default function OpeningScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Stagger mount so typography and layout stabilize
    const mountTimer = setTimeout(() => setMounted(true), 150);

    // Natural transition duration: 3.2s (or 0.6s if reduced motion preferred)
    const completeTimer = setTimeout(
      onComplete,
      shouldReduceMotion ? 800 : 3400
    );

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      <motion.div
        key="opening-screen"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Subtle ambient botanical glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 65% 50% at 50% 55%, rgba(143,175,107,0.08) 0%, rgba(232,180,184,0.04) 40%, transparent 75%)',
          }}
        />

        {/* Ambient star speckle particles */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-pistachio-200 rounded-full animate-pulse" />
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-blush-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-cream-100 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {mounted && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-7 px-8 text-center max-w-sm"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          >
            {/* Delicate Botanical Emblem */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
              aria-hidden
            >
              <OpeningFlower />
            </motion.div>

            {/* Title */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.3 }}
            >
              <h1 className="font-script text-4xl sm:text-5xl text-cream-100 tracking-wide leading-tight">
                A Story for You
              </h1>
              <p className="font-serif text-xs text-pistachio-300 tracking-[0.3em] uppercase opacity-75 mt-1">
                written in memories
              </p>
            </motion.div>

            {/* Subtle progress indicator */}
            <motion.div
              className="flex items-center gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              aria-label="Loading story"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-pistachio-300/80"
                  style={{
                    animation: shouldReduceMotion
                      ? 'none'
                      : `pulseDot 1.4s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        <style>{`
          @keyframes pulseDot {
            0%, 100% { opacity: 0.25; transform: scale(0.85); }
            50%      { opacity: 1;    transform: scale(1.15); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

function OpeningFlower() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="drop-shadow-sm">
      {/* Outer botanical petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <ellipse
          key={deg}
          cx="28"
          cy="28"
          rx="5.5"
          ry="12"
          fill="rgba(143,175,107,0.4)"
          transform={`rotate(${deg} 28 28)`}
        />
      ))}
      {/* Inner floral ring */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
        <ellipse
          key={deg}
          cx="28"
          cy="28"
          rx="3.5"
          ry="8"
          fill="rgba(207,224,170,0.45)"
          transform={`rotate(${deg} 28 28)`}
        />
      ))}
      {/* Soft center core */}
      <circle cx="28" cy="28" r="5" fill="rgba(232,180,184,0.7)" />
      <circle cx="28" cy="28" r="2.5" fill="#fdfcf9" />
    </svg>
  );
}
