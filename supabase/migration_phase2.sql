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

-- Defensively ensure all columns exist if upgrading from legacy schema
alter table story_sessions add column if not exists session_id text not null default 'session_primary';
alter table story_sessions add column if not exists story_title text not null default 'A Story for You';
alter table story_sessions add column if not exists scheduled_at timestamptz;
alter table story_sessions add column if not exists session_status text not null default 'scheduled';
alter table story_sessions add column if not exists current_section_id text not null default 'hero';
alter table story_sessions add column if not exists current_section_index integer not null default 0;
alter table story_sessions add column if not exists total_sections integer not null default 5;
alter table story_sessions add column if not exists selected_ending text;
alter table story_sessions add column if not exists is_black_screen boolean not null default false;
alter table story_sessions add column if not exists selected_audio_id text default 'music-chimes';
alter table story_sessions add column if not exists audio_command text default 'none';
alter table story_sessions add column if not exists audio_state text default 'ready';
alter table story_sessions add column if not exists audio_type text default 'music';
alter table story_sessions add column if not exists audio_volume integer not null default 80;
alter table story_sessions add column if not exists command_seq bigint not null default 1;
alter table story_sessions add column if not exists last_command text default 'INIT';

-- Fast query index
create index if not exists idx_story_sessions_session_id on story_sessions (session_id);

-- 3. Secure Admin Configuration (Server-Only, protected by RLS)
create table if not exists admin_config (
  id                     uuid primary key default gen_random_uuid(),
  visitor_code_hash      text not null default encode(digest('739', 'sha256'), 'hex'), -- Hashed 3-digit visitor code (739)
  admin_pin_hash         text not null default encode(digest('7714', 'sha256'), 'hex'), -- Hashed 4-digit admin PIN (7714)
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

create or replace trigger set_admin_config_updated_at
  before update on admin_config
  for each row execute procedure handle_updated_at();

-- 5. Row Level Security (RLS) Configuration
alter table story_sessions enable row level security;
alter table admin_config   enable row level security;

-- Drop existing policies if re-running for clean idempotency
drop policy if exists "Public can read session state" on story_sessions;
drop policy if exists "Service role has full access to story_sessions" on story_sessions;
drop policy if exists "Service role has full access to admin_config" on admin_config;

-- Visitors (Public Anon) can ONLY SELECT non-sensitive session fields
create policy "Public can read session state"
  on story_sessions for select
  using (true);

-- Visitors CANNOT directly modify session state; only service_role (server) can write
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
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'story_sessions'
    ) then
      alter publication supabase_realtime add table story_sessions;
    end if;
  end if;
end $$;

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
  null,
  'scheduled',
  'hero',
  0,
  5,
  false,
  'music-chimes',
  1
) on conflict (session_id) do nothing;

-- 8. Seed Initial Admin Configuration Row (Visitor: 739, Admin: 7714)
insert into admin_config (visitor_code_hash, admin_pin_hash)
select 
  encode(digest('739', 'sha256'), 'hex'),
  encode(digest('7714', 'sha256'), 'hex')
where not exists (select 1 from admin_config);
