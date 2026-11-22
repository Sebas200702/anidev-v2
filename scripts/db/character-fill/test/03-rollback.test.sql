-- T3 rollback (runs after 02-apply.test.sql): restores the tables exactly, empties the logs,
-- re-applying gives the same state, and a kanji edited since the apply aborts the rollback.
\ir ../sql/05-rollback.sql

DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback restores character and character_media exactly';
  ASSERT (SELECT count(*) FROM applied) + (SELECT count(*) FROM kanji_updates)
    + (SELECT count(*) FROM kanji_conflicts) + (SELECT count(*) FROM inserted_posters) = 0,
    'rollback empties the logs';
END $$;

-- The guard is released: apply again gives the same state (new poster ids aside).
\ir ../sql/04-apply.sql
CREATE TEMP TABLE reapplied_media AS
  SELECT character_id, media_type, src, size, source, priority FROM character_media;
CREATE TEMP TABLE first_media AS
  SELECT character_id, media_type, src, size, source, priority FROM applied_character_media;
DO $$
BEGIN
  ASSERT same_rows('character', 'applied_character')
    AND same_rows('reapplied_media', 'first_media'),
    're-applying after a rollback gives the same state';
END $$;

-- Someone changes a filled kanji: the rollback aborts and changes nothing.
UPDATE "character" SET name_kanji = '月' WHERE mal_id = 1;
CREATE TABLE edited_character AS TABLE "character";
CREATE TABLE edited_character_media AS TABLE character_media;
\echo '(expected: one character-fill rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('character_fill.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('character_fill.guard')
    LIKE 'character-fill: name_kanji changed since apply%',
    current_setting('character_fill.guard');
  ASSERT same_rows('character', 'edited_character')
    AND same_rows('character_media', 'edited_character_media')
    AND (SELECT count(*) FROM kanji_updates) = 2, 'an aborted rollback changes nothing';
END $$;

-- Restoring the value lets the rollback finish exactly.
UPDATE "character" SET name_kanji = '夜神月' WHERE mal_id = 1;
\ir ../sql/05-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback after re-apply is exact';
END $$;
