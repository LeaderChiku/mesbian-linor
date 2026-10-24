/**
 * Visitor session helpers (Phase 4 — strict per-visit security).
 *
 * Requirements:
 * - A fresh visit must start at the PIN gate (or countdown if future).
 * - Reloading returns the visitor to the PIN gate (no automatic localStorage bypass).
 * - Story access is granted only after server verification of 3-digit code.
 */

const KEY_PHASE        = 'mbl_phase';
const KEY_VISITOR_UUID = 'mbl_visitor_id';

export type StoryPhase = 'loading' | 'countdown' | 'access' | 'story';

// In-memory active verification for the current page session
let inMemoryVerified = false;

export function isVerified(): boolean {
  return inMemoryVerified;
}

export function markVerified(): void {
  inMemoryVerified = true;
}

export function clearSession(): void {
  inMemoryVerified = false;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEY_PHASE);
    sessionStorage.removeItem('mbl_session_verified');
    // Clear cookie
    document.cookie = 'mbl_visitor_verified=; path=/; max-age=0';
  }
}

export function savePhase(phase: StoryPhase): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY_PHASE, phase);
  } catch {
    // ignore storage errors
  }
}

export function loadPhase(): StoryPhase | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(KEY_PHASE);
    if (v === 'countdown' || v === 'access') return v;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Get or create an anonymous persistent visitor token.
 * Ready for Phase 2 Supabase session tracking and synchronization.
 */
export function getOrCreateVisitorToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(KEY_VISITOR_UUID);
  if (!token) {
    token = 'vis_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(KEY_VISITOR_UUID, token);
  }
  return token;
}
