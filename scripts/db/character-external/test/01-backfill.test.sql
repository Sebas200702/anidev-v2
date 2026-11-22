-- T1 backfill: real and synthetic rows, cast-derived ids (L7), shared-AniList conflicts,
-- twins and the guard.
\ir fixtures.sql
\ir ../sql/01-log.sql
\ir ../sql/02-backfill.sql

CREATE TEMP TABLE expected_external (character_id integer, mal_id integer, anilist_id integer);
INSERT INTO expected_external VALUES
  (1, 1, 501), (2, 2, NULL), (3, 3, NULL), (4, 4, NULL), (5, 5, 600), (6, 6, 502),
  (7, 7, 950), (8, 8, NULL), (9, 9, NULL), (10, 10, NULL), (11, 11, NULL), (12, 12, NULL),
  (13, 13, NULL), (14, 14, NULL), (1000000501, NULL, NULL), (1000000502, NULL, NULL),
  (1000000700, NULL, 700), (1000000800, NULL, 800), (1000000950, NULL, NULL);

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM expected_external
                     EXCEPT SELECT character_id, mal_id, anilist_id FROM character_external)
    AND NOT EXISTS (SELECT character_id, mal_id, anilist_id FROM character_external
                    EXCEPT SELECT * FROM expected_external),
    format('character_external after backfill: %s', (SELECT string_agg(
      format('(%s,%s,%s)', character_id, mal_id, anilist_id), ' ' ORDER BY character_id)
      FROM character_external));
  ASSERT NOT EXISTS (SELECT 1 FROM character_external
                     WHERE anidb_id IS NOT NULL OR created_at IS NULL OR updated_at IS NULL),
    'anidb_id stays NULL and timestamps are set';
  ASSERT (SELECT array_agg((character_id, anilist_id, reason)::text
                           ORDER BY character_id, reason) FROM conflicts)
    = ARRAY['(3,700,shared-anilist)', '(4,700,shared-anilist)', '(5,960,cast-disagrees)',
            '(11,970,shared-anilist)', '(12,970,shared-anilist)', '(13,610,shared-anilist)',
            '(14,610,shared-anilist)', '(1000000501,501,twin-pending-merge)',
            '(1000000502,502,twin-pending-merge)', '(1000000700,700,ambiguous-twin)',
            '(1000000950,950,twin-pending-merge)'],
    format('conflicts: %s', (SELECT string_agg((character_id, anilist_id, reason)::text,
      ' ' ORDER BY character_id, reason) FROM conflicts));
  ASSERT (SELECT count(*) FROM backfilled) = 19, 'every inserted row is logged';
  ASSERT (SELECT array_agg((character_id, id_source)::text ORDER BY character_id)
          FROM backfilled WHERE id_source IS NOT NULL)
    = ARRAY['(1,character)', '(5,character)', '(6,character)', '(7,cast)',
            '(1000000700,synthetic)', '(1000000800,synthetic)'],
    format('id_source: %s', (SELECT string_agg((character_id, id_source)::text, ' '
      ORDER BY character_id) FROM backfilled WHERE id_source IS NOT NULL));
  ASSERT same_rows('character', 'before_character')
    AND same_rows('anime_character', 'before_anime_character')
    AND same_rows('manga_character', 'before_manga_character')
    AND same_rows('character_voice_actor', 'before_character_voice_actor')
    AND same_rows('character_nickname', 'before_character_nickname')
    AND same_rows('character_media', 'before_character_media'),
    'backfill writes only character_external';
END $$;

CREATE TABLE backfilled_external AS TABLE character_external;

-- A second backfill is refused and writes nothing.
\echo '(expected: one character-external guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/02-backfill.sql
\set ON_ERROR_STOP 1
SELECT set_config('character_external.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('character_external.guard')
    LIKE 'character-external: backfill is already applied%',
    current_setting('character_external.guard');
  ASSERT same_rows('character_external', 'backfilled_external')
    AND (SELECT count(*) FROM backfilled) = 19 AND (SELECT count(*) FROM conflicts) = 11,
    'a refused backfill writes nothing';
END $$;
