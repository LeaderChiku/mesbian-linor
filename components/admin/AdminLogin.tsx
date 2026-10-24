'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [lockedSec, setLockedSec] = useState<number | null>(null);
  const inputRefs                 = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedSec || lockedSec <= 0) return;
    const interval = setInterval(() => {
      setLockedSec((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedSec]);

  const isComplete = pinDigits.every((d) => d.length === 1 && /\d/.test(d));
  const enteredPin = pinDigits.join('');

  async function handleVerify(pinToVerify = enteredPin) {
    if (loading || lockedSec) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onAuthenticated();
      } else {
        setError(data.error || 'Authentication failed');
        setPinDigits(['', '', '', '']);
        inputRefs.current[0]?.focus();
        if (res.status === 429 && data.retryAfterSec) {
          setLockedSec(data.retryAfterSec);
        }
      }
    } catch {
      setError('Unable to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(idx: number, rawVal: string) {
    const val = rawVal.replace(/\D/g, '').slice(-1);
    const next = [...pinDigits];
    next[idx] = val;
    setPinDigits(next);
    setError(null);

    if (val && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Auto-submit on 4th digit
    if (val && idx === 3 && next.every(Boolean)) {
      handleVerify(next.join(''));
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      const next = [...pinDigits];
      next[idx - 1] = '';
      setPinDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter' && isComplete) {
      handleVerify();
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 select-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6"
      >
        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-pistachio-950/60 border border-pistachio-700/40 flex items-center justify-center text-2xl text-pistachio-400">
          🛡️
        </div>

        <div className="text-center">
          <h1 className="font-serif text-2xl text-cream-100 tracking-tight">
            Administrator Access
          </h1>
          <p className="font-sans text-xs text-stone-400 mt-1">
            Enter your 4-digit PIN to access session controls
          </p>
        </div>

        {/* 4-Digit Input Boxes */}
        <div className="flex gap-3 justify-center">
          {[0, 1, 2, 3].map((idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              disabled={loading || Boolean(lockedSec)}
              value={pinDigits[idx]}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`
                w-12 h-16 text-center text-2xl font-mono rounded-xl border-2
                outline-none transition-all
                ${
                  pinDigits[idx]
                    ? 'border-pistachio-400 bg-pistachio-950/30 text-pistachio-300'
                    : 'border-stone-700 bg-stone-800/60 text-cream-100 focus:border-pistachio-400'
                }
                ${lockedSec ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            />
          ))}
        </div>

        {/* Error / Lockout notice */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-blush-400 font-sans text-center bg-blush-950/30 border border-blush-800/50 px-3 py-2 rounded-lg w-full"
            >
              {error}
            </motion.div>
          )}
          {lockedSec && (
            <div className="text-xs text-stone-400 font-sans text-center">
              Locked out. Retry in <b className="text-stone-200">{lockedSec}s</b>.
            </div>
          )}
        </AnimatePresence>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={!isComplete || loading || Boolean(lockedSec)}
          className={`
            w-full py-3 rounded-xl font-sans text-xs font-semibold tracking-wider uppercase transition-all
            ${
              isComplete && !loading && !lockedSec
                ? 'bg-pistachio-500 hover:bg-pistachio-400 text-stone-950 cursor-pointer shadow-lg shadow-pistachio-900/30'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
            }
          `}
        >
          {loading ? 'Verifying...' : 'Unlock Controls'}
        </button>

        <p className="font-sans text-[11px] text-stone-500 text-center">
          Authentication is verified server-side with rate limiting.
        </p>
      </motion.div>
    </div>
  );
}
