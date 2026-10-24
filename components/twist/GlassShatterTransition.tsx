'use client';

import { useEffect, useState } from 'react';
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
  scale: number;
  delay: number;
}

// Generate 18 jagged polygonal shards
function generateShards(): Shard[] {
  const shards: Shard[] = [];
  const cols = 5;
  const rows = 4;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const angle = (Math.random() * Math.PI * 2);
      const distance = 400 + Math.random() * 600;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rotate = (Math.random() - 0.5) * 720;
      const scale = 0.4 + Math.random() * 0.6;
      const delay = Math.random() * 0.15;

      // Random polygon clip paths for shards
      const p1 = `${Math.floor(Math.random() * 20)}% ${Math.floor(Math.random() * 20)}%`;
      const p2 = `${Math.floor(80 + Math.random() * 20)}% ${Math.floor(Math.random() * 30)}%`;
      const p3 = `${Math.floor(70 + Math.random() * 30)}% ${Math.floor(70 + Math.random() * 30)}%`;
      const p4 = `${Math.floor(Math.random() * 30)}% ${Math.floor(70 + Math.random() * 30)}%`;

      shards.push({
        id: idx,
        clipPath: `polygon(${p1}, ${p2}, ${p3}, ${p4})`,
        x,
        y,
        rotate,
        scale,
        delay,
      });
    }
  }

  return shards;
}

export default function GlassShatterTransition({
  onComplete,
}: GlassShatterTransitionProps) {
  const [shards] = useState<Shard[]>(() => generateShards());
  const [stage, setStage] = useState<'freeze' | 'crack' | 'shatter'>('freeze');

  useEffect(() => {
    // 1. Play synthetic glass crack sound via Web Audio API
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        // Burst of white noise with steep decay (glass snap)
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      }
    } catch {
      // Audio autoplay policy fallback
    }

    // Sequence stages
    const crackTimer = setTimeout(() => setStage('crack'), 80);
    const shatterTimer = setTimeout(() => setStage('shatter'), 320);
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearTimeout(crackTimer);
      clearTimeout(shatterTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden bg-black pointer-events-none select-none">
      {/* ── Cracking Lines Overlay ── */}
      {stage === 'crack' && (
        <svg
          className="absolute inset-0 w-full h-full stroke-white/80"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        >
          <line x1="50%" y1="50%" x2="10%" y2="20%" strokeWidth="3" />
          <line x1="50%" y1="50%" x2="85%" y2="15%" strokeWidth="2.5" />
          <line x1="50%" y1="50%" x2="90%" y2="80%" strokeWidth="3" />
          <line x1="50%" y1="50%" x2="20%" y2="85%" strokeWidth="2.5" />
          <line x1="50%" y1="50%" x2="50%" y2="5%" strokeWidth="2" />
          <line x1="50%" y1="50%" x2="5%" y2="55%" strokeWidth="2" />
          <circle cx="50%" cy="50%" r="40" fill="none" strokeWidth="2" strokeDasharray="6,4" />
        </svg>
      )}

      {/* ── Exploding Shards ── */}
      {stage === 'shatter' && (
        <div className="relative w-full h-full">
          {shards.map((shard) => (
            <motion.div
              key={shard.id}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={{
                x: shard.x,
                y: shard.y,
                rotate: shard.rotate,
                scale: shard.scale,
                opacity: 0,
              }}
              transition={{
                duration: 1.2,
                delay: shard.delay,
                ease: [0.25, 1, 0.5, 1],
              }}
              style={{
                clipPath: shard.clipPath,
              }}
              className="absolute inset-0 bg-gradient-to-br from-cream-100 via-stone-200 to-pistachio-200 border border-white/60 shadow-2xl backdrop-blur-sm"
            />
          ))}

          {/* Core White Flash */}
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white"
          />
        </div>
      )}
    </div>
  );
}
