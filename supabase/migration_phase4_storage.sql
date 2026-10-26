-- ============================================================
-- Migration: Phase 4 Supabase Storage Bucket for Photos
-- ============================================================

-- 1. Create 'photos' storage bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Drop prior conflicting storage policies
drop policy if exists "Public read photos bucket" on storage.objects;
drop policy if exists "Authenticated insert photos bucket" on storage.objects;
drop policy if exists "Service role full access photos bucket" on storage.objects;
drop policy if exists "Allow photo upload to bucket" on storage.objects;
drop policy if exists "Allow photo manage on bucket" on storage.objects;
drop policy if exists "Allow photo delete on bucket" on storage.objects;

-- 3. Allow public read access to uploaded photos
create policy "Public read photos bucket"
  on storage.objects for select
  using (bucket_id = 'photos');

-- 4. Allow server API uploads to photos bucket
create policy "Allow photo upload to bucket"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- 5. Allow update and delete on photos bucket
create policy "Allow photo manage on bucket"
  on storage.objects for update
  using (bucket_id = 'photos');

create policy "Allow photo delete on bucket"
  on storage.objects for delete
  using (bucket_id = 'photos');
