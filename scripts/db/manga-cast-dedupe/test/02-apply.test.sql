-- apply (runs after 01-audit.test.sql, same schema): kind B merges S into R and sets
-- R's AniList id, then kind A removes the UPPERCASE twin rows; everything is logged.
\ir ../sql/04-apply.sql

CREATE TEMP TABLE expected_manga (manga_id integer, character_id integer, role text);
INSERT INTO expected_manga VALUES (10, 1, 'Main'), (11, 1, 'Main'), (12, 1, 'SUPPORTING'),
  (20, 2, 'Supporting'), (10, 3, 'Supporting'), (10, 1000000953, 'BACKGROUND'),
  (10, 4, 'Supporting'), (10, 1000000503, 'SUPPORTING'), (10, 5, 'Main'), (11, 5, 'Main'),
  (10, 1000000960, 'MAIN'), (10, 6, 'Supporting'), (30, 7, 'Main'), (30, 8, 'Supporting'),
  (30, 1000000970, 'MAIN');
CREATE TEMP TABLE expected_anime (anime_id integer, character_id integer, role text);
INSERT INTO expected_anime VALUES (50, 1, 'Main'), (50, 1, 'MAIN'), (51, 2, 'MAIN');
CREATE TEMP TABLE expected_voice (character_id integer, staff_id integer, language text);
INSERT INTO expected_voice VALUES (1, 900, 'Japanese'), (1, 901, 'English');
CREATE TEMP TABLE expected_nickname (id integer, character_id integer, nickname text);
INSERT INTO expected_nickname VALUES (1, 1, 'Chibi'), (3, 1, 'Shrimpy');

DO $$
BEGIN
  ASSERT same_rows('manga_character', 'expected_manga'), format('manga_character: %s',
    (SELECT string_agg(format('(%s,%s,%s)', manga_id, character_id, role), ' ')
     FROM manga_character));
  ASSERT same_rows('anime_character', 'expected_anime'), 'anime_character moved';
  ASSERT same_rows('character_voice_actor', 'expected_voice'), 'voice actors moved';
  ASSERT same_rows('character_nickname', 'expected_nickname'), 'nicknames moved, ids kept';
  ASSERT (SELECT array_agg(format('%s:%s:%s:%s', id, character_id, src, size) ORDER BY id)
          FROM character_media) = ARRAY['1:1:h.jpg:', '3:1:h2.jpg:large'],
    'media moved with its columns, duplicate skipped';
  ASSERT NOT EXISTS (SELECT 1 FROM "character" WHERE mal_id IN (1000000950, 1000000507))
    AND (SELECT count(*) FROM "character") = 12, 'merged synthetics are deleted';
  ASSERT (SELECT about FROM "character" WHERE mal_id = 1) = 'MAL bio',
    'the real character row is not changed';
  ASSERT (SELECT anilist_id FROM character_external WHERE character_id = 1) = 950
    AND (SELECT anilist_id FROM character_external WHERE character_id = 2) = 507
    AND (SELECT anilist_id FROM character_external WHERE character_id = 4) = 999
    AND (SELECT count(*) FROM character_external WHERE anilist_id IS NOT NULL) = 7,
    'R gets X; an existing AniList id is respected; untouched rows keep theirs';
  ASSERT (SELECT count(*) FROM character_external) = (SELECT count(*) FROM "character"),
    'the synthetic external rows are gone with their characters';
  ASSERT (SELECT array_agg(format('%s/%s/%s:%s', manga_id, character_id, role, reason)
            ORDER BY manga_id, character_id) FROM removed_links) = ARRAY[
      '10/1/MAIN:merged-pair', '10/6/SUPPORTING:same-pair', '11/1/MAIN:same-pair',
      '20/2/SUPPORTING:merged-pair'], 'kind A rows removed and logged';
  ASSERT (SELECT count(*) FROM batches) = 1
    AND (SELECT count(*) FROM merged_pairs) = 2
    AND (SELECT count(*) FROM updated_externals) = 2
    AND (SELECT count(*) FROM deleted_characters) = 2
    AND (SELECT count(*) FROM deleted_externals) = 2
    AND (SELECT count(*) FROM moved_manga_character) = 3
    AND (SELECT count(*) FROM skipped_manga_character) = 1
    AND (SELECT count(*) FROM moved_anime_character) = 2
    AND (SELECT count(*) FROM skipped_anime_character) = 1
    AND (SELECT count(*) FROM moved_character_voice_actor) = 1
    AND (SELECT count(*) FROM skipped_character_voice_actor) = 1
    AND (SELECT count(*) FROM moved_character_nickname) = 1
    AND (SELECT count(*) FROM skipped_character_nickname) = 1
    AND (SELECT count(*) FROM moved_character_media) = 1
    AND (SELECT count(*) FROM skipped_character_media) = 1,
    'every moved, skipped, deleted and updated row is logged';
  ASSERT NOT EXISTS (SELECT 1 FROM merged_pairs WHERE batch_id <> 1)
    AND NOT EXISTS (SELECT 1 FROM moved_manga_character WHERE batch_id <> 1),
    'logs carry the batch id';
END $$;

SELECT snapshot('applied_') \g /dev/null
