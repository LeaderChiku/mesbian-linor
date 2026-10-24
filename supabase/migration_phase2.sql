-- ============================================================
-- mesbian-linor Supabase Migration: Phase 2
-- Secure Admin Panel & Real-Time Session Synchronization
-- ============================================================

-- 1. Enable cryptographic utilities
create extension if not exists "pgcrypto";

-- 2. Enhanced Story Session Model
create table if not exists story_sessions (
  id                     uuid primary key default gen_random_uuid(),
  session_id             text not null unique default 'session_primary',
  story_title            text not null default 'A Story for You',
  scheduled_at           timestamptz,                          -- NULL = immediate access; future = live countdown
  session_status         text not null default 'scheduled',    -- 'scheduled' | 'active' | 'paused' | 'ended'
  current_section_id     text not null default 'hero',
  current_section_index  integer not null default 0,
  total_sections         integer not null default 5,
  selected_ending        text,
  is_black_screen        boolean not null default false,
  selected_audio_id      text default 'music-chimes',
  audio_command          text default 'none',                  -- 'play' | 'pause' | 'resume' | 'stop' | 'none'
  audio_state            text default 'ready',                 -- 'playing' | 'paused' | 'stopped' | 'ducked' | 'ready'
  audio_type             text default 'music',                 -- 'music' | 'voice_note'
  audio_volume           integer not null default 80,          -- 0 to 100
  command_seq            bigint not null default 1,            -- Incrementing version sequence
  last_command           text default 'INIT',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 3. Secure Admin Configuration (Server-Only, protected by RLS)
create table if not exists admin_config (
  id                     uuid primary key default gen_random_uuid(),
  visitor_code_hash      text not null default encode(digest('472', 'sha256'), 'hex'), -- Hashed 3-digit visitor code
  admin_pin_hash         text not null default encode(digest('2468', 'sha256'), 'hex'), -- Hashed 4-digit admin PIN
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 4. Auto-update timestamp trigger
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_story_sessions_updated_at
  before update on story_sessions
  for each row execute procedure handle_updated_at();

-- 5. Row Level Security (RLS) Configuration
alter table story_sessions enable row level security;
alter table admin_config   enable row level security;

-- Visitors (Public Anon) can ONLY SELECT non-sensitive session fields
create policy "Public can read session state"
  on story_sessions for select
  using (true);

-- Visitors CANNOT directly INSERT or UPDATE the authoritative session
-- Only service_role (via Server API routes) can perform writes
create policy "Service role has full access to story_sessions"
  on story_sessions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- admin_config is completely restricted to service_role (no public read/write)
create policy "Service role has full access to admin_config"
  on admin_config for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 6. Enable Realtime Publications for story_sessions table
alter publication supabase_realtime add table story_sessions;

-- 7. Seed Initial Primary Session Record
insert into story_sessions (
  session_id,
  story_title,
  scheduled_at,
  session_status,
  current_section_id,
  current_section_index,
  total_sections,
  is_black_screen,
  selected_audio_id,
  command_seq
) values (
  'session_primary',
  'A Story for You',
  now() + interval '24 hours',
  'scheduled',
  'hero',
  0,
  5,
  false,
  'music-chimes',
  1
) on conflict (session_id) do nothing;

insert into admin_config (id)
values (gen_random_uuid())
on conflict do nothing;
