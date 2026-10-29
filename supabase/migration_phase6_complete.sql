-- ============================================================
-- Mesbian Linor: Phase 6 Complete Migration
-- Consolidates CMS persistence, Photo Album Schema, Audio Storage Buckets
-- Strictly additive and idempotent (safe to run multiple times)
-- ============================================================

-- 1. Cryptographic Extensions
create extension if not exists "pgcrypto";

-- 2. Ensure all columns exist on story_sessions
alter table story_sessions add column if not exists is_twist_active boolean not null default false;
alter table story_sessions add column if not exists show_dev_tools boolean not null default false;
alter table story_sessions add column if not exists ready_to_begin_at timestamptz;
alter table story_sessions add column if not exists notifications jsonb default '[]'::jsonb;
alter table story_sessions add column if not exists cms_data jsonb default '{}'::jsonb;
alter table story_sessions add column if not exists selected_audio_id text default 'music-chimes';
alter table story_sessions add column if not exists audio_command text default 'none';
alter table story_sessions add column if not exists audio_state text default 'ready';
alter table story_sessions add column if not exists audio_type text default 'music';
alter table story_sessions add column if not exists audio_volume integer not null default 80;

-- 3. Ensure all columns exist on story_photos
alter table story_photos add column if not exists category_slug text default 'the-golden-hour';
alter table story_photos add column if not exists comments text;
alter table story_photos add column if not exists is_cover boolean default false;
alter table story_photos add column if not exists date_label text;

create index if not exists idx_story_photos_category on story_photos (category_slug, order_index);

-- 4. Audio Tracks Table
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

-- Enable RLS for audio_tracks
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

-- 5. Storage Buckets (audio and photos)
-- Audio bucket (up to 50MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/flac']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/flac'];

-- Photos bucket (up to 10MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

-- Storage bucket access policies
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

drop policy if exists "Public read photos bucket" on storage.objects;
create policy "Public read photos bucket"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "Allow photos upload" on storage.objects;
create policy "Allow photos upload"
  on storage.objects for insert
  with check (bucket_id = 'photos');

drop policy if exists "Allow photos manage" on storage.objects;
create policy "Allow photos manage"
  on storage.objects for update
  using (bucket_id = 'photos');

drop policy if exists "Allow photos delete" on storage.objects;
create policy "Allow photos delete"
  on storage.objects for delete
  using (bucket_id = 'photos');
