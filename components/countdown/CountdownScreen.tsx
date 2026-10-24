'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { pad, formatScheduledDate, type TimeRemaining } from '@/lib/schedule';
import FloralDivider from '@/components/ui/FloralDivider';

interface CountdownScreenProps {
  remaining:    TimeRemaining;
  storyTitle:   string;
  scheduledAt?: string | null;
  onZeroReached?: () => void;
}

export default function CountdownScreen({
  remaining,
  storyTitle,
  scheduledAt,
}: CountdownScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const showDays = remaining.days > 0;
  const isZero   = remaining.total <= 0;

  const units = showDays
    ? [
        { label: 'days',    value: remaining.days    },
        { label: 'hours',   value: remaining.hours   },
        { label: 'minutes', value: remaining.minutes },
        { label: 'seconds', value: remaining.seconds },
      ]
    : [
        { label: 'hours',   value: remaining.hours   },
        { label: 'minutes', value: remaining.minutes },
        { label: 'seconds', value: remaining.seconds },
      ];

  const formattedDate = scheduledAt ? formatScheduledDate(scheduledAt) : '';

  return (
    <motion.div
      key="countdown-screen"
      className="min-h-dvh bg-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Background ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(143,175,107,0.08) 0%, rgba(232,180,184,0.04) 50%, transparent 80%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 sm:gap-9 w-full max-w-lg mx-auto">
        {/* Header Title & Botanical Motif */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center px-4"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <CountdownFlower />
          <h1 className="font-script text-3xl sm:text-5xl text-cream-100 tracking-wide leading-tight">
            {storyTitle || 'A Story for You'}
          </h1>
          <p className="font-serif text-pistachio-300 text-xs sm:text-sm tracking-[0.25em] uppercase opacity-75">
            {isZero ? 'the moment has arrived' : 'counting down until we begin'}
          </p>
        </motion.div>

        <FloralDivider className="w-full max-w-xs opacity-50" />

        {/* Countdown Digits */}
        <motion.div
          className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-2"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          {units.map((unit, idx) => (
            <div key={unit.label} className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <DigitCard label={unit.label} value={unit.value} />
              {idx < units.length - 1 && (
                <span className="text-pistachio-400/50 text-2xl sm:text-4xl font-light mb-5 select-none">
                  :
                </span>
              )}
            </div>
          ))}
        </motion.div>

        {/* Scheduled date notice */}
        {formattedDate && !isZero && (
          <motion.div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            <span className="text-xs" aria-hidden>🗓️</span>
            <span className="font-serif text-cream-200/90 text-xs sm:text-sm">
              {formattedDate}
            </span>
          </motion.div>
        )}

        <FloralDivider className="w-full max-w-xs opacity-50" />

        {/* Poetic Teaser */}
        <motion.p
          className="font-serif text-cream-300 text-center text-xs sm:text-sm leading-relaxed opacity-70 max-w-xs sm:max-w-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {isZero
            ? 'The scheduled moment has come. Unlocking your access...'
            : 'Every second brings us closer to a story crafted just for you. Keep this page open or return at the scheduled hour.'}
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ── Individual Countdown Unit Card ───────────────────────── */

function DigitCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
        <motion.span
          key={value}
          className="font-display text-3xl sm:text-5xl md:text-6xl text-cream-100 tabular-nums font-normal"
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1,   y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {pad(value)}
        </motion.span>
      </div>
      <span className="font-sans text-[10px] sm:text-xs tracking-[0.2em] text-pistachio-300/80 uppercase mt-2 font-medium">
        {label}
      </span>
    </div>
  );
}

function CountdownFlower() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="drop-shadow-sm">
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="22"
          cy="22"
          rx="4.5"
          ry="10"
          fill="rgba(143,175,107,0.35)"
          transform={`rotate(${deg} 22 22)`}
        />
      ))}
      <circle cx="22" cy="22" r="4.5" fill="rgba(232,180,184,0.6)" />
      <circle cx="22" cy="22" r="2" fill="#fdfcf9" />
    </svg>
  );
}
