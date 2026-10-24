-- ============================================================
-- mesbian-linor Supabase Schema
-- Phase 1 Foundation & Phase 2 Real-Time Session Architecture
-- ============================================================

-- 1. Cryptographic Extensions
create extension if not exists "pgcrypto";

-- 2. Story Sessions (Authoritative Real-Time Session Model)
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

-- Index on session_id for fast query lookup
create index if not exists idx_story_sessions_session_id on story_sessions (session_id);

-- 3. Secure Admin Configuration (Server-Only, protected by RLS)
create table if not exists admin_config (
  id                     uuid primary key default gen_random_uuid(),
  visitor_code_hash      text not null default encode(digest('739', 'sha256'), 'hex'), -- Hashed 3-digit visitor code (739)
  admin_pin_hash         text not null default encode(digest('7714', 'sha256'), 'hex'), -- Hashed 4-digit admin PIN (7714)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 4. Story Chapters & Milestones (Phase 2 & 3 Story Content)
create table if not exists story_chapters (
  id          uuid primary key default gen_random_uuid(),
  chapter_no  text not null,              -- e.g. 'Chapter I'
  title       text not null,              -- e.g. 'The Golden Hour'
  content     text,                       -- Markdown or rich narrative
  date_label  text,                       -- e.g. 'Autumn Afternoon'
  is_unlocked boolean not null default false,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_story_chapters_order on story_chapters (order_index);

-- 5. Story Scrapbook Polaroids & Photos (Phase 3 Scrapbook)
create table if not exists story_photos (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid references story_chapters(id) on delete set null,
  image_url   text not null,
  caption     text,
  date_label  text,
  rotation    numeric default 0,
  tape_style  text default 'pistachio',   -- 'pistachio', 'blush', 'none'
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_story_photos_chapter on story_photos (chapter_id, order_index);

-- 6. Auto-update updated_at timestamp trigger
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

-- 7. Row Level Security (RLS) Configuration
alter table story_sessions enable row level security;
alter table admin_config   enable row level security;
alter table story_chapters enable row level security;
alter table story_photos   enable row level security;

-- Drop existing policies if re-running for clean idempotency
drop policy if exists "Public can read session state" on story_sessions;
drop policy if exists "Service role has full access to story_sessions" on story_sessions;
drop policy if exists "Service role has full access to admin_config" on admin_config;
drop policy if exists "Public read access to chapters" on story_chapters;
drop policy if exists "Public read access to photos" on story_photos;

-- story_sessions: Public (anon) can read state; writes restricted to service_role
create policy "Public can read session state"
  on story_sessions for select
  using (true);

create policy "Service role has full access to story_sessions"
  on story_sessions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- admin_config: STRICTLY restricted to service_role (Public anon has NO access)
create policy "Service role has full access to admin_config"
  on admin_config for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Chapters and photos: Public read
create policy "Public read access to chapters"
  on story_chapters for select
  using (true);

create policy "Public read access to photos"
  on story_photos for select
  using (true);

-- 8. Enable Realtime Publications for story_sessions
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

-- 9. Seed Initial Authoritative Session Record
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

-- 10. Seed Initial Secure Admin Credentials (Visitor: 739, Admin: 7714)
insert into admin_config (visitor_code_hash, admin_pin_hash)
select 
  encode(digest('739', 'sha256'), 'hex'),
  encode(digest('7714', 'sha256'), 'hex')
where not exists (select 1 from admin_config);
