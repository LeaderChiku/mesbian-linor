'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { StorySessionState } from '@/lib/server-state';

export type ConnectionStatus = 'connected' | 'syncing' | 'offline';

/**
 * Real-time session synchronization hook for visitor phone and admin panel.
 *
 * Uses Server-Sent Events (SSE) with automatic fallback polling.
 * Preserves the current section if connection drops and reconnects automatically.
 */
export function useRealtimeSession() {
  const [session, setSession] = useState<StorySessionState | null>(null);
  const [status, setStatus]   = useState<ConnectionStatus>('syncing');
  const eventSourceRef        = useRef<EventSource | null>(null);
  const retryTimeoutRef       = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef       = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch snapshot via standard HTTP ────────────────────────
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/session/state', { cache: 'no-store' });
      if (res.ok) {
        const data: StorySessionState = await res.json();
        setSession((prev) => {
          // Only update if server state is newer or initial
          if (!prev || data.commandSeq >= prev.commandSeq) {
            return data;
          }
          return prev;
        });
        setStatus('connected');
      }
    } catch {
      setStatus('offline');
    }
  }, []);

  // ── Connect SSE Stream ──────────────────────────────────────
  const connectStream = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/session/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const data: StorySessionState = JSON.parse(event.data);
          setSession((prev) => {
            // Avoid executing older or duplicate commands
            if (!prev || data.commandSeq >= prev.commandSeq) {
              return data;
            }
            return prev;
          });
          setStatus('connected');
        } catch {
          // ignore non-json ping comments
        }
      };

      es.onerror = () => {
        setStatus('offline');
        es.close();

        // Reconnect after 3s
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            connectStream();
          }, 3000);
        }
      };
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    connectStream();

    // Fallback background polling every 8s in case SSE is interrupted
    pollIntervalRef.current = setInterval(fetchSnapshot, 8000);

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchSnapshot, connectStream]);

  return {
    session,
    connectionStatus: status,
    refetch: fetchSnapshot,
  };
}
