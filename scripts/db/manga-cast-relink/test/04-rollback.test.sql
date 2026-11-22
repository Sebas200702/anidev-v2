-- Guards and rollback (runs after 03-apply.test.sql, which applied one batch; the
-- before_* snapshots hold the pre-apply state).
CREATE TABLE applied_character AS TABLE "character";
CREATE TABLE applied_character_external AS TABLE character_external;
CREATE TABLE applied_manga_character AS TABLE manga_character;
CREATE TABLE applied_character_media AS TABLE character_media;

-- A second apply is refused while the batch is not rolled back.
\echo '(expected: one manga-cast-relink guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/04-apply.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_relink.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_relink.guard')
    LIKE 'manga-cast-relink: a batch is already applied%',
    current_setting('manga_cast_relink.guard');
  ASSERT all_same('applied_'), 'a refused apply writes nothing';
  ASSERT (SELECT count(*) FROM removed_links) = 9, 'a refused apply keeps the log';
END $$;

\ir ../sql/05-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'),
    'rollback restores manga_character, character, character_external, character_media';
  ASSERT (SELECT count(*) FROM removed_links) + (SELECT count(*) FROM inserted_links)
    + (SELECT count(*) FROM created_characters) + (SELECT count(*) FROM created_media) = 0,
    'rollback empties the logs';
END $$;

-- The guard is released: the same batch applies again to the same state.
\ir ../sql/04-apply.sql
DO $$
BEGIN
  ASSERT same_rows('manga_character', 'applied_manga_character')
    AND same_rows('character', 'applied_character')
    AND (SELECT count(*) FROM character_media) = 3,
    're-applying after a rollback gives the same result';
END $$;

-- A created character referenced outside the batch blocks the rollback: one case per
-- table that would cascade (a manga link the batch did not insert, an anime link, a
-- voice actor, a nickname, a media row the batch did not create).
\set statement 'INSERT INTO manga_character VALUES (30, 1000000503, ''MAIN'')'
\set undo 'DELETE FROM manga_character WHERE manga_id = 30 AND character_id > 1000000000'
\ir refusal.sql
\set statement 'INSERT INTO anime_character (anime_id, character_id, role) VALUES (1, 1000000504, ''Main'')'
\set undo 'DELETE FROM anime_character'
\ir refusal.sql
\set statement 'INSERT INTO character_voice_actor (character_id, staff_id, language) VALUES (1000000505, 1, ''Japanese'')'
\set undo 'DELETE FROM character_voice_actor'
\ir refusal.sql
\set statement 'INSERT INTO character_nickname (id, character_id, nickname) VALUES (1, 1000000503, ''K'')'
\set undo 'DELETE FROM character_nickname'
\ir refusal.sql
\set statement 'INSERT INTO character_media (character_id, media_type, src, priority) VALUES (1000000503, ''poster'', ''x.jpg'', 20)'
\set undo 'DELETE FROM character_media WHERE src = ''x.jpg'''
\ir refusal.sql

\ir ../sql/05-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'), 'the second rollback restores every table exactly';
END $$;
