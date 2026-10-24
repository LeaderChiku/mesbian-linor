-- ============================================================
-- mesbian-linor Supabase Migration: Update Access PINs
-- Safely updates visitor access code to 739 and admin PIN to 7714
-- ============================================================

-- 1. Safely update legacy story_config table ONLY IF it exists
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'story_config') then
    execute 'update story_config set access_code = ''739'', updated_at = now() where access_code is distinct from ''739''';
  end if;
end $$;

-- 2. Safely update hashed admin_config table
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'admin_config') then
    if not exists (select 1 from admin_config) then
      insert into admin_config (visitor_code_hash, admin_pin_hash)
      values (encode(digest('739', 'sha256'), 'hex'), encode(digest('7714', 'sha256'), 'hex'));
    else
      update admin_config
      set visitor_code_hash = encode(digest('739', 'sha256'), 'hex'),
          admin_pin_hash = encode(digest('7714', 'sha256'), 'hex'),
          updated_at = now();
    end if;
  end if;
end $$;
