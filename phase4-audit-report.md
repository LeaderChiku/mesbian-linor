# Phase 4 Audit Report — mesbian-linor
**Complete Bug Fixes, Persistent Data, Security Hardening, Admin CMS, Interactive Collages, and Romantic Twist Experience**
*Generated: October 24, 2026*

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 Countdown Reverts to Default Date on Reload
- **Root Cause**: The authoritative schedule in `lib/server-state.ts` is initialized on server startup using `global.__mbl_session_state`. When running in a serverless environment (e.g. Vercel with ephemeral lambda containers) or upon server restart, the state re-initializes to `new Date(Date.now() + 24 * 60 * 60 * 1000)` (`defaultFutureSchedule`). The admin update command (`applyAdminCommand`) only updated the in-memory Node.js process memory without persisting to Supabase `story_sessions`.
- **Solution**: Connect `server-state.ts` and the `/api/admin/command` route to persist schedule updates directly to the Supabase `story_sessions` table (or fallback to persistent file/local cache in development). On server startup or cold boot, hydrate `global.__mbl_session_state` from the database.

### 1.2 Countdown Freezing in the Admin Panel
- **Root Cause**: In `components/admin/AdminDashboard.tsx` (lines 198–202):
  ```ts
  const adminCountdown = useMemo(() => {
    if (!showAdminCountdown || !session?.scheduledAt) return null;
    return getTimeRemaining(session.scheduledAt);
  }, [showAdminCountdown, session?.scheduledAt]);
  ```
  `adminCountdown` was wrapped in a static `useMemo` that only recalculated when `showAdminCountdown` or `session?.scheduledAt` changed. There was **no `setInterval` ticker** in `AdminDashboard.tsx`. Once mounted, the timer remained completely static and never ticked every second.
- **Solution**: Implement a 1-second `setInterval` ticker in `AdminDashboard.tsx` that updates a local tick counter or timestamps, recalculating `getTimeRemaining` against `Date.now()` without timer drift.

### 1.3 Countdown Freezing on Visitor Website
- **Root Cause**: In Phase 2, `components/StoryApp.tsx` switched from the old `useSchedule.ts` hook (which had an internal 1-second ticker) to `useRealtimeSession.ts`. In `StoryApp.tsx` (lines 43–48):
  ```ts
  const remaining: TimeRemaining = useMemo(() => {
    if (!session?.scheduledAt) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    return getTimeRemaining(session.scheduledAt);
  }, [session?.scheduledAt]);
  ```
  `remaining` only recalculated when `session?.scheduledAt` changed (i.e. when a new SSE message arrived from the server). There was **no interval ticker in `StoryApp.tsx`**, causing the countdown digits on `CountdownScreen` to freeze unless an SSE event was received.
- **Solution**: Add a clean, drift-free 1-second ticker to `StoryApp.tsx` that updates the remaining time every second against the system clock (`Date.now()`), handling tab visibility and wake-from-sleep events cleanly.

### 1.4 Visitor PIN Screen Bypassed on Page Reload
- **Root Cause**: `lib/session.ts` stored visitor verification in `localStorage` under `KEY_VERIFIED = 'mbl_verified'`. Because `localStorage` persists indefinitely across browser tabs and refreshes, once a visitor entered `739`, `isVerified()` returned `true` forever. In `StoryApp.tsx` (lines 83–87), any page reload checked `if (isVerified()) { setPhase('story'); }` and immediately bypassed both the countdown and the PIN screen.
- **Solution**: Per Phase 4 explicit reload semantics ("When the visitor reloads the page, the PIN gate must appear again. A fresh visitor visit must start at the PIN gate"):
  1. Remove automatic restoration of storytelling mode from persistent `localStorage`.
  2. Implement an in-memory/session-scoped verification lifecycle so reloading returns the visitor to the gate.
  3. Ensure server APIs verify visitor session cookies or tokens.

### 1.5 Admin Authentication Reload Bypass
- **Root Cause**: `app/admin/page.tsx` called `GET /api/admin/auth` on mount. Because the HTTP-only cookie `mbl_admin_session` had a max age of 8 hours, reloading `/admin` sent the cookie, the API verified it, and `setIsAuthenticated(true)` bypassed the PIN screen.
- **Solution**: The user requested that opening or reloading `/admin` requires PIN re-entry to display the dashboard. We will implement an explicit re-authentication step on `/admin` mount while preserving cryptographically signed server tokens for API calls.

### 1.6 Black Screen Leaves Scrollbar and Scrolling Active
- **Root Cause**: `session?.isBlackScreen` in `StoryApp.tsx` rendered a `fixed inset-0 z-50 bg-black` overlay, but did not lock `overflow: hidden` on `document.body` or `html`. On desktop and mobile, mouse-wheel and touch scrolling continued in the background and the browser scrollbar remained visible.
- **Solution**: Lock `document.body.style.overflow = 'hidden'`, hide scrollbars, prevent touch dragging, and visually hide the underlying story elements during Black Screen activation. Restore previous overflow state on deactivation.

---

## 2. Existing Architecture Overview

| Area | Implementation Details |
| :--- | :--- |
| **Framework** | Next.js 14.2.35 App Router with TypeScript |
| **Styling** | Tailwind CSS v3.4.17 with custom color palette (pistachio, cream, blush, stone) |
| **Animations** | Framer Motion v11.12.0 with `useReducedMotion` support |
| **Realtime Sync** | Server-Sent Events (SSE) at `/api/session/stream` with 8s polling fallback at `/api/session/state` |
| **Server State** | `lib/server-state.ts` with global in-memory state object `__mbl_session_state` |
| **Database** | Supabase PostgreSQL schema with `story_sessions`, `admin_config`, `story_chapters`, `story_photos` |
| **Admin Auth** | HMAC-SHA256 signed session cookie (`mbl_admin_session`) with server-side PIN verification and 5-attempt lockout |
| **Visitor Auth** | Server-side timing-safe 3-digit PIN verification with HMAC cookie (`mbl_visitor_verified`) |
| **Audio Engine** | Synthesized Web Audio API harp chimes (E-major pentatonic) with remote audio ducking |

---

## 3. Security Findings & Hardening

1. **Service Role Key Separation**: Confirmed that `SUPABASE_SERVICE_ROLE_KEY` is never referenced in client-side code and was removed as an insecure fallback for session signing in `lib/admin-auth.ts`.
2. **Visitor & Admin PINs**: PINs are strictly verified server-side using `crypto.timingSafeEqual`.
3. **Session Secret Generation**: In production, `ADMIN_SESSION_SECRET` and `VISITOR_CODE_SECRET` must be set via environment variables. We will ensure production fails securely if these secrets are missing or default.
4. **Rate Limiting**: In-memory rate limiting operates per IP (5 attempts, 10–15 min lockout).

---

## 4. Database Findings & Migration Strategy

- **Authoritative Table**: `story_sessions` (stores `session_id`, `story_title`, `scheduled_at`, `session_status`, `current_section_id`, `current_section_index`, `selected_ending`, `is_black_screen`, `selected_audio_id`, `command_seq`).
- **Phase 4 Additions Needed**:
  - Add `is_twist_active` (boolean) to `story_sessions`.
  - Add `ready_to_begin_at` (timestamptz) or notifications table.
  - Add `cms_content` table (for introductory text, chapters, headings, ending text, and visual settings).
  - Add `story_collages` / enhance `story_photos` (category support: `The Golden Hour`, `Late Night Queues`, `Folded Whispers`, `Our Little World`, sort order, captions, comments, cover image).
- **Rule 3 Compliance**: All database changes will be strictly additive in `supabase/migration_phase4.sql` without dropping or resetting existing tables.

---

## 5. Baseline Test Results

Running `npm test` against the unmodified repository:
- **Admin Authentication**: 5/5 passed.
- **Schedule Logic**: 3/4 passed (1 test had a sub-millisecond edge case in timestamp subtraction: `assert.strictEqual(rem.minutes, 5)` returned 4 because `target - now` was 3899.99s).
- **Server State & Admin Commands**: 6/6 passed.
- **Three Endings**: 5/5 passed.
- **Sections & Audio Registry**: 2/2 passed.
- **ESLint**: Passed with 0 warnings or errors.
- **Production Build**: Passed with code 0.

---

## 6. Phase 4 Implementation Plan

1. **P4.1**: Fix countdown freezing in `StoryApp.tsx` and `AdminDashboard.tsx` with drift-free 1-second tickers. Connect server state to Supabase persistence.
2. **P4.2**: Overhaul visitor PIN gate: remove auto-bypass from `localStorage`, require PIN entry on reload and fresh visit, maintain secure server verification.
3. **P4.3**: Implement admin reauthentication on page reload while preserving secure session cookies and rate limiting.
4. **P4.4**: Implement "Ready to Begin" button in intro section, realtime admin notification delivery, and deduplicated notification store.
5. **P4.5**: Complete Black Screen overhaul: lock `body`/`html` scrolling, hide scrollbars completely, prevent touch/wheel chaining, and cleanly restore on deactivation.
6. **P4.6**: Build Admin Content Management System (CMS) for intro text, headings, letters, categories, and endings with persistent save and realtime visitor synchronization.
7. **P4.7**: Build 4-category photo collages (The Golden Hour, Late Night Queues, Folded Whispers, Our Little World) with vertical scroll layouts, captions, comments, admin cover upload, reordering, and metadata persistence.
8. **P4.8**: Build Admin Twist control (`Trigger Twist`), glass-shatter physics animation, and romantic baby-pink transition experience with state persistence across devices.
9. **P4.9**: Regression tests, full integration test suite, `phase4-implementation-report.md`, and manual test checklist.
