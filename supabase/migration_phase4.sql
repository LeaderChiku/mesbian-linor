-- ============================================================
-- mesbian-linor Supabase Migration: Phase 4
-- Complete Bug Fixes, Persistent Data, CMS, Collages & Twist Experience
-- Strictly additive and non-destructive
-- ============================================================

-- 1. Cryptographic Extensions
create extension if not exists "pgcrypto";

-- 2. Enhance story_sessions with Phase 4 fields
alter table story_sessions add column if not exists is_twist_active boolean not null default false;
alter table story_sessions add column if not exists ready_to_begin_at timestamptz;
alter table story_sessions add column if not exists notifications jsonb default '[]'::jsonb;
alter table story_sessions add column if not exists cms_data jsonb default '{}'::jsonb;

-- 3. Enhance story_photos for 4 Category Collages
alter table story_photos add column if not exists category_slug text default 'the-golden-hour';
alter table story_photos add column if not exists comments text;
alter table story_photos add column if not exists is_cover boolean default false;

create index if not exists idx_story_photos_category on story_photos (category_slug, order_index);

-- 4. Content Management System (CMS) Storage Table
create table if not exists cms_content (
  id          uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  section     text not null default 'general',
  title       text,
  value       text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_cms_content_key on cms_content (content_key);
create index if not exists idx_cms_content_section on cms_content (section);

-- 5. Auto-update updated_at triggers
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_cms_content_updated_at
  before update on cms_content
  for each row execute procedure handle_updated_at();

-- 6. Row Level Security for Phase 4 tables
alter table cms_content enable row level security;

-- Public can read published CMS content
drop policy if exists "Public can read cms_content" on cms_content;
create policy "Public can read cms_content"
  on cms_content for select
  using (true);

-- Only service_role can modify CMS content
drop policy if exists "Service role has full access to cms_content" on cms_content;
create policy "Service role has full access to cms_content"
  on cms_content for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 7. Seed Default 4 Categories into story_photos if table is empty
do $$
begin
  if not exists (select 1 from story_photos where category_slug = 'the-golden-hour') then
    insert into story_photos (image_url, caption, comments, category_slug, order_index, is_cover)
    values
      ('/photos/golden-hour-1.jpg', 'Where our story quietly began', 'That first warm afternoon', 'the-golden-hour', 0, true),
      ('/photos/golden-hour-2.jpg', 'Sunlight through the leaves', 'Moments suspended in time', 'the-golden-hour', 1, false);
  end if;

  if not exists (select 1 from story_photos where category_slug = 'late-night-queues') then
    insert into story_photos (image_url, caption, comments, category_slug, order_index, is_cover)
    values
      ('/photos/valorant-1.jpg', 'Overtime clutch & laughing at 2 AM', '12-12 overtime heartbeats', 'late-night-queues', 0, true),
      ('/photos/valorant-2.jpg', 'Defusing with 0.1s on the clock', 'I told you we would win it!', 'late-night-queues', 1, false);
  end if;

  if not exists (select 1 from story_photos where category_slug = 'our-little-world') then
    insert into story_photos (image_url, caption, comments, category_slug, order_index, is_cover)
    values
      ('/photos/minecraft-1.jpg', 'Little wooden houses on the hill', 'Lost in the birch forest again', 'our-little-world', 0, true),
      ('/photos/minecraft-2.jpg', 'Torches marking our way back', 'Our secret garden corner', 'our-little-world', 1, false);
  end if;

  if not exists (select 1 from story_photos where category_slug = 'folded-whispers') then
    insert into story_photos (image_url, caption, comments, category_slug, order_index, is_cover)
    values
      ('/photos/whispers-1.jpg', 'Words kept close to the chest', 'Every letter meant every word', 'folded-whispers', 0, true),
      ('/photos/whispers-2.jpg', 'A small note tucked into a book', 'Just to make you smile today', 'folded-whispers', 1, false);
  end if;
end $$;
