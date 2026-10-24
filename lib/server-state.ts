import { STORY_SECTIONS } from '@/lib/sections';
import { getSupabaseServerClient } from '@/lib/supabase';
import fs from 'node:fs';
import path from 'node:path';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

/**
 * Server-Authoritative Story Session Model (Phase 4)
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
  isTwistActive: boolean; // Phase 4 Romantic Twist state
  readyToBeginAt: string | null; // Phase 4 Ready-to-Begin timestamp
  notifications: NotificationItem[]; // Phase 4 live admin notifications
  cmsData: Record<string, string>; // Phase 4 editable CMS values
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

const CACHE_FILE_PATH = path.join(process.cwd(), '.session_cache.json');

function loadStateFromCache(): Partial<StorySessionState> | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function saveStateToCache(state: StorySessionState): void {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // Ignore write errors (e.g. read-only file systems)
  }
}

const defaultFutureSchedule = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const cachedState = loadStateFromCache();

if (!global.__mbl_session_state) {
  global.__mbl_session_state = {
    sessionId: 'session_primary',
    storyTitle: cachedState?.storyTitle || 'A Story for You',
    scheduledAt: cachedState?.scheduledAt !== undefined
      ? cachedState.scheduledAt
      : (process.env.NEXT_PUBLIC_SCHEDULED_AT || defaultFutureSchedule),
    sessionStatus: cachedState?.sessionStatus || 'scheduled',
    currentSectionId: cachedState?.currentSectionId || STORY_SECTIONS[0].id,
    currentSectionIndex: cachedState?.currentSectionIndex ?? 0,
    totalSections: STORY_SECTIONS.length,
    selectedEnding: cachedState?.selectedEnding || null,
    isBlackScreen: cachedState?.isBlackScreen ?? false,
    isTwistActive: cachedState?.isTwistActive ?? false,
    readyToBeginAt: cachedState?.readyToBeginAt || null,
    notifications: cachedState?.notifications || [],
    cmsData: cachedState?.cmsData || {},
    selectedAudioId: cachedState?.selectedAudioId || 'music-chimes',
    audioCommand: 'none',
    audioState: 'ready',
    audioType: 'music',
    audioVolume: cachedState?.audioVolume ?? 80,
    commandSeq: (cachedState?.commandSeq ?? 1) + 1,
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
 * Asynchronously sync current state with Supabase database.
 */
export async function syncSessionWithSupabase(state: StorySessionState): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return true; // Offline / dev mode succeeds locally

  try {
    const { error } = await supabase.from('story_sessions').upsert(
      {
        session_id: state.sessionId,
        story_title: state.storyTitle,
        scheduled_at: state.scheduledAt,
        session_status: state.sessionStatus,
        current_section_id: state.currentSectionId,
        current_section_index: state.currentSectionIndex,
        total_sections: state.totalSections,
        selected_ending: state.selectedEnding,
        is_black_screen: state.isBlackScreen,
        is_twist_active: state.isTwistActive,
        ready_to_begin_at: state.readyToBeginAt,
        notifications: state.notifications,
        cms_data: state.cmsData,
        selected_audio_id: state.selectedAudioId,
        audio_command: state.audioCommand,
        audio_state: state.audioState,
        audio_type: state.audioType,
        audio_volume: state.audioVolume,
        command_seq: state.commandSeq,
        last_command: state.lastCommand,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );

    if (error) {
      console.warn('[supabase sync warning]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[supabase sync error]:', err);
    return false;
  }
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

export function broadcastStateUpdate(newState: StorySessionState): void {
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
    | { type: 'SET_ENDING'; ending: 'ending-a' | 'ending-b' | 'ending-c' | null }
    | { type: 'SET_TWIST'; enabled: boolean }
    | { type: 'TRIGGER_READY_TO_BEGIN'; message?: string }
    | { type: 'DISMISS_NOTIFICATION'; id: string }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'UPDATE_CMS'; data: Record<string, string> }
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

    case 'SET_ENDING': {
      current.selectedEnding = action.ending;
      current.commandSeq += 1;
      current.lastCommand = `SET_ENDING_${action.ending ?? 'NONE'}`;
      break;
    }

    case 'SET_TWIST': {
      current.isTwistActive = action.enabled;
      current.commandSeq += 1;
      current.lastCommand = action.enabled ? 'TWIST_TRIGGERED' : 'TWIST_RESET';
      break;
    }

    case 'TRIGGER_READY_TO_BEGIN': {
      const timestamp = new Date().toISOString();
      current.readyToBeginAt = timestamp;
      const notificationId = `notif_${Date.now()}`;
      const newNotification: NotificationItem = {
        id: notificationId,
        type: 'READY_TO_BEGIN',
        message: action.message || 'Your girl is ready to see the story! 💌',
        timestamp,
        read: false,
      };
      // Prepend and cap to 20 notifications
      current.notifications = [newNotification, ...current.notifications.slice(0, 19)];
      current.commandSeq += 1;
      current.lastCommand = 'READY_TO_BEGIN';
      break;
    }

    case 'DISMISS_NOTIFICATION': {
      current.notifications = current.notifications.map((n) =>
        n.id === action.id ? { ...n, read: true } : n
      );
      current.commandSeq += 1;
      current.lastCommand = 'DISMISS_NOTIFICATION';
      break;
    }

    case 'CLEAR_NOTIFICATIONS': {
      current.notifications = [];
      current.commandSeq += 1;
      current.lastCommand = 'CLEAR_NOTIFICATIONS';
      break;
    }

    case 'UPDATE_CMS': {
      current.cmsData = { ...current.cmsData, ...action.data };
      current.commandSeq += 1;
      current.lastCommand = 'UPDATE_CMS';
      break;
    }

    case 'REPORT_AUDIO_STATE': {
      current.audioState = action.state;
      break;
    }
  }

  current.updatedAt = new Date().toISOString();

  // Save to persistent file cache immediately
  saveStateToCache(current);

  // Broadcast to all active SSE subscribers immediately
  broadcastStateUpdate({ ...current });

  // Asynchronously sync to Supabase database without blocking
  syncSessionWithSupabase({ ...current }).catch((err) => {
    console.warn('Background Supabase sync error:', err);
  });

  return { success: true, state: { ...current } };
}
