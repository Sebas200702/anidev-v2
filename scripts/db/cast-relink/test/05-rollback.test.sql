-- T4: guard and rollback (runs after 04-apply.test.sql, which applied one batch and kept
-- the pre-apply snapshots links_before, characters_before, media_before in the schema).
CREATE TEMP TABLE links_applied AS SELECT * FROM anime_character;
CREATE TEMP TABLE characters_applied AS SELECT * FROM "character";
CREATE TEMP TABLE media_applied AS SELECT * FROM character_media;

-- A second apply is refused while the batch is not rolled back.
\echo '(expected: one cast-relink guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/05-apply.sql
\set ON_ERROR_STOP 1
SELECT set_config('cast_relink.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('cast_relink.guard') LIKE 'cast-relink: a batch is already applied%',
    current_setting('cast_relink.guard');
  ASSERT NOT EXISTS (SELECT * FROM links_applied EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_applied)
    AND NOT EXISTS (SELECT * FROM characters_applied EXCEPT SELECT * FROM "character")
    AND NOT EXISTS (SELECT * FROM "character" EXCEPT SELECT * FROM characters_applied)
    AND NOT EXISTS (SELECT * FROM media_applied EXCEPT SELECT * FROM character_media)
    AND NOT EXISTS (SELECT * FROM character_media EXCEPT SELECT * FROM media_applied),
    'a refused apply writes nothing';
  ASSERT (SELECT count(*) FROM removed_links) = 11, 'a refused apply keeps the log';
END $$;

\ir ../sql/06-rollback.sql

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM links_before EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_before),
    'rollback restores anime_character exactly';
  ASSERT NOT EXISTS (SELECT * FROM characters_before EXCEPT SELECT * FROM "character")
    AND NOT EXISTS (SELECT * FROM "character" EXCEPT SELECT * FROM characters_before),
    'rollback restores "character" exactly';
  ASSERT NOT EXISTS (SELECT * FROM media_before EXCEPT SELECT * FROM character_media)
    AND NOT EXISTS (SELECT * FROM character_media EXCEPT SELECT * FROM media_before),
    'rollback restores character_media exactly';
  ASSERT (SELECT count(*) FROM removed_links) + (SELECT count(*) FROM inserted_links)
    + (SELECT count(*) FROM created_characters) + (SELECT count(*) FROM created_media)
    + (SELECT count(*) FROM updated_characters) = 0, 'rollback empties the logs';
END $$;

-- The guard is released: the same batch applies again, then rolls back cleanly.
\ir ../sql/05-apply.sql
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM links_applied EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_applied),
    're-applying after a rollback gives the same links';
END $$;

-- Rows the batch did not create are never touched: a later link to a created character
-- makes the rollback refuse instead of cascading it away.
INSERT INTO anime_character (anime_id, character_id, role) VALUES (200, 1000000503, 'Main');
\echo '(expected: one cast-relink rollback error below)'
\set ON_ERROR_STOP 0
\ir ../sql/06-rollback.sql
\set ON_ERROR_STOP 1
SELECT set_config('cast_relink.rollback', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('cast_relink.rollback') LIKE 'cast-relink: created character % is referenced%',
    current_setting('cast_relink.rollback');
  ASSERT (SELECT count(*) FROM removed_links) = 11, 'a refused rollback keeps the log';
  ASSERT EXISTS (SELECT 1 FROM "character" WHERE mal_id = 1000000503),
    'a refused rollback deletes nothing';
END $$;
DELETE FROM anime_character WHERE (anime_id, character_id, role) = (200, 1000000503, 'Main');
\ir ../sql/06-rollback.sql
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM links_before EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_before)
    AND NOT EXISTS (SELECT * FROM characters_before EXCEPT SELECT * FROM "character")
    AND NOT EXISTS (SELECT * FROM "character" EXCEPT SELECT * FROM characters_before)
    AND NOT EXISTS (SELECT * FROM media_before EXCEPT SELECT * FROM character_media)
    AND NOT EXISTS (SELECT * FROM character_media EXCEPT SELECT * FROM media_before),
    'the second rollback restores every table exactly';
END $$;
