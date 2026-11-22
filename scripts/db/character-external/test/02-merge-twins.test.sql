-- T1 merge-twins (runs after 01-backfill.test.sql, same schema): links move from the
-- synthetic twin to the real character, duplicates are skipped, the synthetic is deleted.
\ir ../sql/03-merge-twins.sql

CREATE TEMP TABLE expected_anime (anime_id integer, character_id integer, role text);
INSERT INTO expected_anime VALUES (10, 1, 'Main'), (10, 1, 'MAIN'), (20, 1, 'SUPPORTING'),
  (10, 1000000700, 'MAIN'), (40, 1000000800, 'MAIN'), (40, 2, 'Main');
CREATE TEMP TABLE expected_manga (manga_id integer, character_id integer, role text);
INSERT INTO expected_manga VALUES (30, 1, 'MAIN'), (31, 1, 'MAIN'), (32, 6, 'SUPPORTING'),
  (33, 3, 'MAIN');
CREATE TEMP TABLE expected_voice (character_id integer, staff_id integer, language text);
INSERT INTO expected_voice VALUES (1, 900, 'Japanese'), (1, 901, 'English'),
  (6, 902, 'Japanese');
CREATE TEMP TABLE expected_nickname (id integer, character_id integer, nickname text);
INSERT INTO expected_nickname VALUES (1, 1, 'Ace'), (3, 1, 'Spade'), (4, 6, 'Dee'),
  (5, 1000000700, 'Ex');
CREATE TEMP TABLE expected_media (id integer, character_id integer, src text);
INSERT INTO expected_media VALUES (1, 1, 'a.jpg'), (3, 1, 'b.jpg'), (4, 6, 'd.jpg');

DO $$
BEGIN
  ASSERT (SELECT array_agg((synthetic_id, real_id)::text ORDER BY synthetic_id)
          FROM merge_pairs) = ARRAY['(1000000501,1)', '(1000000502,6)'],
    'only unambiguous twins are merged (1000000700 has two real candidates)';
  ASSERT same_rows('anime_character', 'expected_anime'), format('anime_character: %s',
    (SELECT string_agg(format('(%s,%s,%s)', anime_id, character_id, role), ' ')
     FROM anime_character));
  ASSERT same_rows('manga_character', 'expected_manga'), 'manga_character moved';
  ASSERT same_rows('character_voice_actor', 'expected_voice'), 'voice actors moved';
  ASSERT same_rows('character_nickname', 'expected_nickname'), 'nicknames moved, ids kept';
  ASSERT NOT EXISTS (SELECT * FROM expected_media
                     EXCEPT SELECT id, character_id, src FROM character_media)
    AND (SELECT count(*) FROM character_media) = 3, 'media moved, ids kept';
  ASSERT (SELECT (media_type, size, source, priority)::text FROM character_media
          WHERE id = 4) = '(poster,large,anilist,30)', 'moved media keeps its columns';
  ASSERT NOT EXISTS (SELECT 1 FROM "character" WHERE mal_id IN (1000000501, 1000000502))
    AND (SELECT count(*) FROM "character") = 8, 'synthetic twins are deleted';
  ASSERT (SELECT about FROM "character" WHERE mal_id = 1) = 'MAL bio',
    'the real character row is not changed';
  ASSERT (SELECT count(*) FROM character_external) = (SELECT count(*) FROM "character")
    AND (SELECT anilist_id FROM character_external WHERE character_id = 1) = 501
    AND (SELECT anilist_id FROM character_external WHERE character_id = 6) = 502,
    'the real twin keeps the AniList id; the synthetic external row is gone';
  ASSERT (SELECT count(*) FROM moved_anime_character) = 2
    AND (SELECT count(*) FROM skipped_anime_character) = 1
    AND (SELECT count(*) FROM moved_manga_character) = 2
    AND (SELECT count(*) FROM skipped_manga_character) = 1
    AND (SELECT count(*) FROM moved_character_voice_actor) = 2
    AND (SELECT count(*) FROM skipped_character_voice_actor) = 1
    AND (SELECT count(*) FROM moved_character_nickname) = 2
    AND (SELECT count(*) FROM skipped_character_nickname) = 1
    AND (SELECT count(*) FROM moved_character_media) = 2
    AND (SELECT count(*) FROM skipped_character_media) = 1
    AND (SELECT count(*) FROM deleted_characters) = 2
    AND (SELECT count(*) FROM deleted_externals) = 2,
    'every moved, skipped and deleted row is logged';
  ASSERT (SELECT (anime_id, character_id, role)::text FROM skipped_anime_character)
    = '(10,1000000501,Main)', 'the duplicate link is logged with the synthetic id';
END $$;

CREATE TABLE merged_character AS TABLE "character";
CREATE TABLE merged_anime_character AS TABLE anime_character;

-- A second merge is refused and writes nothing.
\echo '(expected: one character-external guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/03-merge-twins.sql
\set ON_ERROR_STOP 1
SELECT set_config('character_external.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('character_external.guard')
    LIKE 'character-external: twins are already merged%',
    current_setting('character_external.guard');
  ASSERT same_rows('character', 'merged_character')
    AND same_rows('anime_character', 'merged_anime_character')
    AND (SELECT count(*) FROM merge_pairs) = 2, 'a refused merge writes nothing';
END $$;
