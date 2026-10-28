-- ============================================================
-- Migration: Phase 5 — Audio Library & DevTools Visibility Control
-- Strictly additive and non-destructive
-- ============================================================

-- 1. Create Audio Tracks Table for MP3 & Music Library
create table if not exists audio_tracks (
  id               text primary key,
  title            text not null,
  description      text,
  storage_url      text not null,
  duration_seconds integer,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_audio_tracks_order on audio_tracks (order_index);

-- 2. Configure RLS for audio_tracks
alter table audio_tracks enable row level security;

drop policy if exists "Public can read audio tracks" on audio_tracks;
create policy "Public can read audio tracks"
  on audio_tracks for select
  using (true);

drop policy if exists "Allow server api insert to audio_tracks" on audio_tracks;
create policy "Allow server api insert to audio_tracks"
  on audio_tracks for insert
  with check (true);

drop policy if exists "Allow server api update to audio_tracks" on audio_tracks;
create policy "Allow server api update to audio_tracks"
  on audio_tracks for update
  using (true)
  with check (true);

drop policy if exists "Allow server api delete to audio_tracks" on audio_tracks;
create policy "Allow server api delete to audio_tracks"
  on audio_tracks for delete
  using (true);

-- 3. Add show_dev_tools column to story_sessions
alter table story_sessions
  add column if not exists show_dev_tools boolean not null default false;

-- 4. Create 'audio' storage bucket for uploaded MP3 files (50MB limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  52428800, -- 50MB limit
  array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/flac']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/flac'];

-- 5. Storage policies for audio bucket
drop policy if exists "Public read audio bucket" on storage.objects;
create policy "Public read audio bucket"
  on storage.objects for select
  using (bucket_id = 'audio');

drop policy if exists "Allow audio upload" on storage.objects;
create policy "Allow audio upload"
  on storage.objects for insert
  with check (bucket_id = 'audio');

drop policy if exists "Allow audio manage" on storage.objects;
create policy "Allow audio manage"
  on storage.objects for update
  using (bucket_id = 'audio');

drop policy if exists "Allow audio delete" on storage.objects;
create policy "Allow audio delete"
  on storage.objects for delete
  using (bucket_id = 'audio');
