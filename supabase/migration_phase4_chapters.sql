-- ============================================================
-- Migration: Phase 4 — Chapter Unlock Progress Persistence
-- Adds unlocked_chapter_index column to story_sessions
-- ============================================================
-- Strictly additive and non-destructive.
-- Safe to run multiple times (IF NOT EXISTS).

-- 1. Add unlocked_chapter_index column
--    0 = Prologue only; 1 = Ch 1 unlocked; 2 = Ch 2 unlocked; etc.
alter table story_sessions
  add column if not exists unlocked_chapter_index integer not null default 0;

-- 2. Seed existing rows: initialize unlocked_chapter_index from current_section_index
--    so any previous navigation progress is preserved as the unlock baseline.
update story_sessions
set unlocked_chapter_index = current_section_index
where unlocked_chapter_index = 0
  and current_section_index > 0;
