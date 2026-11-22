-- T3 apply (runs after 01-audit.test.sql, same schema): placeholder kanji replaced, real
-- kanji untouched, conflicts skipped and logged, AniList posters inserted, and the guard.
\ir ../sql/04-apply.sql

CREATE TEMP TABLE expected_character (mal_id integer, name_kanji text);
INSERT INTO expected_character VALUES (1, '夜神月'), (2, 'リューク'), (3, '弥海砂'),
  (4, 'Near'), (5, NULL), (6, 'L'), (7, NULL);

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM expected_character
                     EXCEPT SELECT mal_id, name_kanji FROM "character")
    AND (SELECT count(*) FROM "character") = 7,
    format('name_kanji after apply: %s', (SELECT string_agg((mal_id, name_kanji)::text, ' '
      ORDER BY mal_id) FROM "character"));
  ASSERT (SELECT array_agg((character_id, anilist_id, previous_kanji, new_kanji)::text
                           ORDER BY character_id) FROM kanji_updates)
    = ARRAY[(1, 101, NULL, '夜神月')::text, (2, 102, 'Ryuk', 'リューク')::text],
    'kanji updates are logged with the previous value';
  ASSERT (SELECT array_agg((character_id, anilist_id, natives)::text) FROM kanji_conflicts)
    = ARRAY[(4, 104, '{ニア,ネア}')::text], 'the conflict is skipped and logged';

  ASSERT (SELECT array_agg((character_id, media_type, src, size, source, priority)::text
                           ORDER BY character_id)
          FROM character_media WHERE id NOT IN (1, 2))
    = ARRAY[(1, 'poster', 'https://s4.anilist.co/c/large/b101-a.jpg', NULL, 'anilist', 30)::text,
            (3, 'poster', 'https://s4.anilist.co/c/large/b103.jpg', NULL, 'anilist', 30)::text,
            (5, 'poster', 'https://s4.anilist.co/c/large/b105.jpg', NULL, 'anilist', 30)::text],
    format('inserted posters: %s', (SELECT string_agg((character_id, src)::text, ' ')
      FROM character_media WHERE id NOT IN (1, 2)));
  ASSERT NOT EXISTS (SELECT 1 FROM character_media WHERE character_id IN (4, 6, 7)),
    'default.jpg placeholders and missing images insert nothing';
  ASSERT (SELECT array_agg((id, character_id, src)::text ORDER BY id) FROM character_media
          WHERE id IN (1, 2)) = ARRAY['(1,2,mal-2.jpg)', '(2,3,mal-3-small.jpg)'],
    'existing media rows are untouched';
  ASSERT (SELECT array_agg((m.id, m.character_id)::text ORDER BY m.id) FROM character_media m
          WHERE m.id NOT IN (1, 2))
    = (SELECT array_agg((id, character_id)::text ORDER BY id) FROM inserted_posters),
    'every inserted poster id is logged';
  ASSERT same_rows('character_external', 'before_character_external'),
    'character_external is not written';
  ASSERT (SELECT count(*) FROM applied) = 1, 'the apply is marked';
END $$;

CREATE TABLE applied_character AS TABLE "character";
CREATE TABLE applied_character_media AS TABLE character_media;

-- A second apply is refused and writes nothing.
\echo '(expected: one character-fill guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/04-apply.sql
\set ON_ERROR_STOP 1
SELECT set_config('character_fill.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('character_fill.guard')
    LIKE 'character-fill: already applied%', current_setting('character_fill.guard');
  ASSERT same_rows('character', 'applied_character')
    AND same_rows('character_media', 'applied_character_media')
    AND (SELECT count(*) FROM kanji_updates) = 2
    AND (SELECT count(*) FROM inserted_posters) = 3
    AND (SELECT count(*) FROM applied) = 1, 'a refused apply writes nothing';
END $$;
