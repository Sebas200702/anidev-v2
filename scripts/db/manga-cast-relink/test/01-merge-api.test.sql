-- merge-api: api_raw (fixtures/manga-api.jsonl, loaded by run.sh) → manga_cast and
-- manga_cast_source. The latest found line of a manga wins over an earlier error.
\ir ../sql/02-merge-api.sql

DO $$
BEGIN
  ASSERT (SELECT array_agg((manga_id, status, cast_size, error)::text ORDER BY manga_id)
          FROM manga_cast_source)
    = ARRAY[(10, 'found', 7, NULL)::text, (30, 'not-found', 0, NULL)::text,
            (40, 'error', 0, 'HTTP 500')::text, (60, 'found', 0, NULL)::text],
    format('manga_cast_source: %s', (SELECT array_agg((manga_id, status, cast_size,
      error)::text ORDER BY manga_id) FROM manga_cast_source));
  ASSERT (SELECT array_agg(anilist_character_id ORDER BY anilist_character_id)
          FROM manga_cast WHERE manga_id = 10)
    = ARRAY[501, 502, 503, 504, 505, 506, 507], 'one cast row per AniList character';
  ASSERT (SELECT (role, name_full, name_native, image_url)::text FROM manga_cast
          WHERE (manga_id, anilist_character_id) = (10, 503))
    = ('SUPPORTING', 'Kenji Mori', '森',
       'https://s4.anilist.co/file/anilistcdn/character/large/b503.png')::text,
    'role, names and image come from the AniList edge';
  ASSERT (SELECT name_keys FROM manga_cast WHERE anilist_character_id = 507)
    @> ARRAY[norm_name('Doujima, Kengo'), norm_name('Dojima-san')],
    'name keys use cast_relink norm_name semantics (order, long vowels, alternatives)';
END $$;

-- Idempotent: merging the same raw input again gives the same staging.
CREATE TEMP TABLE cast_once AS SELECT * FROM manga_cast;
CREATE TEMP TABLE source_once AS SELECT * FROM manga_cast_source;
\ir ../sql/02-merge-api.sql
DO $$
BEGIN
  ASSERT same_rows('manga_cast', 'cast_once') AND same_rows('manga_cast_source',
    'source_once'), 'a second merge gives the same staging';
END $$;
