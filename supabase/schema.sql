-- ============================================================
-- mesbian-linor Supabase Schema
-- Phase 1 Foundation & Phase 2/3 Preparation
-- ============================================================

-- Enable pgcrypto for UUID generation if needed
create extension if not exists "pgcrypto";

-- ── 1. Story Configuration (Single active config row) ───────
create table if not exists story_config (
  id           uuid primary key default gen_random_uuid(),
  story_title  text not null default 'A Story for You',
  scheduled_at timestamptz,           -- NULL = immediate access; future = countdown
  access_code  text not null default '472', -- 3-digit secret passcode
  is_enabled   boolean not null default true,
  music_url    text,                  -- Optional background music URL
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at trigger
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger story_config_updated_at
  before update on story_config
  for each row execute procedure update_updated_at_column();

-- ── 2. Visitor Sessions (Phase 2 Real-Time Presence) ────────
create table if not exists story_sessions (
  id            uuid primary key default gen_random_uuid(),
  visitor_token text not null unique,     -- Client anonymous token
  device_info   text,                     -- e.g. "Mobile", "Desktop"
  current_phase text default 'loading',   -- 'loading', 'countdown', 'access', 'story'
  verified_at   timestamptz,              -- Timestamp when code verified
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ── 3. Story Chapters & Milestones (Phase 2 & 3) ────────────
create table if not exists story_chapters (
  id          uuid primary key default gen_random_uuid(),
  chapter_no  text not null,              -- e.g. 'Chapter I'
  title       text not null,              -- e.g. 'The Golden Hour'
  content     text,                       -- Markdown or rich text narrative
  date_label  text,                       -- e.g. 'Autumn Afternoon'
  is_unlocked boolean not null default false,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── 4. Story Scrapbook Polaroids & Photos (Phase 3) ─────────
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

-- ── Row Level Security (RLS) ────────────────────────────────
alter table story_config   enable row level security;
alter table story_sessions enable row level security;
alter table story_chapters enable row level security;
alter table story_photos   enable row level security;

-- Public can read enabled story config & chapters
create policy "Public read access to enabled story config"
  on story_config for select using (is_enabled = true);

create policy "Public read access to chapters"
  on story_chapters for select using (true);

create policy "Public read access to photos"
  on story_photos for select using (true);

-- Visitors can manage their own session record
create policy "Visitors can insert session"
  on story_sessions for insert with check (true);

create policy "Visitors can update own session"
  on story_sessions for update using (true);

-- ── Seed Initial Configuration Row ──────────────────────────
insert into story_config (story_title, access_code, is_enabled)
values ('A Story for You', '472', true)
on conflict do nothing;
