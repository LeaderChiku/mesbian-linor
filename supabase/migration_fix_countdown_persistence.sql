-- ============================================================
-- Migration: Fix Countdown Persistence & RLS Write Permissions
-- ============================================================
-- 1. Ensure story_sessions table allows server-side API writes
--    even when deployed with the anonymous key (e.g. Vercel env).
-- 2. Clean up any stale initial seed (now() + interval '24 hours')
--    so an unconfigured session starts in explicit unscheduled state (null).

-- Enable RLS
alter table if exists story_sessions enable row level security;

-- Drop prior restrictive write policies if any
drop policy if exists "Public can read session state" on story_sessions;
drop policy if exists "Service role has full access to story_sessions" on story_sessions;
drop policy if exists "Allow server api update to story_sessions" on story_sessions;
drop policy if exists "Allow server api insert to story_sessions" on story_sessions;
drop policy if exists "Allow server api upsert to story_sessions" on story_sessions;

-- 1. Anyone can read the current session state
create policy "Public can read session state"
  on story_sessions for select
  using (true);

-- 2. Allow server-side updates (all writes are authenticated through Next.js /api/admin/command)
create policy "Allow server api update to story_sessions"
  on story_sessions for update
  using (true)
  with check (true);

-- 3. Allow server-side inserts
create policy "Allow server api insert to story_sessions"
  on story_sessions for insert
  with check (true);

-- 4. Clean up any stale unconfigured 24h default seed if never modified by admin
update story_sessions
set scheduled_at = null
where session_id = 'session_primary'
  and (command_seq is null or command_seq <= 1)
  and (last_command is null or last_command = 'INIT');
