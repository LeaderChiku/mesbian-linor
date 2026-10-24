/**
 * Visitor session helpers (browser-only, localStorage).
 *
 * Stores:
 *  - Whether the visitor has been verified (code entered correctly).
 *  - Persistent visitor token for future Supabase real-time sync (Phase 2).
 *  - The story phase they left on, preserving flow across refreshes.
 */

const KEY_VERIFIED     = 'mbl_verified';
const KEY_PHASE        = 'mbl_phase';
const KEY_VISITOR_UUID = 'mbl_visitor_id';

export type StoryPhase = 'loading' | 'countdown' | 'access' | 'story';

export function isVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_VERIFIED) === 'true';
}

export function markVerified(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_VERIFIED, 'true');
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_VERIFIED);
  localStorage.removeItem(KEY_PHASE);
}

export function savePhase(phase: StoryPhase): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_PHASE, phase);
}

export function loadPhase(): StoryPhase | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(KEY_PHASE);
  if (v === 'countdown' || v === 'access' || v === 'story') return v;
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
