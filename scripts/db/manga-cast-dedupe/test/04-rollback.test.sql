-- rollback (runs after 03-guard.test.sql): refuses on drift, then undoes the last batch
-- exactly, one batch per run; a re-apply gives the same state again.
CREATE TABLE batch2_character_external AS TABLE character_external;

-- Drift: R's AniList id changed after the apply → refused, nothing written.
UPDATE character_external SET anilist_id = NULL WHERE character_id = 9;
\echo '(expected: one manga-cast-dedupe rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_dedupe.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_dedupe.guard') LIKE
    'manga-cast-dedupe: rollback refused: character_external of 9 changed since the apply',
    current_setting('manga_cast_dedupe.guard');
  ASSERT (SELECT count(*) FROM batches) = 2
    AND (SELECT count(*) FROM removed_links WHERE batch_id = 2) = 2,
    'a refused rollback keeps the logs';
END $$;
UPDATE character_external SET anilist_id = 980 WHERE character_id = 9;
DO $$ BEGIN
  ASSERT same_rows('character_external', 'batch2_character_external'), 'drift undone';
END $$;

-- Rollback of batch 2 restores the state after the new MAL rows exactly.
\ir ../sql/05-rollback.sql
DO $$
BEGIN
  ASSERT all_same('loaded_'), 'rollback of batch 2 is exact (both directions)';
  ASSERT (SELECT array_agg(batch_id) FROM batches) = ARRAY[1], 'only batch 1 remains';
  ASSERT NOT EXISTS (SELECT 1 FROM removed_links WHERE batch_id = 2)
    AND NOT EXISTS (SELECT 1 FROM merged_pairs WHERE batch_id = 2), 'batch 2 logs emptied';
END $$;

-- Drop the arrived rows, then batch 1: back to the fixtures exactly.
DELETE FROM :"relink_schema".manga_cast WHERE manga_id = 41;
DELETE FROM manga_character WHERE manga_id IN (40, 41);
DELETE FROM "character" WHERE mal_id IN (9, 1000000980);
DO $$ BEGIN ASSERT all_same('applied_'), 'back to the batch 1 state'; END $$;

-- Drift: a row the batch moved to R was removed since the apply → refused.
DELETE FROM manga_character WHERE (manga_id, character_id, role) = (12, 1, 'SUPPORTING');
\echo '(expected: one manga-cast-dedupe rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_dedupe.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
INSERT INTO manga_character VALUES (12, 1, 'SUPPORTING');
DO $$
BEGIN
  ASSERT current_setting('manga_cast_dedupe.guard') LIKE
    'manga-cast-dedupe: rollback refused: a moved manga_character row changed since the apply',
    current_setting('manga_cast_dedupe.guard');
  ASSERT all_same('applied_') AND (SELECT count(*) FROM batches) = 1,
    'a refused rollback writes nothing';
END $$;
\ir ../sql/05-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback of batch 1 restores all seven tables exactly';
  ASSERT NOT EXISTS (SELECT 1 FROM batches) AND NOT EXISTS (SELECT 1 FROM removed_links)
    AND NOT EXISTS (SELECT 1 FROM merged_pairs) AND NOT EXISTS (SELECT 1 FROM moved_manga_character)
    AND NOT EXISTS (SELECT 1 FROM skipped_character_media)
    AND NOT EXISTS (SELECT 1 FROM deleted_characters)
    AND NOT EXISTS (SELECT 1 FROM updated_externals), 'logs emptied';
END $$;

-- Nothing left to roll back → refused.
\echo '(expected: one manga-cast-dedupe rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_dedupe.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_dedupe.guard')
    LIKE 'manga-cast-dedupe: rollback refused: no batch to roll back',
    current_setting('manga_cast_dedupe.guard');
  ASSERT all_same('before_'), 'a refused rollback writes nothing';
END $$;

-- Re-applying after the rollback gives the same state (timestamps aside).
\ir ../sql/04-apply.sql
CREATE TEMP TABLE reapplied_external AS
  SELECT character_id, mal_id, anilist_id, anidb_id, created_at FROM character_external;
CREATE TEMP TABLE applied_external_cols AS
  SELECT character_id, mal_id, anilist_id, anidb_id, created_at FROM applied_character_external;
DO $$
BEGIN
  ASSERT same_rows('character', 'applied_character')
    AND same_rows('reapplied_external', 'applied_external_cols')
    AND same_rows('manga_character', 'applied_manga_character')
    AND same_rows('anime_character', 'applied_anime_character')
    AND same_rows('character_voice_actor', 'applied_character_voice_actor')
    AND same_rows('character_nickname', 'applied_character_nickname')
    AND same_rows('character_media', 'applied_character_media'),
    're-applying after a rollback gives the same state';
END $$;
