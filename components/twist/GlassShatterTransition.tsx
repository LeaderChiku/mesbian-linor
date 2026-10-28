'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface GlassShatterTransitionProps {
  onComplete: () => void;
}

interface Shard {
  id: number;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  delay: number;
  hue: number;
}

function generateShards(count = 20): Shard[] {
  const shards: Shard[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 300 + Math.random() * 500;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const rotate = (Math.random() - 0.5) * 540;

    // Jagged polygonal fragments
    const pts: string[] = [];
    const numPts = 5 + Math.floor(Math.random() * 3);
    for (let p = 0; p < numPts; p++) {
      const a = (p / numPts) * 360 + (Math.random() - 0.5) * 40;
      const r = 0.3 + Math.random() * 0.7;
      const cx = 50 + Math.cos((a * Math.PI) / 180) * r * 50;
      const cy = 50 + Math.sin((a * Math.PI) / 180) * r * 50;
      pts.push(`${cx.toFixed(1)}% ${cy.toFixed(1)}%`);
    }

    shards.push({
      id: i,
      clipPath: `polygon(${pts.join(', ')})`,
      x,
      y,
      rotate,
      opacity: 0.75 + Math.random() * 0.25,
      delay: Math.random() * 0.08,
      hue: Math.random() * 30 - 15,
    });
  }
  return shards;
}

export default function GlassShatterTransition({ onComplete }: GlassShatterTransitionProps) {
  const [shards] = useState<Shard[]>(() => generateShards(20));
  const [stage, setStage] = useState<'freeze' | 'crack' | 'shatter'>('freeze');
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const complete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      complete();
      return;
    }

    // Play synthetic glass crack sound
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const bufferSize = Math.floor(ctx.sampleRate * 0.25);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      }
    } catch {
      // Audio autoplay policy fallback
    }

    const t1 = setTimeout(() => setStage('crack'), 60);
    const t2 = setTimeout(() => setStage('shatter'), 200);
    const t3 = setTimeout(() => complete(), 1050);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100000] overflow-hidden pointer-events-none select-none"
      role="presentation"
      aria-hidden="true"
    >
      {/* Black base backdrop */}
      <div className="absolute inset-0 bg-black" />

      {/* Crack lines with realistic luminous fracture glow */}
      {stage === 'crack' && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'drop-shadow(0 0 6px rgba(220,240,255,0.9))' }}
        >
          <line x1="50%" y1="50%" x2="8%" y2="12%" stroke="rgba(220,240,255,0.9)" strokeWidth="2.5" />
          <line x1="50%" y1="50%" x2="88%" y2="10%" stroke="rgba(220,240,255,0.85)" strokeWidth="2" />
          <line x1="50%" y1="50%" x2="95%" y2="78%" stroke="rgba(220,240,255,0.9)" strokeWidth="2.5" />
          <line x1="50%" y1="50%" x2="15%" y2="88%" stroke="rgba(220,240,255,0.75)" strokeWidth="2" />
          <line x1="50%" y1="50%" x2="50%" y2="2%" stroke="rgba(220,240,255,0.8)" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="2%" y2="50%" stroke="rgba(220,240,255,0.75)" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="70%" y2="40%" stroke="rgba(220,240,255,0.6)" strokeWidth="1" />
          <line x1="50%" y1="50%" x2="30%" y2="60%" stroke="rgba(220,240,255,0.6)" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="30" fill="none" stroke="rgba(220,240,255,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
        </svg>
      )}

      {/* Exploding glass shards with specular gradient reflection */}
      {stage === 'shatter' && (
        <div className="relative w-full h-full">
          {shards.map((shard) => (
            <motion.div
              key={shard.id}
              initial={{ x: 0, y: 0, rotate: 0, opacity: shard.opacity }}
              animate={{
                x: shard.x,
                y: shard.y,
                rotate: shard.rotate,
                opacity: 0,
              }}
              transition={{
                duration: 0.8,
                delay: shard.delay,
                ease: [0.2, 0.8, 0.4, 1],
              }}
              style={{
                clipPath: shard.clipPath,
                filter: `hue-rotate(${shard.hue}deg) brightness(1.35)`,
              }}
              className="absolute inset-0 bg-gradient-to-br from-white/90 via-sky-100/60 to-rose-100/40 border border-white/70 shadow-2xl backdrop-blur-sm"
            />
          ))}

          {/* Quick specular flash */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white"
          />
        </div>
      )}
    </div>
  );
}
