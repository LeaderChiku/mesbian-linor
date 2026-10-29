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
  unlockedChapterIndex: number; // 0 = Prologue, 1 = Ch 1, 2 = Ch 2, 3 = Ch 3, 4 = Ch 4
  totalSections: number;
  selectedEnding: string | null;
  isBlackScreen: boolean;
  isTwistActive: boolean; // Phase 4 Romantic Twist state
  showDevTools: boolean; // Admin-controlled dev tools visibility
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
  // eslint-disable-next-line no-var
  var __mbl_has_hydrated: boolean | undefined;
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

export function ensureSessionState(): StorySessionState {
  if (!global.__mbl_session_state) {
    const cachedState = loadStateFromCache();
    global.__mbl_session_state = {
      sessionId: 'session_primary',
      storyTitle: cachedState?.storyTitle || 'A Story for You',
      scheduledAt: cachedState?.scheduledAt !== undefined
        ? cachedState.scheduledAt
        : (process.env.NEXT_PUBLIC_SCHEDULED_AT || null),
      sessionStatus: cachedState?.sessionStatus || 'scheduled',
      currentSectionId: cachedState?.currentSectionId || STORY_SECTIONS[0].id,
      currentSectionIndex: cachedState?.currentSectionIndex ?? 0,
      unlockedChapterIndex: cachedState?.unlockedChapterIndex ?? cachedState?.currentSectionIndex ?? 0,
      totalSections: STORY_SECTIONS.length,
      selectedEnding: cachedState?.selectedEnding || null,
      isBlackScreen: cachedState?.isBlackScreen ?? false,
      isTwistActive: cachedState?.isTwistActive ?? false,
      showDevTools: cachedState?.showDevTools ?? false,
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
  return global.__mbl_session_state;
}

ensureSessionState();

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
    const fullPayload = {
      session_id: state.sessionId,
      story_title: state.storyTitle,
      scheduled_at: state.scheduledAt,
      session_status: state.sessionStatus,
      current_section_id: state.currentSectionId,
      current_section_index: state.currentSectionIndex,
      unlocked_chapter_index: state.unlockedChapterIndex ?? 0,
      total_sections: state.totalSections,
      selected_ending: state.selectedEnding,
      is_black_screen: state.isBlackScreen,
      is_twist_active: state.isTwistActive,
      show_dev_tools: state.showDevTools ?? false,
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
    };

    const { error } = await supabase.from('story_sessions').upsert(
      fullPayload,
      { onConflict: 'session_id' }
    );

    if (error) {
      console.warn('[supabase sync warning, trying phase4 fallback]:', error.message);
      // Fallback 1: Phase 4 schema (includes cms_data, twist, notifications, without show_dev_tools or new audio)
      const phase4Payload = {
        session_id: state.sessionId,
        story_title: state.storyTitle,
        scheduled_at: state.scheduledAt,
        session_status: state.sessionStatus,
        current_section_id: state.currentSectionId,
        current_section_index: state.currentSectionIndex,
        unlocked_chapter_index: state.unlockedChapterIndex ?? 0,
        total_sections: state.totalSections,
        selected_ending: state.selectedEnding,
        is_black_screen: state.isBlackScreen,
        is_twist_active: state.isTwistActive ?? false,
        ready_to_begin_at: state.readyToBeginAt,
        notifications: state.notifications ?? [],
        cms_data: state.cmsData ?? {},
        selected_audio_id: state.selectedAudioId,
        command_seq: state.commandSeq,
        last_command: state.lastCommand,
        updated_at: new Date().toISOString(),
      };
      const fallbackResult = await supabase.from('story_sessions').upsert(
        phase4Payload,
        { onConflict: 'session_id' }
      );
      if (fallbackResult.error) {
        console.warn('[supabase sync warning, trying cms+schedule fallback]:', fallbackResult.error.message);
        // Fallback 2: Essential schedule + cms_data
        const cmsSchedulePayload = {
          session_id: state.sessionId,
          scheduled_at: state.scheduledAt,
          cms_data: state.cmsData ?? {},
          updated_at: new Date().toISOString(),
        };
        const minimalCmsUpsert = await supabase
          .from('story_sessions')
          .upsert(cmsSchedulePayload, { onConflict: 'session_id' });

        if (minimalCmsUpsert.error) {
          // Fallback 3: Minimal upsert with just session_id and scheduled_at (only if cms_data column doesn't exist)
          const minimalUpsert = await supabase
            .from('story_sessions')
            .upsert(
              {
                session_id: state.sessionId,
                scheduled_at: state.scheduledAt,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'session_id' }
            );
          if (minimalUpsert.error) {
            console.error('[supabase sync write error]:', minimalUpsert.error.message);
            return false;
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('[supabase sync error]:', err);
    return false;
  }
}

/**
 * Asynchronously fetch session state from Supabase database.
 */
export async function loadSessionFromSupabase(): Promise<Partial<StorySessionState> | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('story_sessions')
      .select('*')
      .eq('session_id', 'session_primary')
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn('[supabase load warning]:', error.message);
      return null;
    }

    const loaded: Partial<StorySessionState> = {};
    if (data.session_id) loaded.sessionId = data.session_id;
    if (data.story_title) loaded.storyTitle = data.story_title;
    if (data.scheduled_at !== undefined) loaded.scheduledAt = data.scheduled_at;
    if (data.session_status) loaded.sessionStatus = data.session_status;
    if (data.current_section_id) loaded.currentSectionId = data.current_section_id;
    if (typeof data.current_section_index === 'number') loaded.currentSectionIndex = data.current_section_index;
    if (typeof data.unlocked_chapter_index === 'number') {
      loaded.unlockedChapterIndex = data.unlocked_chapter_index;
    } else if (typeof data.current_section_index === 'number') {
      loaded.unlockedChapterIndex = data.current_section_index;
    }
    if (typeof data.total_sections === 'number') loaded.totalSections = data.total_sections;
    if (data.selected_ending !== undefined) loaded.selectedEnding = data.selected_ending;
    if (typeof data.is_black_screen === 'boolean') loaded.isBlackScreen = data.is_black_screen;
    if (typeof data.is_twist_active === 'boolean') loaded.isTwistActive = data.is_twist_active;
    if (typeof data.show_dev_tools === 'boolean') loaded.showDevTools = data.show_dev_tools;
    if (data.ready_to_begin_at !== undefined) loaded.readyToBeginAt = data.ready_to_begin_at;
    if (Array.isArray(data.notifications)) loaded.notifications = data.notifications;
    if (data.cms_data && typeof data.cms_data === 'object' && Object.keys(data.cms_data).length > 0) {
      loaded.cmsData = data.cms_data;
    }
    if (data.selected_audio_id) loaded.selectedAudioId = data.selected_audio_id;
    if (data.audio_command) loaded.audioCommand = data.audio_command;
    if (data.audio_state) loaded.audioState = data.audio_state;
    if (data.audio_type) loaded.audioType = data.audio_type;
    if (typeof data.audio_volume === 'number') loaded.audioVolume = data.audio_volume;
    if (typeof data.command_seq === 'number') loaded.commandSeq = data.command_seq;
    if (data.last_command) loaded.lastCommand = data.last_command;
    if (data.updated_at) loaded.updatedAt = data.updated_at;

    return loaded;
  } catch (err) {
    console.warn('[supabase load error]:', err);
    return null;
  }
}

/**
 * Get current server-authoritative session state, hydrating from Supabase on cold start.
 */
export async function getAuthoritativeSessionState(): Promise<StorySessionState> {
  ensureSessionState();
  if (!global.__mbl_has_hydrated) {
    global.__mbl_has_hydrated = true;
    try {
      const dbState = await loadSessionFromSupabase();
      if (dbState && global.__mbl_session_state) {
        const mergedCms = {
          ...(global.__mbl_session_state.cmsData || {}),
          ...(dbState.cmsData || {}),
        };
        global.__mbl_session_state = {
          ...global.__mbl_session_state,
          ...dbState,
          cmsData: mergedCms,
          scheduledAt: dbState.scheduledAt !== undefined ? dbState.scheduledAt : global.__mbl_session_state.scheduledAt,
        };
        saveStateToCache(global.__mbl_session_state);
      }
    } catch (err) {
      console.warn('[hydration error]:', err);
    }
  }
  return getSessionState();
}

/**
 * Get current server-authoritative session state.
 */
export function getSessionState(): StorySessionState {
  return { ...ensureSessionState() };
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
    | { type: 'NAVIGATE'; sectionIndex: number; unlockedChapterIndex?: number }
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
    | { type: 'SET_DEV_TOOLS'; enabled: boolean }
): { success: boolean; state: StorySessionState; error?: string } {
  ensureSessionState();
  global.__mbl_has_hydrated = true;
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
      if (typeof action.unlockedChapterIndex === 'number') {
        current.unlockedChapterIndex = Math.max(0, Math.min(action.unlockedChapterIndex, STORY_SECTIONS.length - 1));
      } else {
        current.unlockedChapterIndex = Math.max(current.unlockedChapterIndex ?? 0, idx);
      }
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
      // Do not sync to Supabase or increment commandSeq on periodic audio playback reports
      return { success: true, state: { ...current } };
    }

    case 'SET_DEV_TOOLS': {
      current.showDevTools = action.enabled;
      current.commandSeq += 1;
      current.lastCommand = action.enabled ? 'DEV_TOOLS_ON' : 'DEV_TOOLS_OFF';
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
