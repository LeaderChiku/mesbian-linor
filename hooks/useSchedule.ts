'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTimeRemaining, type TimeRemaining } from '@/lib/schedule';
import { fetchStoryConfig, type StoryConfig } from '@/lib/supabase';

export type ScheduleStatus =
  | { status: 'loading' }
  | { status: 'countdown'; remaining: TimeRemaining; config: StoryConfig }
  | { status: 'ready';    config: StoryConfig };

/**
 * Hook to manage scheduled storytelling countdown and real-time transition.
 *
 * - Calculates remaining time relative to absolute clock (Date.now()) to prevent drift.
 * - Retains state across browser refreshes.
 * - Transitions status to 'ready' when the scheduled timestamp arrives.
 * - Periodically syncs config so admin schedule changes propagate automatically.
 */
export function useSchedule() {
  const [config, setConfig]       = useState<StoryConfig | null>(null);
  const [fetched, setFetched]     = useState(false);
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  // ── Fetch configuration ─────────────────────────────────────
  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await fetchStoryConfig();
      setConfig(cfg);
      if (cfg?.scheduled_at) {
        setRemaining(getTimeRemaining(cfg.scheduled_at));
      }
    } catch (err) {
      console.warn('Failed to fetch story schedule config:', err);
    } finally {
      setFetched(true);
    }
  }, []);

  useEffect(() => {
    refreshConfig();

    // Check for config updates every 30 seconds
    const syncInterval = setInterval(refreshConfig, 30_000);

    // Listen for custom dev update events (e.g. from preview tools)
    const handleDevUpdate = () => {
      refreshConfig();
    };
    window.addEventListener('mbl_config_updated', handleDevUpdate);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('mbl_config_updated', handleDevUpdate);
    };
  }, [refreshConfig]);

  // ── 1-second countdown ticker ──────────────────────────────
  useEffect(() => {
    if (!config?.scheduled_at) return;

    const tick = () => {
      const rem = getTimeRemaining(config.scheduled_at!);
      setRemaining(rem);
    };

    tick();
    const ticker = setInterval(tick, 1000);
    return () => clearInterval(ticker);
  }, [config?.scheduled_at]);

  // ── Status derivation ───────────────────────────────────────
  if (!fetched || !config) {
    return { status: 'loading' as const, refreshConfig };
  }

  // If no scheduled_at is provided, access is open
  if (!config.scheduled_at) {
    return { status: 'ready' as const, config, refreshConfig };
  }

  if (!remaining) {
    return { status: 'loading' as const, refreshConfig };
  }

  if (remaining.total > 0) {
    return {
      status: 'countdown' as const,
      remaining,
      config,
      refreshConfig,
    };
  }

  return {
    status: 'ready' as const,
    config,
    refreshConfig,
  };
}
