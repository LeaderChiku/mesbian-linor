import { STORY_SECTIONS } from '@/lib/sections';

/**
 * Server-Authoritative Story Session Model
 */
export interface StorySessionState {
  sessionId: string;
  storyTitle: string;
  scheduledAt: string | null; // ISO UTC string
  sessionStatus: 'scheduled' | 'active' | 'paused' | 'ended';
  currentSectionId: string;
  currentSectionIndex: number;
  totalSections: number;
  selectedEnding: string | null;
  isBlackScreen: boolean;
  selectedAudioId: string | null;
  audioCommand: 'play' | 'pause' | 'resume' | 'stop' | 'none';
  audioState: 'playing' | 'paused' | 'stopped' | 'ducked' | 'ready';
  audioType: 'music' | 'voice_note';
  audioVolume: number; // 0 to 100
  commandSeq: number; // Incrementing command sequence to prevent duplicates
  lastCommand: string | null;
  updatedAt: string;
}

/**
 * Public visitor session payload — specifically strips server secrets like visitorCode.
 */
export type VisitorSessionPayload = StorySessionState;

// Internal server-only configuration
interface InternalServerConfig {
  visitorCode: string; // 3 digits, strictly server-side
}

// Global in-memory singleton to preserve state across Route Handler invocations
declare global {
  // eslint-disable-next-line no-var
  var __mbl_session_state: StorySessionState | undefined;
  // eslint-disable-next-line no-var
  var __mbl_server_config: InternalServerConfig | undefined;
  // eslint-disable-next-line no-var
  var __mbl_subscribers: Set<(state: StorySessionState) => void> | undefined;
}

const defaultFutureSchedule = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

if (!global.__mbl_session_state) {
  global.__mbl_session_state = {
    sessionId: 'session_primary',
    storyTitle: 'A Story for You',
    scheduledAt: process.env.NEXT_PUBLIC_SCHEDULED_AT || defaultFutureSchedule,
    sessionStatus: 'scheduled',
    currentSectionId: STORY_SECTIONS[0].id,
    currentSectionIndex: 0,
    totalSections: STORY_SECTIONS.length,
    selectedEnding: null,
    isBlackScreen: false,
    selectedAudioId: 'music-chimes',
    audioCommand: 'none',
    audioState: 'ready',
    audioType: 'music',
    audioVolume: 80,
    commandSeq: 1,
    lastCommand: 'INIT',
    updatedAt: new Date().toISOString(),
  };
}

if (!global.__mbl_server_config) {
  global.__mbl_server_config = {
    visitorCode: process.env.VISITOR_CODE || '739',
  };
}

if (!global.__mbl_subscribers) {
  global.__mbl_subscribers = new Set();
}

/**
 * Get current server-authoritative session state.
 */
export function getSessionState(): StorySessionState {
  return { ...global.__mbl_session_state! };
}

/**
 * Get sanitized visitor state (no secrets).
 */
export function getVisitorState(): VisitorSessionPayload {
  return getSessionState();
}

/**
 * Get configured 3-digit visitor code (server-only).
 */
export function getStoredVisitorCode(): string {
  return global.__mbl_server_config!.visitorCode;
}

/**
 * Subscribe to state changes (used by SSE stream for real-time delivery).
 */
export function subscribeToSession(callback: (state: StorySessionState) => void): () => void {
  global.__mbl_subscribers!.add(callback);
  return () => {
    global.__mbl_subscribers!.delete(callback);
  };
}

function broadcastStateUpdate(newState: StorySessionState): void {
  if (global.__mbl_subscribers) {
    global.__mbl_subscribers.forEach((cb) => {
      try {
        cb(newState);
      } catch (err) {
        console.warn('Error notifying subscriber:', err);
      }
    });
  }
}

/**
 * Apply an administrative command to update session state.
 */
export function applyAdminCommand(
  action:
    | { type: 'SET_SCHEDULE'; scheduledAt: string | null }
    | { type: 'SET_VISITOR_CODE'; code: string }
    | { type: 'NAVIGATE'; sectionIndex: number }
    | { type: 'AUDIO_CONTROL'; command: 'play' | 'pause' | 'resume' | 'stop'; audioId?: string; volume?: number; audioType?: 'music' | 'voice_note' }
    | { type: 'SET_SESSION_STATUS'; status: 'scheduled' | 'active' | 'paused' | 'ended' }
    | { type: 'SET_BLACK_SCREEN'; enabled: boolean }
    | { type: 'REPORT_AUDIO_STATE'; state: 'playing' | 'paused' | 'stopped' | 'ducked' | 'ready' }
): { success: boolean; state: StorySessionState; error?: string } {
  const current = global.__mbl_session_state!;

  switch (action.type) {
    case 'SET_SCHEDULE': {
      if (action.scheduledAt !== null) {
        const d = new Date(action.scheduledAt);
        if (isNaN(d.getTime())) {
          return { success: false, state: current, error: 'Invalid date/time format' };
        }
      }
      current.scheduledAt = action.scheduledAt;
      current.commandSeq += 1;
      current.lastCommand = 'SET_SCHEDULE';
      break;
    }

    case 'SET_VISITOR_CODE': {
      const sanitized = action.code.trim();
      if (!/^\d{3}$/.test(sanitized)) {
        return { success: false, state: current, error: 'Code must be exactly 3 numeric digits' };
      }
      global.__mbl_server_config!.visitorCode = sanitized;
      current.commandSeq += 1;
      current.lastCommand = 'SET_VISITOR_CODE';
      break;
    }

    case 'NAVIGATE': {
      const idx = Math.max(0, Math.min(action.sectionIndex, STORY_SECTIONS.length - 1));
      current.currentSectionIndex = idx;
      current.currentSectionId = STORY_SECTIONS[idx].id;
      current.commandSeq += 1;
      current.lastCommand = `NAVIGATE_TO_${idx}`;
      break;
    }

    case 'AUDIO_CONTROL': {
      current.audioCommand = action.command;
      if (action.audioId) {
        current.selectedAudioId = action.audioId;
      }
      if (typeof action.volume === 'number') {
        current.audioVolume = Math.max(0, Math.min(100, action.volume));
      }
      if (action.audioType) {
        current.audioType = action.audioType;
      }
      current.commandSeq += 1;
      current.lastCommand = `AUDIO_${action.command.toUpperCase()}`;
      break;
    }

    case 'SET_SESSION_STATUS': {
      current.sessionStatus = action.status;
      current.commandSeq += 1;
      current.lastCommand = `STATUS_${action.status.toUpperCase()}`;
      break;
    }

    case 'SET_BLACK_SCREEN': {
      current.isBlackScreen = action.enabled;
      current.commandSeq += 1;
      current.lastCommand = action.enabled ? 'BLACK_SCREEN_ON' : 'BLACK_SCREEN_OFF';
      break;
    }

    case 'REPORT_AUDIO_STATE': {
      current.audioState = action.state;
      break;
    }
  }

  current.updatedAt = new Date().toISOString();
  broadcastStateUpdate({ ...current });

  return { success: true, state: { ...current } };
}
