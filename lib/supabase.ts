import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Browser-side Supabase client (singleton).
 * Null when credentials are not configured in environment.
 */
export const supabase =
  supabaseUrl && supabaseAnon
    ? createClient(supabaseUrl, supabaseAnon)
    : null;

export type StoryConfig = {
  id:            string;
  scheduled_at:  string | null; // ISO-8601 UTC
  access_code:   string;        // 3-digit string, e.g. "472"
  is_enabled:    boolean;
  story_title:   string;
  created_at:    string;
  updated_at:    string;
};

/**
 * Default fallback configuration used when Supabase is not yet set up
 * or during development.
 * Schedules the moment 24 hours into the future so countdown is immediately observable.
 */
export function getDefaultStoryConfig(): StoryConfig {
  // Check if a client-side override exists (e.g., from dev controls or query params)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mbl_dev_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse error
      }
    }

    // Check URL parameters for live testing: ?countdown=10 or ?code=123
    const urlParams = new URLSearchParams(window.location.search);
    const countdownSec = urlParams.get('countdown');
    if (countdownSec && !isNaN(Number(countdownSec))) {
      const scheduled = new Date(Date.now() + Number(countdownSec) * 1000).toISOString();
      return {
        id: 'dev-config',
        scheduled_at: scheduled,
        access_code: urlParams.get('code') || '472',
        is_enabled: true,
        story_title: 'Our Story',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  // Fallback to environment variable or 24h future schedule
  const envScheduled = process.env.NEXT_PUBLIC_SCHEDULED_AT;
  const envCode      = process.env.NEXT_PUBLIC_ACCESS_CODE || '472';
  const defaultFutureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: 'default-config',
    scheduled_at: envScheduled || defaultFutureDate,
    access_code: envCode,
    is_enabled: true,
    story_title: 'A Story for You',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch the active story config.
 * Queries Supabase first; if not configured or query fails,
 * falls back to local/default configuration so the visitor experience
 * is always fully functional and testable.
 */
export async function fetchStoryConfig(): Promise<StoryConfig> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('story_config')
        .select('*')
        .eq('is_enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as StoryConfig;
      }
      if (error) {
        console.warn('[supabase] fetchStoryConfig warning:', error.message);
      }
    } catch (err) {
      console.warn('[supabase] connection error:', err);
    }
  }

  return getDefaultStoryConfig();
}
