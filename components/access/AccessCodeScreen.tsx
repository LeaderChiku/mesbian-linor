'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import FloralDivider from '@/components/ui/FloralDivider';
import { markVerified } from '@/lib/session';

interface AccessCodeScreenProps {
  /** Optional fallback code string */
  correctCode?: string;
  storyTitle:   string;
  onSuccess:    () => void;
}

export default function AccessCodeScreen({
  correctCode,
  storyTitle,
  onSuccess,
}: AccessCodeScreenProps) {
  const shouldReduceMotion      = useReducedMotion();
  const [digits, setDigits]     = useState<string[]>(['', '', '']);
  const [error, setError]       = useState<string | null>(null);
  const [shaking, setShaking]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on initial mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const enteredCode = digits.join('');
  const isComplete  = digits.every((d) => d.length === 1 && /\d/.test(d));

  const [isVerifying, setIsVerifying] = useState(false);

  const executeVerification = useCallback(async () => {
    if (!isComplete || isVerifying) return;
    setIsVerifying(true);

    try {
      // 1. Authoritative server-side verification with rate limiting
      const res = await fetch('/api/visitor/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: enteredCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setError(null);
        markVerified();
        setTimeout(onSuccess, 850);
        return;
      }

      // If server rejected code
      const errorMsg = data.error || "That code isn't quite right. Take a look and try again.";
      setError(errorMsg);
      setShaking(true);
      setTimeout(() => {
        setDigits(['', '', '']);
        setShaking(false);
        inputRefs.current[0]?.focus();
      }, 550);
    } catch {
      // Offline fallback: check against fallback code if provided
      if (correctCode && enteredCode === correctCode.trim()) {
        setSuccess(true);
        setError(null);
        markVerified();
        setTimeout(onSuccess, 850);
        return;
      }
      setError("Unable to verify code. Please check your connection.");
      setShaking(true);
      setTimeout(() => {
        setDigits(['', '', '']);
        setShaking(false);
        inputRefs.current[0]?.focus();
      }, 550);
    } finally {
      setIsVerifying(false);
    }
  }, [isComplete, isVerifying, enteredCode, correctCode, onSuccess]);

  // ── Auto-verify when all 3 digits are filled ────────────────
  useEffect(() => {
    if (isComplete && !success && !shaking) {
      const timer = setTimeout(() => {
        executeVerification();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isComplete, success, shaking, executeVerification]);

  function handleDigitChange(idx: number, rawVal: string) {
    const sanitized = rawVal.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = sanitized;
    setDigits(next);
    setError(null);

    // Auto-advance to next box if digit entered
    if (sanitized && idx < 2) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 3);
    if (!pasted) return;

    const chars = pasted.split('');
    const next = ['', '', ''];
    chars.forEach((c, i) => {
      if (i < 3) next[i] = c;
    });
    setDigits(next);
    setError(null);

    // Focus last filled box
    const targetIdx = Math.min(chars.length, 2);
    inputRefs.current[targetIdx]?.focus();
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    // Backspace: clear current or move to previous box
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
    }
    // Arrow Left / Right navigation
    if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && idx < 2) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Enter key submits if complete
    if (e.key === 'Enter' && isComplete) {
      executeVerification();
    }
  }

  return (
    <motion.div
      key="access-code-screen"
      className="min-h-dvh bg-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Background warm ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(232,180,184,0.08) 0%, rgba(143,175,107,0.04) 50%, transparent 80%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 sm:gap-9 w-full max-w-sm mx-auto">
        {/* Header with Envelope Motif */}
        <motion.div
          className="flex flex-col items-center gap-3 text-center px-4"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <EnvelopeWaxIcon />
          <h1 className="font-script text-3xl sm:text-4xl text-cream-100 leading-tight">
            {storyTitle || 'A Story for You'}
          </h1>
          <p className="font-serif text-xs sm:text-sm text-pistachio-300 opacity-80 tracking-wide">
            Enter your 3-digit secret code to unlock the story
          </p>
        </motion.div>

        <FloralDivider className="w-full opacity-45" />

        {/* 3-Digit Passcode Input */}
        <motion.div
          className="flex flex-col items-center gap-6 w-full"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 sm:gap-4"
            animate={shaking ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[0, 1, 2].map((idx) => {
              const hasVal = digits[idx].length > 0;
              return (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digits[idx]}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${idx + 1}`}
                  disabled={success}
                  className={`
                    w-16 h-20 sm:w-20 sm:h-24 text-center text-3xl sm:text-4xl font-display
                    rounded-2xl border-2 transition-all duration-200 outline-none
                    ${
                      success
                        ? 'border-pistachio-400 bg-pistachio-400/20 text-cream-100 shadow-[0_0_20px_rgba(143,175,107,0.4)]'
                        : shaking
                        ? 'border-blush-400 bg-blush-400/10 text-blush-300 shadow-[0_0_15px_rgba(232,180,184,0.3)]'
                        : hasVal
                        ? 'border-pistachio-400 bg-pistachio-400/10 text-cream-100'
                        : 'border-white/15 bg-white/[0.04] text-cream-100 hover:border-white/30 focus:border-pistachio-300 focus:bg-white/[0.08]'
                    }
                  `}
                />
              );
            })}
          </motion.div>

          {/* Friendly Error Notice */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="access-error"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blush-400/10 border border-blush-400/30 text-blush-300 text-xs sm:text-sm font-serif text-center"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                role="alert"
              >
                <span>🥀</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enter Button */}
          <motion.button
            onClick={executeVerification}
            disabled={!isComplete || success}
            whileHover={isComplete && !success ? { scale: 1.03 } : {}}
            whileTap={isComplete && !success ? { scale: 0.97 } : {}}
            className={`
              w-full max-w-[220px] py-3.5 rounded-full font-sans text-xs tracking-[0.25em] uppercase font-semibold
              transition-all duration-300 flex items-center justify-center gap-2
              ${
                success
                  ? 'bg-pistachio-400 text-stone-900 shadow-[0_0_25px_rgba(143,175,107,0.5)]'
                  : isComplete
                  ? 'bg-pistachio-400 text-stone-900 hover:bg-pistachio-300 cursor-pointer shadow-md'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
              }
            `}
          >
            {success ? (
              <>
                <span>✓</span>
                <span>Unlocked</span>
              </>
            ) : (
              <span>Unlock Story</span>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function EnvelopeWaxIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden className="drop-shadow-sm">
      {/* Outer Envelope body */}
      <rect x="4" y="14" width="44" height="30" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(232,180,184,0.4)" strokeWidth="1.5" />
      {/* Flap fold */}
      <path d="M4 14 L26 30 L48 14" stroke="rgba(232,180,184,0.45)" strokeWidth="1.5" fill="none" />
      {/* Wax Seal Emblem */}
      <circle cx="26" cy="38" r="7.5" fill="rgba(232,180,184,0.3)" stroke="rgba(232,180,184,0.6)" strokeWidth="1.5" />
      <text x="26" y="42" textAnchor="middle" fontSize="10" fill="rgba(232,180,184,0.9)" fontFamily="serif">❧</text>
    </svg>
  );
}
