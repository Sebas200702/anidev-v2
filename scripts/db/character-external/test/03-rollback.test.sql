-- T1 rollback (runs after 02-merge-twins.test.sql): restores every table exactly, empties
-- the logs, and the commands can run again.
CREATE TABLE applied_character AS TABLE "character";
CREATE TABLE applied_character_external AS
  SELECT character_id, mal_id, anilist_id, anidb_id FROM character_external;
CREATE TABLE applied_anime_character AS TABLE anime_character;
CREATE TABLE applied_manga_character AS TABLE manga_character;
CREATE TABLE applied_character_voice_actor AS TABLE character_voice_actor;
CREATE TABLE applied_character_nickname AS TABLE character_nickname;
CREATE TABLE applied_character_media AS TABLE character_media;

\ir ../sql/04-rollback.sql

DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback restores all seven tables exactly';
  ASSERT (SELECT count(*) FROM backfilled) + (SELECT count(*) FROM conflicts)
    + (SELECT count(*) FROM merge_pairs) + (SELECT count(*) FROM deleted_characters)
    + (SELECT count(*) FROM deleted_externals) + (SELECT count(*) FROM moved_anime_character)
    + (SELECT count(*) FROM skipped_anime_character)
    + (SELECT count(*) FROM moved_character_media)
    + (SELECT count(*) FROM skipped_character_media) = 0, 'rollback empties the logs';
END $$;

-- merge-twins needs a backfill first.
\echo '(expected: one character-external guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/03-merge-twins.sql
\set ON_ERROR_STOP 1
SELECT set_config('character_external.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('character_external.guard')
    LIKE 'character-external: run backfill first%',
    current_setting('character_external.guard');
  ASSERT all_same('before_'), 'a refused merge writes nothing';
END $$;

-- The guards are released: both commands apply again with the same result (timestamps
-- aside), and a rollback of a backfill-only batch is exact too.
\ir ../sql/02-backfill.sql
\ir ../sql/03-merge-twins.sql
CREATE TEMP TABLE reapplied_external AS
  SELECT character_id, mal_id, anilist_id, anidb_id FROM character_external;
DO $$
BEGIN
  ASSERT same_rows('character', 'applied_character')
    AND same_rows('reapplied_external', 'applied_character_external')
    AND same_rows('anime_character', 'applied_anime_character')
    AND same_rows('manga_character', 'applied_manga_character')
    AND same_rows('character_voice_actor', 'applied_character_voice_actor')
    AND same_rows('character_nickname', 'applied_character_nickname')
    AND same_rows('character_media', 'applied_character_media'),
    're-applying after a rollback gives the same state';
END $$;
\ir ../sql/04-rollback.sql
\ir ../sql/02-backfill.sql
\ir ../sql/04-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback after backfill only is exact';
END $$;
